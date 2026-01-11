import React, { useMemo } from "react";
import { logger } from '@/utils/logger';
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Order, OrderStatus } from "@/types/orders";
import OrderColumn from "./OrderColumn";

interface OrdersKanbanBoardProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
  onOrderSelect?: (order: Order) => void;
  selectedOrders?: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onConvertToInvoice?: (order: Order) => void;
  onConvertToService?: (order: Order) => void;
  onPrint?: (order: Order) => void;
  onUpdateOrderStatus?: (id: string, status: OrderStatus) => Promise<void>;
}

const columns = [
  { id: "pending", title: "Beklemede", color: "bg-yellow-600" },
  { id: "confirmed", title: "Onaylandı", color: "bg-blue-600" },
  { id: "processing", title: "İşlemde", color: "bg-purple-600" },
  { id: "shipped", title: "Kargoda", color: "bg-green-600" },
  { id: "delivered", title: "Teslim Edildi", color: "bg-emerald-600" },
  { id: "completed", title: "Tamamlandı", color: "bg-teal-600" },
  { id: "cancelled", title: "İptal Edildi", color: "bg-red-600" }
];

const OrdersKanbanBoard = ({
  orders,
  onOrderClick,
  onOrderSelect,
  selectedOrders = [],
  onEdit,
  onDelete,
  onConvertToInvoice,
  onConvertToService,
  onPrint,
  onUpdateOrderStatus
}: OrdersKanbanBoardProps) => {
  // Siparişleri durumlarına göre grupla
  const ordersByStatus = useMemo(() => {
    const grouped: Record<string, Order[]> = {
      pending: [],
      confirmed: [],
      processing: [],
      shipped: [],
      delivered: [],
      completed: [],
      cancelled: []
    };

    orders.forEach(order => {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    });

    return grouped;
  }, [orders]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as OrderStatus;
    
    // Durumun geçerli olduğunu kontrol et
    if (!columns.some(col => col.id === newStatus)) {
      return;
    }

    // Backend'e durum güncellemesi gönder
    if (onUpdateOrderStatus) {
      try {
        await onUpdateOrderStatus(draggableId, newStatus);
      } catch (error) {
        logger.error("Sipariş durumu güncellenirken hata:", error);
        // Hata durumunda React Query otomatik olarak cache'i güncelleyecek
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
                {column.title} ({ordersByStatus[column.id]?.length || 0})
              </h2>
            </div>
            <OrderColumn
              id={column.id}
              title={column.title}
              orders={ordersByStatus[column.id] || []}
              color={column.color}
              onOrderClick={onOrderClick}
              onOrderSelect={onOrderSelect}
              selectedOrders={selectedOrders}
              onEdit={onEdit}
              onDelete={onDelete}
              onConvertToInvoice={onConvertToInvoice}
              onConvertToService={onConvertToService}
              onPrint={onPrint}
            />
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default OrdersKanbanBoard;

