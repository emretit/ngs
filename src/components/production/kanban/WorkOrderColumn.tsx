import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { WorkOrder } from '@/types/production';
import WorkOrderCard from './WorkOrderCard';

const getColumnBackground = (color: string) => {
  const colorMap: { [key: string]: string } = {
    'bg-blue-600': 'bg-blue-50',
    'bg-orange-600': 'bg-orange-50',
    'bg-green-600': 'bg-green-50',
    'bg-red-600': 'bg-red-50',
  };
  
  return colorMap[color] || 'bg-gray-50';
};

interface WorkOrderColumnProps {
  id: string;
  title: string;
  workOrders: WorkOrder[];
  color?: string;
  onWorkOrderClick: (workOrder: WorkOrder) => void;
  onEdit?: (workOrder: WorkOrder) => void;
  onDelete?: (workOrderId: string) => void;
}

const WorkOrderColumn = ({
  id,
  title,
  workOrders,
  color = 'bg-gray-500',
  onWorkOrderClick,
  onEdit,
  onDelete
}: WorkOrderColumnProps) => {
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
            {workOrders.map((workOrder, index) => (
              <WorkOrderCard
                key={workOrder.id}
                workOrder={workOrder}
                index={index}
                onClick={() => onWorkOrderClick(workOrder)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
          {workOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-300 rounded-md mt-1">
              <p className="text-gray-400 text-xs">Bu durumda iş emri yok</p>
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default WorkOrderColumn;

