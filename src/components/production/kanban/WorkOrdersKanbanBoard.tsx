import React, { useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { WorkOrder, WorkOrderStatus } from "@/types/production";
import WorkOrderColumn from "./WorkOrderColumn";

interface WorkOrdersKanbanBoardProps {
  workOrders: WorkOrder[];
  onWorkOrderClick: (workOrder: WorkOrder) => void;
  onEdit?: (workOrder: WorkOrder) => void;
  onDelete?: (workOrderId: string) => void;
  onStatusChange?: (workOrderId: string, status: WorkOrderStatus) => Promise<void> | void;
}

const columns = [
  { id: "planned", title: "📅 Planlandı", color: "bg-blue-600" },
  { id: "in_progress", title: "⚙️ Üretimde", color: "bg-orange-600" },
  { id: "completed", title: "✔️ Tamamlandı", color: "bg-green-600" },
  { id: "cancelled", title: "❌ İptal", color: "bg-red-600" }
];

const WorkOrdersKanbanBoard = ({
  workOrders,
  onWorkOrderClick,
  onEdit,
  onDelete,
  onStatusChange
}: WorkOrdersKanbanBoardProps) => {
  // İş emirlerini durumlarına göre grupla
  const workOrdersByStatus = useMemo(() => {
    const grouped: Record<string, WorkOrder[]> = {
      planned: [],
      in_progress: [],
      completed: [],
      cancelled: []
    };

    workOrders.forEach(wo => {
      if (grouped[wo.status]) {
        grouped[wo.status].push(wo);
      }
    });

    return grouped;
  }, [workOrders]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as WorkOrderStatus;
    
    // Durumun geçerli olduğunu kontrol et
    if (!columns.some(col => col.id === newStatus)) {
      return;
    }

    // Backend'e durum güncellemesi gönder
    if (onStatusChange) {
      try {
        await onStatusChange(draggableId, newStatus);
      } catch (error) {
        console.error("İş emri durumu güncellenirken hata:", error);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex overflow-x-auto gap-4 pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-none min-w-[300px]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-3 w-3 rounded-full ${column.color}`}></div>
              <h2 className="font-semibold text-gray-900">
                {column.title} ({workOrdersByStatus[column.id]?.length || 0})
              </h2>
            </div>
            <WorkOrderColumn
              id={column.id}
              title={column.title}
              workOrders={workOrdersByStatus[column.id] || []}
              color={column.color}
              onWorkOrderClick={onWorkOrderClick}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default WorkOrdersKanbanBoard;

