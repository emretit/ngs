import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ProductionHeader from "@/components/production/ProductionHeader";
import ProductionFilterBar from "@/components/production/ProductionFilterBar";
import WorkOrdersContent from "@/components/production/WorkOrdersContent";
import { useProduction } from "@/hooks/useProduction";
import { WorkOrder, WorkOrderStatus } from "@/types/production";
import { toast } from "sonner";
import { WorkOrdersViewType } from "@/components/production/ProductionWorkOrdersViewToggle";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface ProductionProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const Production = ({ isCollapsed, setIsCollapsed }: ProductionProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { 
    workOrders,
    isLoading, 
    stats,
    filters, 
    setFilters,
    updateWorkOrder
  } = useProduction();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [workOrdersView, setWorkOrdersView] = useState<WorkOrdersViewType>("table");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleWorkOrderClick = (workOrder: WorkOrder) => {
    // Detay sayfası yoksa şimdilik düzenleme sayfasına yönlendir
    navigate(`/production/work-orders/${workOrder.id}/edit`);
  };

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    navigate(`/production/work-orders/${workOrder.id}/edit`);
  };

  const handleDeleteWorkOrder = useCallback((workOrderId: string) => {
    const workOrder = workOrders.find(w => w.id === workOrderId);
    if (workOrder) {
      setWorkOrderToDelete(workOrder);
      setIsDeleteDialogOpen(true);
    }
  }, [workOrders]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!workOrderToDelete) return;

    setIsDeleting(true);
    try {
      // TODO: Implement delete functionality
      toast.success("İş emri silme işlemi henüz aktif değil");
      setIsDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
    } catch (error) {
      toast.error("İş emri silinirken hata oluştu");
    } finally {
      setIsDeleting(false);
    }
  }, [workOrderToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setWorkOrderToDelete(null);
  }, []);

  const handleStatusChange = async (workOrderId: string, status: WorkOrderStatus) => {
    try {
      // Statü değişirken tarihleri de güncelle
      const updateData: Partial<WorkOrder> = { status };
      
      // Eğer 'in_progress' olduysa ve actual_start_date yoksa bugünü set et
      if (status === 'in_progress') {
        const current = workOrders.find(w => w.id === workOrderId);
        if (!current?.actual_start_date) {
          updateData.actual_start_date = new Date().toISOString();
        }
      }
      
      // Eğer 'completed' olduysa ve actual_end_date yoksa bugünü set et
      if (status === 'completed') {
        updateData.actual_end_date = new Date().toISOString();
      }

      await updateWorkOrder({ id: workOrderId, data: updateData });
      
    } catch (error) {
      console.error("Status update failed", error);
      toast.error("Durum güncellenemedi");
    }
  };

  const handleCreateWorkOrder = () => {
    // Dialog ProductionHeader içinde açılıyor, burada sadece verileri yenile
    queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    queryClient.invalidateQueries({ queryKey: ['production-stats'] });
  };


  // Filtreleri hook'a aktar
  useEffect(() => {
    setFilters({
      status: statusFilter === "all" ? undefined : statusFilter as any,
      search: searchQuery,
      dateRange: {
        from: startDate || null,
        to: endDate || null,
      },
    });
  }, [searchQuery, statusFilter, startDate, endDate, setFilters]);

  return (
    <>
      <div className="space-y-2">
        <ProductionHeader 
          stats={stats}
          onCreateWorkOrder={handleCreateWorkOrder}
          activeView={workOrdersView}
          setActiveView={setWorkOrdersView}
        />
        
        <ProductionFilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={statusFilter}
          setSelectedStatus={setStatusFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
        
        <WorkOrdersContent
          workOrders={workOrders}
          isLoading={isLoading}
          activeView={workOrdersView}
          setActiveView={setWorkOrdersView}
          onSelectWorkOrder={handleWorkOrderClick}
          onEditWorkOrder={handleEditWorkOrder}
          onDeleteWorkOrder={handleDeleteWorkOrder}
          onStatusChange={handleStatusChange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />

        {/* Silme Onay Dialog */}
        <ConfirmationDialogComponent
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="İş Emrini Sil"
          description={
            workOrderToDelete
              ? `"${workOrderToDelete.title}" (${workOrderToDelete.order_number}) iş emrini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
              : "Bu iş emrini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          }
          confirmText={t("common.delete")}
          cancelText={t("common.cancel")}
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
        />
      </div>
    </>
  );
};

export default Production;
