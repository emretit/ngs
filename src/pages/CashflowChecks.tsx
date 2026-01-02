import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import IncomingCheckDialog from "@/components/cashflow/checks/IncomingCheckDialog";
import OutgoingCheckDialog from "@/components/cashflow/checks/OutgoingCheckDialog";
import CheckTransferDialog from "@/components/cashflow/checks/CheckTransferDialog";
import { useTranslation } from "react-i18next";
import { useChecksFilters } from "@/hooks/cashflow/useChecksFilters";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import ChecksHeader from "@/components/cashflow/checks/ChecksHeader";
import { ChecksFilterBar } from "@/components/cashflow/checks/ChecksFilterBar";
import ChecksContent from "@/components/cashflow/checks/ChecksContent";
import { Check } from "@/types/check";

interface Bank {
  id: string;
  name: string;
  short_name?: string | null;
}

const CashflowChecks = () => {
  const { t } = useTranslation();
  const [incomingCheckDialog, setIncomingCheckDialog] = useState(false);
  const [outgoingCheckDialog, setOutgoingCheckDialog] = useState(false);
  const [transferDialog, setTransferDialog] = useState(false);
  const [checkToTransfer, setCheckToTransfer] = useState<Check | null>(null);
  const [editingIncomingCheck, setEditingIncomingCheck] = useState<Check | null>(null);
  const [editingOutgoingCheck, setEditingOutgoingCheck] = useState<Check | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [checkToDelete, setCheckToDelete] = useState<Check | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch checks
  const { data: checks = [], isLoading: checksLoading } = useQuery({
    queryKey: ["checks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checks")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data as unknown as Check[]) || [];
    },
  });

  const deleteCheckMutation = useMutation({
    mutationFn: async (id: string) => {
      // Önce ilişkili payment kayıtlarını sil
      const { error: paymentError } = await supabase
        .from("payments")
        .delete()
        .eq("check_id", id);

      if (paymentError) throw paymentError;

      // Sonra çek kaydını sil
      const { error } = await supabase.from("checks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: t("toast.success"), description: t("cashflow.checkDeleted") });
      setIsDeleteDialogOpen(false);
      setCheckToDelete(null);
    },
    onError: () => {
      setIsDeleteDialogOpen(false);
      setCheckToDelete(null);
    },
  });

  const handleDeleteClick = (id: string) => {
    const check = checks.find(c => c.id === id);
    if (check) {
      setCheckToDelete(check);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (checkToDelete) {
      deleteCheckMutation.mutate(checkToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setCheckToDelete(null);
  };

  // Tüm çekler için filtreleme
  const filters = useChecksFilters({ checks });

  // Tüm durum seçenekleri (gelen ve giden birleşik)
  const allStatusOptions = [
    { value: "all", label: "Tüm Durumlar" },
    { value: "portfoyde", label: "📄 Portföyde" },
    { value: "bankaya_verildi", label: "🏦 Bankaya Verildi" },
    { value: "tahsil_edildi", label: "✅ Tahsil Edildi" },
    { value: "odenecek", label: "⏳ Ödenecek" },
    { value: "odendi", label: "✅ Ödendi" },
    { value: "ciro_edildi", label: "🔄 Ciro Edildi" },
    { value: "karsilik_yok", label: "❌ Karşılıksız" },
  ];

  // Özet hesaplamaları - tüm çeklerden (filtrelenmemiş)
  const allIncomingChecks = useMemo(() => 
    checks.filter(c => c.check_type === 'incoming'), 
    [checks]
  );
  const allOutgoingChecks = useMemo(() => 
    checks.filter(c => c.check_type === 'outgoing'), 
    [checks]
  );

  const incomingTotal = useMemo(() => 
    allIncomingChecks.reduce((sum, check) => sum + check.amount, 0), 
    [allIncomingChecks]
  );
  const outgoingTotal = useMemo(() => 
    allOutgoingChecks.reduce((sum, check) => sum + check.amount, 0), 
    [allOutgoingChecks]
  );

  const handleEdit = (check: Check) => {
    if (check.check_type === 'incoming') {
      setEditingIncomingCheck(check);
      setIncomingCheckDialog(true);
    } else {
      setEditingOutgoingCheck(check);
      setOutgoingCheckDialog(true);
    }
  };

  const handleQuickAction = (check: Check) => {
    if (check.check_type === 'incoming' && check.status === 'portfoyde') {
      // Ciro işlemi için ayrı dialog aç
      setCheckToTransfer(check);
      setTransferDialog(true);
    } else if (check.check_type === 'outgoing' && check.status === 'odenecek') {
      // Ödeme işlemi için düzenleme dialog'u aç (durumu ödendi yap)
      setEditingOutgoingCheck({ ...check, status: "odendi" });
      setOutgoingCheckDialog(true);
    }
  };

  const handleCheckSelect = (check: Check) => {
    // Detay sayfası veya modal açılabilir
    handleEdit(check);
  };

  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <ChecksHeader 
          incomingCount={allIncomingChecks.length}
          incomingTotal={incomingTotal}
          outgoingCount={allOutgoingChecks.length}
          outgoingTotal={outgoingTotal}
          onAddIncoming={() => {
            setEditingIncomingCheck(null);
            setIncomingCheckDialog(true);
          }}
          onAddOutgoing={() => {
            setEditingOutgoingCheck(null);
            setOutgoingCheckDialog(true);
          }}
        />

        {/* Filters */}
        <ChecksFilterBar
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          statusFilter={filters.statusFilter}
          onStatusChange={filters.setStatusFilter}
          startDate={filters.startDate}
          onStartDateChange={filters.setStartDate}
          endDate={filters.endDate}
          onEndDateChange={filters.setEndDate}
          searchPlaceholder="Çek no, keşideci, lehtar veya banka ile ara..."
          statusOptions={allStatusOptions}
          checkTypeFilter={filters.checkTypeFilter}
          onCheckTypeChange={filters.setCheckTypeFilter}
        />

        {checksLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Çekler yükleniyor...</p>
            </div>
          </div>
        ) : (
          <ChecksContent
            checks={filters.filteredChecks}
            isLoading={checksLoading}
            totalCount={filters.filteredChecks.length}
            error={null}
            onCheckSelect={handleCheckSelect}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onQuickAction={handleQuickAction}
            searchQuery={filters.searchQuery}
            statusFilter={filters.statusFilter}
            checkTypeFilter={filters.checkTypeFilter}
          />
        )}
      </div>

      {/* Incoming Check Dialog */}
      <IncomingCheckDialog
        open={incomingCheckDialog}
        onOpenChange={setIncomingCheckDialog}
        editingCheck={editingIncomingCheck}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["checks"] });
          setEditingIncomingCheck(null);
        }}
      />

      {/* Outgoing Check Dialog */}
      <OutgoingCheckDialog
        open={outgoingCheckDialog}
        onOpenChange={setOutgoingCheckDialog}
        editingCheck={editingOutgoingCheck}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["checks"] });
          setEditingOutgoingCheck(null);
        }}
      />

      {/* Transfer Dialog (Ciro) */}
      <CheckTransferDialog
        open={transferDialog}
        onOpenChange={setTransferDialog}
        check={checkToTransfer}
        onSuccess={() => {
          setCheckToTransfer(null);
          queryClient.invalidateQueries({ queryKey: ["checks"] });
        }}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Çeki Sil"
        description={
          checkToDelete
            ? `"${checkToDelete.check_number}" numaralı çeki silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu çeki silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deleteCheckMutation.isPending}
      />
    </>
  );
};

export default CashflowChecks;

