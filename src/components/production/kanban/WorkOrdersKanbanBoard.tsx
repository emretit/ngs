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
  { id: "draft", title: "📝 Taslak", color: "bg-gray-500" },
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
      draft: [],
      planned: [],
      in_progress: [],
      completed: [],
      cancelled: []
    };

    workOrders.forEach(wo => {
      if (grouped[wo.status]) {
        grouped[wo.status].push(wo);
      } else {
        // Bilinmeyen bir durum varsa draft'a at veya yeni key oluştur
        if (!grouped[wo.status]) grouped[wo.status] = [];
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
      <div className="flex overflow-x-auto gap-4 pb-4 h-full items-start">
        {columns.map((column) => (
          <div key={column.id} className="flex-none w-[300px] flex flex-col h-full max-h-[calc(100vh-250px)]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${column.color}`}></div>
                <h2 className="font-semibold text-gray-900 text-sm">
                  {column.title}
                </h2>
              </div>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full border border-gray-200">
                {workOrdersByStatus[column.id]?.length || 0}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
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
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default WorkOrdersKanbanBoard;
