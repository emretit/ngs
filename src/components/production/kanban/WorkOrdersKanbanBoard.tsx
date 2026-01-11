import React, { useMemo, useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { DragEndEvent } from "@dnd-kit/core";
import { WorkOrder, WorkOrderStatus } from "@/types/production";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@/components/ui/kanban";
import WorkOrderCard from "./WorkOrderCard";

interface WorkOrdersKanbanBoardProps {
  workOrders: WorkOrder[];
  onWorkOrderClick: (workOrder: WorkOrder) => void;
  onEdit?: (workOrder: WorkOrder) => void;
  onDelete?: (workOrderId: string) => void;
  onStatusChange?: (workOrderId: string, status: WorkOrderStatus) => Promise<void> | void;
}

// Frontend status değerlerini veritabanı status değerlerine map et
const mapStatusToDb = (frontendStatus: WorkOrderStatus): string => {
  const statusMap: Record<WorkOrderStatus, string> = {
    'draft': 'assigned',
    'planned': 'assigned',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'cancelled': 'cancelled'
  };
  return statusMap[frontendStatus] || 'assigned';
};

const columns = [
  { 
    id: "draft", 
    name: "Taslak", 
    icon: "📝",
    color: "bg-gray-500",
    bgGradient: "from-gray-50 to-gray-100/50",
    borderColor: "border-gray-200",
    headerBg: "bg-gradient-to-r from-gray-50 to-gray-100",
    accentColor: "text-gray-600"
  },
  { 
    id: "planned", 
    name: "Planlandı", 
    icon: "📅",
    color: "bg-blue-500",
    bgGradient: "from-blue-50 to-blue-100/50",
    borderColor: "border-blue-200",
    headerBg: "bg-gradient-to-r from-blue-50 to-blue-100",
    accentColor: "text-blue-600"
  },
  { 
    id: "in_progress", 
    name: "Üretimde", 
    icon: "⚙️",
    color: "bg-orange-500",
    bgGradient: "from-orange-50 to-orange-100/50",
    borderColor: "border-orange-200",
    headerBg: "bg-gradient-to-r from-orange-50 to-orange-100",
    accentColor: "text-orange-600"
  },
  { 
    id: "completed", 
    name: "Tamamlandı", 
    icon: "✔️",
    color: "bg-green-500",
    bgGradient: "from-green-50 to-green-100/50",
    borderColor: "border-green-200",
    headerBg: "bg-gradient-to-r from-green-50 to-green-100",
    accentColor: "text-green-600"
  },
  { 
    id: "cancelled", 
    name: "İptal", 
    icon: "❌",
    color: "bg-red-500",
    bgGradient: "from-red-50 to-red-100/50",
    borderColor: "border-red-200",
    headerBg: "bg-gradient-to-r from-red-50 to-red-100",
    accentColor: "text-red-600"
  }
];

type KanbanWorkOrder = {
  id: string;
  name: string;
  column: string;
  workOrder: WorkOrder;
};

const WorkOrdersKanbanBoard = ({
  workOrders,
  onWorkOrderClick,
  onEdit,
  onDelete,
  onStatusChange
}: WorkOrdersKanbanBoardProps) => {
  // İş emirlerini kanban formatına dönüştür
  const kanbanData = useMemo<KanbanWorkOrder[]>(() => {
    return workOrders.map(wo => ({
      id: wo.id,
      name: wo.title,
      column: wo.status,
      workOrder: wo,
    }));
  }, [workOrders]);

  const [data, setData] = useState<KanbanWorkOrder[]>(kanbanData);

  // data değiştiğinde güncelle
  useEffect(() => {
    setData(kanbanData);
  }, [kanbanData]);

  const handleDataChange = async (newData: KanbanWorkOrder[]) => {
    setData(newData);
    
    // Değişen kartları bul ve durum güncellemesi yap
    const changedItems = newData.filter((item, index) => {
      const oldItem = kanbanData.find(d => d.id === item.id);
      return oldItem && oldItem.column !== item.column;
    });

    for (const item of changedItems) {
      if (onStatusChange) {
        try {
          await onStatusChange(item.id, item.column as WorkOrderStatus);
        } catch (error) {
          logger.error("İş emri durumu güncellenirken hata:", error);
          // Hata durumunda eski veriye geri dön
          setData(kanbanData);
        }
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeItem = data.find((item) => item.id === active.id);
    if (!activeItem) return;

    const newColumn = 
      data.find((item) => item.id === over.id)?.column ||
      columns.find(col => col.id === over.id)?.id ||
      activeItem.column;

    if (activeItem.column !== newColumn && onStatusChange) {
      try {
        // Frontend status değerini kullan (zaten map edilmiş)
        await onStatusChange(activeItem.id, newColumn as WorkOrderStatus);
      } catch (error) {
        logger.error("İş emri durumu güncellenirken hata:", error);
      }
    }
  };

  // Kolon başına kart sayısını hesapla
  const getColumnCount = (columnId: string) => {
    return data.filter(item => item.column === columnId).length;
  };

  const getColumnConfig = (columnId: string) => {
    return columns.find(col => col.id === columnId) || columns[0];
  };

  return (
    <div className="h-full w-full overflow-x-auto pb-6 px-2">
      <KanbanProvider
        columns={columns}
        data={data}
        onDataChange={handleDataChange}
        onDragEnd={handleDragEnd}
        className="min-w-max gap-6"
      >
        {(column) => {
          const config = getColumnConfig(column.id);
          const count = getColumnCount(column.id);
          
          return (
            <KanbanBoard
              id={column.id}
              className={`w-[320px] min-h-[calc(100vh-250px)] bg-gradient-to-b ${config.bgGradient} border-2 ${config.borderColor} shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl`}
            >
              <KanbanHeader className={`flex items-center justify-between px-4 py-3 ${config.headerBg} border-b-2 ${config.borderColor} backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${config.color} shadow-sm animate-pulse`}></div>
                  <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-xl">{config.icon}</span>
                    {config.name}
                  </span>
                </div>
                <span className={`${config.accentColor} text-xs font-bold px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border ${config.borderColor} shadow-sm min-w-[28px] text-center`}>
                  {count}
                </span>
              </KanbanHeader>
              <KanbanCards id={column.id} className="min-h-[400px] p-3">
                {(item: KanbanWorkOrder) => {
                  const workOrder = item.workOrder;
                  const hoverBorderClass = config.id === "draft" ? "hover:border-gray-400" :
                                         config.id === "planned" ? "hover:border-blue-400" :
                                         config.id === "in_progress" ? "hover:border-orange-400" :
                                         config.id === "completed" ? "hover:border-green-400" :
                                         "hover:border-red-400";
                  
                  return (
                    <KanbanCard
                      id={item.id}
                      name={item.name}
                      column={item.column}
                      className={`border-2 ${config.borderColor} ${hoverBorderClass} hover:shadow-lg transition-all duration-300 bg-white/95 backdrop-blur-sm group hover:scale-[1.02] hover:-translate-y-0.5`}
                      onClick={() => onWorkOrderClick(workOrder)}
                    >
                      <WorkOrderCard
                        workOrder={workOrder}
                        index={0}
                        onClick={() => onWorkOrderClick(workOrder)}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </KanbanCard>
                  );
                }}
              </KanbanCards>
              {count === 0 && (
                <div className={`flex flex-col items-center justify-center h-64 p-6 text-center border-2 border-dashed ${config.borderColor} m-3 rounded-xl bg-white/40 backdrop-blur-sm`}>
                  <div className="text-5xl mb-3 opacity-40 animate-pulse">{config.icon}</div>
                  <p className={`text-sm ${config.accentColor} font-semibold opacity-60`}>
                    Bu durumda iş emri yok
                  </p>
                  <p className={`text-xs ${config.accentColor} opacity-40 mt-1`}>
                    Kartları buraya sürükleyin
                  </p>
                </div>
              )}
            </KanbanBoard>
          );
        }}
      </KanbanProvider>
    </div>
  );
};

export default WorkOrdersKanbanBoard;
