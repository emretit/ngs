
import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Opportunity, OpportunityStatus } from '@/types/crm';
import OpportunityCard from './OpportunityCard';

interface OpportunityColumnProps {
  id: OpportunityStatus;
  title: string;
  opportunities: Opportunity[];
  onOpportunityClick: (opportunity: Opportunity) => void;
  onOpportunitySelect?: (opportunity: Opportunity) => void;
  selectedOpportunities?: Opportunity[];
}

const OpportunityColumn = ({
  id,
  title,
  opportunities,
  onOpportunityClick,
  onOpportunitySelect,
  selectedOpportunities = []
}: OpportunityColumnProps) => {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className={`min-h-[500px] w-full p-3 rounded-md ${
            snapshot.isDraggingOver ? 'bg-red-50' : 'bg-gray-50'
          }`}
          {...provided.droppableProps}
        >
          {opportunities.map((opportunity, index) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              index={index}
              onClick={() => onOpportunityClick(opportunity)}
              isSelected={selectedOpportunities.some(o => o.id === opportunity.id)}
            />
          ))}
          {opportunities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 border border-dashed border-gray-300 rounded-md mt-2">
              <p className="text-gray-500 text-sm">Bu durumda fırsat yok</p>
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default OpportunityColumn;
