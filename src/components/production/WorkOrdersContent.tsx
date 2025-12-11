import React from "react";
import { WorkOrdersViewType } from "./ProductionWorkOrdersViewToggle";
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
  onStatusChange?: (workOrderId: string, status: WorkOrderStatus) => Promise<void> | void;
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
  if (activeView === "table") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
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
            </div>
          </div>
          
          {/* Toplam iş emri sayısı */}
          {workOrders.length > 0 && !isLoading && (
            <div className="text-center py-4 text-sm text-gray-500">
              {workOrders.length} iş emri
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

