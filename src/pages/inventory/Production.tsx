import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import ProductionHeader from "@/components/production/ProductionHeader";
import ProductionFilterBar from "@/components/production/ProductionFilterBar";
import ProductionContent from "@/components/production/ProductionContent";
import WorkOrderForm from "@/components/production/WorkOrderForm";
import { useProduction } from "@/hooks/useProduction";
import { WorkOrder, BOM, WorkOrderStatus } from "@/types/production";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkOrdersViewType } from "@/components/production/ProductionWorkOrdersViewToggle";
import { BOMsViewType } from "@/components/production/ProductionBOMsViewToggle";

interface ProductionProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const Production = ({ isCollapsed, setIsCollapsed }: ProductionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { 
    workOrders,
    boms,
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
  const [showWorkOrderForm, setShowWorkOrderForm] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("orders");
  const [workOrdersView, setWorkOrdersView] = useState<WorkOrdersViewType>("table");
  const [bomsView, setBomsView] = useState<BOMsViewType>("table");

  // Route kontrolü: /production/work-orders/new ise form'u aç
  useEffect(() => {
    if (location.pathname === "/production/work-orders/new") {
      const workOrderId = searchParams.get("id");
      setSelectedWorkOrderId(workOrderId || undefined);
      setShowWorkOrderForm(true);
    }
  }, [location.pathname, searchParams]);

  const handleWorkOrderClick = (workOrder: WorkOrder) => {
    // navigate(`/production/work-orders/${workOrder.id}`);
    // Şimdilik form açalım, detay sayfası sonra
    setSelectedWorkOrderId(workOrder.id);
    setShowWorkOrderForm(true);
  };

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    setSelectedWorkOrderId(workOrder.id);
    setShowWorkOrderForm(true);
  };

  const handleDeleteWorkOrder = async (workOrderId: string) => {
    // TODO: Implement delete functionality
    toast.success("İş emri silme işlemi henüz aktif değil");
  };

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

  const handleBOMClick = (bom: BOM) => {
    navigate(`/production/bom/${bom.id}`);
  };

  const handleEditBOM = (bom: BOM) => {
    navigate(`/production/bom/${bom.id}/edit`);
  };

  const handleDeleteBOM = async (bomId: string) => {
    // TODO: Implement delete functionality
    toast.success("Ürün reçetesi silindi");
  };

  const handleDuplicateBOM = (bom: BOM) => {
    // TODO: Implement duplicate functionality
    toast.success("Ürün reçetesi kopyalandı");
  };

  const handleCreateWorkOrder = () => {
    setSelectedWorkOrderId(undefined);
    setShowWorkOrderForm(true);
  };

  const handleCloseWorkOrderForm = () => {
    setShowWorkOrderForm(false);
    setSelectedWorkOrderId(undefined);
    // Eğer /production/work-orders/new route'undaysak, ana sayfaya yönlendir
    if (location.pathname === "/production/work-orders/new") {
      navigate("/production", { replace: true });
    }
  };

  const handleCreateBOM = () => {
    navigate("/production/bom/new");
  };

  // Filtreleri hook'a aktar
  useEffect(() => {
    setFilters({
      ...filters,
      status: statusFilter === "all" ? undefined : statusFilter as any,
      search: searchQuery,
      dateRange: {
        from: startDate || null,
        to: endDate || null,
      },
    });
  }, [searchQuery, statusFilter, startDate, endDate]);

  return (
    <>
      <div className="space-y-2">
        <ProductionHeader 
          stats={stats}
          onCreateWorkOrder={handleCreateWorkOrder}
          onCreateBOM={handleCreateBOM}
        />
        
        {/* Tab Listesi - Header ile Filter Bar arasında */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-1 shadow-sm">
                <TabsTrigger value="orders" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  İş Emirleri
                </TabsTrigger>
                <TabsTrigger value="bom" className="flex items-center justify-center space-x-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200">
                  Ürün Reçeteleri
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

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
        
        <ProductionContent
          activeTab={activeTab}
          workOrders={workOrders}
          boms={boms}
          isLoading={isLoading}
          error={null}
          workOrdersView={workOrdersView}
          setWorkOrdersView={setWorkOrdersView}
          bomsView={bomsView}
          setBomsView={setBomsView}
          onSelectWorkOrder={handleWorkOrderClick}
          onEditWorkOrder={handleEditWorkOrder}
          onDeleteWorkOrder={handleDeleteWorkOrder}
          onStatusChange={handleStatusChange}
          onSelectBOM={handleBOMClick}
          onEditBOM={handleEditBOM}
          onDeleteBOM={handleDeleteBOM}
          onDuplicateBOM={handleDuplicateBOM}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      </div>

      {showWorkOrderForm && (
        <WorkOrderForm
          workOrderId={selectedWorkOrderId}
          onClose={handleCloseWorkOrderForm}
        />
      )}
    </>
  );
};

export default Production;
