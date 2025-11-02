import React from "react";
import ProductionWorkOrdersViewToggle, { WorkOrdersViewType } from "./ProductionWorkOrdersViewToggle";
import WorkOrdersTable from "./WorkOrdersTable";
import WorkOrdersKanbanBoard from "./kanban/WorkOrdersKanbanBoard";
import WorkOrdersCalendar from "./calendar/WorkOrdersCalendar";
import { WorkOrder, WorkOrderStatus } from "@/types/production";

interface WorkOrdersContentProps {
  workOrders: WorkOrder[];
  isLoading: boolean;
  activeView: WorkOrdersViewType;
  setActiveView: (view: WorkOrdersViewType) => void;
  onSelectWorkOrder: (workOrder: WorkOrder) => void;
  onEditWorkOrder?: (workOrder: WorkOrder) => void;
  onDeleteWorkOrder?: (workOrderId: string) => void;
  onStatusChange?: (workOrderId: string, status: WorkOrderStatus) => void;
  searchQuery?: string;
  statusFilter?: string;
}

const WorkOrdersContent = ({
  workOrders,
  isLoading,
  activeView,
  setActiveView,
  onSelectWorkOrder,
  onEditWorkOrder,
  onDeleteWorkOrder,
  onStatusChange,
  searchQuery,
  statusFilter
}: WorkOrdersContentProps) => {
  return (
    <div className="space-y-4">
      {/* View Toggle - Sağ üstte */}
      <div className="flex justify-end">
        <ProductionWorkOrdersViewToggle
          activeView={activeView}
          setActiveView={setActiveView}
        />
      </div>

      {/* Content based on active view */}
      {activeView === "table" && (
        <WorkOrdersTable
          workOrders={workOrders}
          isLoading={isLoading}
          onSelectWorkOrder={onSelectWorkOrder}
          onEditWorkOrder={onEditWorkOrder}
          onDeleteWorkOrder={onDeleteWorkOrder}
          onStatusChange={onStatusChange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      )}

      {activeView === "kanban" && (
        <WorkOrdersKanbanBoard
          workOrders={workOrders}
          onWorkOrderClick={onSelectWorkOrder}
          onEdit={onEditWorkOrder}
          onDelete={onDeleteWorkOrder}
          onStatusChange={onStatusChange}
        />
      )}

      {activeView === "calendar" && (
        <WorkOrdersCalendar
          workOrders={workOrders}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSelectWorkOrder={onSelectWorkOrder}
          onEditWorkOrder={onEditWorkOrder}
        />
      )}
    </div>
  );
};

export default WorkOrdersContent;

