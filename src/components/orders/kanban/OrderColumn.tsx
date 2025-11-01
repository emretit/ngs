import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Order } from '@/types/orders';
import OrderCard from './OrderCard';

const getColumnBackground = (color: string) => {
  const colorMap: { [key: string]: string } = {
    'bg-yellow-600': 'bg-yellow-50',
    'bg-blue-600': 'bg-blue-50',
    'bg-purple-600': 'bg-purple-50',
    'bg-green-600': 'bg-green-50',
    'bg-emerald-600': 'bg-emerald-50',
    'bg-teal-600': 'bg-teal-50',
    'bg-red-600': 'bg-red-50',
  };
  
  return colorMap[color] || 'bg-gray-50';
};

interface OrderColumnProps {
  id: string;
  title: string;
  orders: Order[];
  color?: string;
  onOrderClick: (order: Order) => void;
  onOrderSelect?: (order: Order) => void;
  selectedOrders?: Order[];
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onConvertToInvoice?: (order: Order) => void;
  onConvertToService?: (order: Order) => void;
  onPrint?: (order: Order) => void;
}

const OrderColumn = ({
  id,
  title,
  orders,
  color = 'bg-gray-500',
  onOrderClick,
  onOrderSelect,
  selectedOrders = [],
  onEdit,
  onDelete,
  onConvertToInvoice,
  onConvertToService,
  onPrint
}: OrderColumnProps) => {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className={`min-h-[400px] w-full p-3 rounded-md transition-colors duration-200 h-full flex flex-col ${
            snapshot.isDraggingOver ? 'bg-primary/10 border-2 border-primary' : getColumnBackground(color)
          }`}
          {...provided.droppableProps}
        >
          <div className="flex-1">
            {orders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                onClick={() => onOrderClick(order)}
                onSelect={onOrderSelect ? () => onOrderSelect(order) : undefined}
                isSelected={selectedOrders.some(o => o.id === order.id)}
                onEdit={onEdit}
                onDelete={onDelete}
                onConvertToInvoice={onConvertToInvoice}
                onConvertToService={onConvertToService}
                onPrint={onPrint}
              />
            ))}
          </div>
          {orders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-300 rounded-md mt-1">
              <p className="text-gray-400 text-xs">Bu durumda sipariş yok</p>
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default OrderColumn;

