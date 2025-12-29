import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/cashflowUtils";
import CheckCreateDialog, { CheckRecord } from "@/components/shared/CheckCreateDialog";
import { useTranslation } from "react-i18next";
import { ChecksSummaryCard } from "@/components/cashflow/checks/ChecksSummaryCard";
import { useChecksFilters } from "@/hooks/cashflow/useChecksFilters";

interface Check {
  id: string;
  check_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  bank: string;
  issuer_name?: string;
  payee: string;
  status: string;
  notes?: string;
  created_at: string;
  check_type?: 'incoming' | 'outgoing';
}

interface Bank {
  id: string;
  name: string;
  short_name?: string | null;
}

const CashflowChecks = () => {
  const { t } = useTranslation();
  const [checkDialog, setCheckDialog] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [checkStatus, setCheckStatus] = useState("pending");
  const [checkType, setCheckType] = useState<"incoming" | "outgoing">("incoming");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch checks
  const { data: checks = [] } = useQuery({
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
      const { error } = await supabase.from("checks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checks"] });
      toast({ title: t("toast.success"), description: t("cashflow.checkDeleted") });
    },
  });

  // Gelen/Giden çekler (check_type alanına göre)
  const allIncomingChecks = checks.filter(check => check.check_type === 'incoming');
  const allOutgoingChecks = checks.filter(check => check.check_type === 'outgoing');

  // Filtreleme hook'ları
  const incomingFilters = useChecksFilters({ checks: allIncomingChecks, checkType: "incoming" });
  const outgoingFilters = useChecksFilters({ checks: allOutgoingChecks, checkType: "outgoing" });

  // Gelen çekler için durum konfigürasyonu
  const incomingStatusConfig = [
    {
      key: "portfoyde",
      label: "Portföyde",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-600",
      textColorDark: "text-orange-700",
    },
    {
      key: "bankaya_verildi",
      label: "Bankaya",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      textColorDark: "text-blue-700",
    },
    {
      key: "tahsil_edildi",
      label: "Tahsil",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      textColorDark: "text-green-700",
    },
    {
      key: "ciro_edildi",
      label: "Ciro",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      textColorDark: "text-purple-700",
    },
  ];

  // Giden çekler için durum konfigürasyonu
  const outgoingStatusConfig = [
    {
      key: "odenecek",
      label: "Ödenecek",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-600",
      textColorDark: "text-orange-700",
    },
    {
      key: "odendi",
      label: "Ödendi",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      textColorDark: "text-green-700",
    },
    {
      key: "karsilik_yok",
      label: "Karşılıksız",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-600",
      textColorDark: "text-red-700",
    },
    {
      key: "ciro_edildi",
      label: "Ciro",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      textColorDark: "text-purple-700",
    },
  ];

  const incomingStatusOptions = [
    { value: "all", label: "Durumlar" },
    { value: "portfoyde", label: "Portföyde" },
    { value: "bankaya_verildi", label: "Bankaya Verildi" },
    { value: "tahsil_edildi", label: "Tahsil Edildi" },
    { value: "ciro_edildi", label: "Ciro Edildi" },
    { value: "karsilik_yok", label: "Karşılıksız" },
  ];

  const outgoingStatusOptions = [
    { value: "all", label: "Durumlar" },
    { value: "odenecek", label: "Ödenecek" },
    { value: "odendi", label: "Ödendi" },
    { value: "karsilik_yok", label: "Karşılıksız" },
    { value: "ciro_edildi", label: "Ciro Edildi" },
  ];

  const incomingIcon = (
    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const outgoingIcon = (
    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {/* Gelen Çekler Kartı */}
        <ChecksSummaryCard
          title="Gelen Çekler"
          description="Müşterilerden aldığımız çekler"
          icon={incomingIcon}
          iconBgColor="bg-gradient-to-br from-green-500 to-emerald-600"
          checks={incomingFilters.filteredChecks}
          totalAmount={incomingFilters.filteredChecks.reduce((sum, check) => sum + check.amount, 0)}
          statusConfig={incomingStatusConfig}
          checkType="incoming"
          searchQuery={incomingFilters.searchQuery}
          onSearchChange={incomingFilters.setSearchQuery}
          statusFilter={incomingFilters.statusFilter}
          onStatusChange={incomingFilters.setStatusFilter}
          startDate={incomingFilters.startDate}
          onStartDateChange={incomingFilters.setStartDate}
          endDate={incomingFilters.endDate}
          onEndDateChange={incomingFilters.setEndDate}
          searchPlaceholder="Çek no, keşideci veya banka ile ara..."
          statusOptions={incomingStatusOptions}
          onAddNew={() => {
            setEditingCheck(null);
            setCheckType("incoming");
            setCheckStatus("portfoyde");
            setCheckDialog(true);
          }}
          onEdit={(check) => {
            setEditingCheck(check);
            setCheckStatus(check.status);
            setCheckType("incoming");
            setCheckDialog(true);
          }}
          onDelete={(id) => deleteCheckMutation.mutate(id)}
          onQuickAction={(check) => {
            setEditingCheck(check);
            setCheckStatus("ciro_edildi");
            setCheckType("incoming");
            setCheckDialog(true);
          }}
          quickActionLabel="Ciro Et"
          sectionTitle="Portföydeki Çekler"
          emptyMessage="Henüz gelen çek bulunmuyor"
          totalAmountColor="text-green-600"
        />

        {/* Giden Çekler Kartı */}
        <ChecksSummaryCard
          title="Giden Çekler"
          description="Tedarikçilere verdiğimiz çekler"
          icon={outgoingIcon}
          iconBgColor="bg-gradient-to-br from-blue-500 to-indigo-600"
          checks={outgoingFilters.filteredChecks}
          totalAmount={outgoingFilters.filteredChecks.reduce((sum, check) => sum + check.amount, 0)}
          statusConfig={outgoingStatusConfig}
          checkType="outgoing"
          searchQuery={outgoingFilters.searchQuery}
          onSearchChange={outgoingFilters.setSearchQuery}
          statusFilter={outgoingFilters.statusFilter}
          onStatusChange={outgoingFilters.setStatusFilter}
          startDate={outgoingFilters.startDate}
          onStartDateChange={outgoingFilters.setStartDate}
          endDate={outgoingFilters.endDate}
          onEndDateChange={outgoingFilters.setEndDate}
          searchPlaceholder="Çek no, lehtar veya banka ile ara..."
          statusOptions={outgoingStatusOptions}
          onAddNew={() => {
            setEditingCheck(null);
            setCheckType("outgoing");
            setCheckStatus("odenecek");
            setCheckDialog(true);
          }}
          onEdit={(check) => {
            setEditingCheck(check);
            setCheckStatus(check.status);
            if (check.status === 'ciro_edildi') {
              setCheckType("incoming");
            } else {
              setCheckType("outgoing");
            }
            setCheckDialog(true);
          }}
          onDelete={(id) => deleteCheckMutation.mutate(id)}
          onQuickAction={(check) => {
            setEditingCheck(check);
            setCheckStatus("odendi");
            setCheckType("outgoing");
            setCheckDialog(true);
          }}
          quickActionLabel="Ödeme Yap"
          sectionTitle="Verdiğimiz Çekler"
          emptyMessage="Henüz giden çek bulunmuyor"
          totalAmountColor="text-blue-600"
        />
      </div>

      {/* Check Dialog */}
      <CheckCreateDialog
        open={checkDialog}
        onOpenChange={setCheckDialog}
        editingCheck={editingCheck ? {
          id: editingCheck.id,
          check_number: editingCheck.check_number,
          issue_date: editingCheck.issue_date,
          due_date: editingCheck.due_date,
          amount: editingCheck.amount,
          bank: editingCheck.bank,
          issuer_name: editingCheck.issuer_name,
          payee: editingCheck.payee,
          status: editingCheck.status,
          notes: editingCheck.notes || null,
        } : null}
        setEditingCheck={(check) => setEditingCheck(check ? {
          id: check.id || "",
          check_number: check.check_number || "",
          issue_date: check.issue_date || "",
          due_date: check.due_date || "",
          amount: check.amount || 0,
          bank: check.bank || "",
          issuer_name: check.issuer_name,
          payee: check.payee || "",
          status: check.status || "pending",
          notes: check.notes || "",
          created_at: editingCheck?.created_at || new Date().toISOString(),
        } : null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["checks"] });
          setEditingCheck(null);
        }}
        defaultCheckType={checkType}
        defaultStatus={checkStatus}
      />
    </>
  );
};

export default CashflowChecks;

