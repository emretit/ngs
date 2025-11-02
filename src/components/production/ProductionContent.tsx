import React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { WorkOrder, BOM } from "@/types/production";
import { WorkOrdersViewType } from "./ProductionWorkOrdersViewToggle";
import { BOMsViewType } from "./ProductionBOMsViewToggle";
import WorkOrdersContent from "./WorkOrdersContent";
import BOMsContent from "./BOMsContent";

interface ProductionContentProps {
  activeTab: string;
  workOrders: WorkOrder[];
  boms: BOM[];
  isLoading: boolean;
  error: any;
  workOrdersView: WorkOrdersViewType;
  setWorkOrdersView: (view: WorkOrdersViewType) => void;
  bomsView: BOMsViewType;
  setBomsView: (view: BOMsViewType) => void;
  onSelectWorkOrder: (workOrder: WorkOrder) => void;
  onEditWorkOrder?: (workOrder: WorkOrder) => void;
  onDeleteWorkOrder?: (workOrderId: string) => void;
  onStatusChange?: (workOrderId: string, status: any) => void;
  onSelectBOM: (bom: BOM) => void;
  onEditBOM?: (bom: BOM) => void;
  onDeleteBOM?: (bomId: string) => void;
  onDuplicateBOM?: (bom: BOM) => void;
  searchQuery?: string;
  statusFilter?: string;
}

const ProductionContent = ({
  activeTab,
  workOrders,
  boms,
  isLoading,
  error,
  workOrdersView,
  setWorkOrdersView,
  bomsView,
  setBomsView,
  onSelectWorkOrder,
  onEditWorkOrder,
  onDeleteWorkOrder,
  onStatusChange,
  onSelectBOM,
  onEditBOM,
  onDeleteBOM,
  onDuplicateBOM,
  searchQuery,
  statusFilter
}: ProductionContentProps) => {

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Veriler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <Tabs value={activeTab} className="w-full">
        <div className="p-6">
          <TabsContent value="orders" className="mt-0">
            <WorkOrdersContent
              workOrders={workOrders}
              isLoading={isLoading}
              activeView={workOrdersView}
              setActiveView={setWorkOrdersView}
              onSelectWorkOrder={onSelectWorkOrder}
              onEditWorkOrder={onEditWorkOrder}
              onDeleteWorkOrder={onDeleteWorkOrder}
              onStatusChange={onStatusChange}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
            />
          </TabsContent>
          
          <TabsContent value="bom" className="mt-0">
            <BOMsContent
              boms={boms}
              isLoading={isLoading}
              activeView={bomsView}
              setActiveView={setBomsView}
              onSelectBOM={onSelectBOM}
              onEditBOM={onEditBOM}
              onDeleteBOM={onDeleteBOM}
              onDuplicateBOM={onDuplicateBOM}
              searchQuery={searchQuery}
            />
          </TabsContent>
          
        </div>
      </Tabs>
    </div>
  );
};

export default ProductionContent;

