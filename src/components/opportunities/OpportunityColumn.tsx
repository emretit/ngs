
import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Opportunity, OpportunityStatus } from '@/types/crm';
import OpportunityCard from './OpportunityCard';

// Get appropriate background color for each column based on header color
const getColumnBackground = (color: string) => {
  // Convert header color to light pastel background
  const colorMap: { [key: string]: string } = {
    'bg-blue-600': 'bg-blue-50',
    'bg-purple-600': 'bg-purple-50',
    'bg-indigo-600': 'bg-indigo-50', 
    'bg-amber-600': 'bg-amber-50',
    'bg-yellow-600': 'bg-yellow-50',
    'bg-green-600': 'bg-green-50',
    'bg-red-600': 'bg-red-50',
    'bg-pink-600': 'bg-pink-50',
    'bg-cyan-600': 'bg-cyan-50',
    'bg-teal-600': 'bg-teal-50',
    'bg-lime-600': 'bg-lime-50',
    'bg-orange-600': 'bg-orange-50',
    'bg-emerald-600': 'bg-emerald-50'
  };
  
  return colorMap[color] || 'bg-gray-50';
};

interface OpportunityColumnProps {
  id: OpportunityStatus;
  title: string;
  opportunities: Opportunity[];
  onOpportunityClick: (opportunity: Opportunity) => void;
  onOpportunitySelect?: (opportunity: Opportunity) => void;
  selectedOpportunities?: Opportunity[];
  color?: string;
  onEdit?: (opportunity: Opportunity) => void;
  onDelete?: (opportunity: Opportunity) => void;
  onConvertToProposal?: (opportunity: Opportunity) => void;
  onPlanMeeting?: (opportunity: Opportunity) => void;
}

const OpportunityColumn = ({
  id,
  title,
  opportunities,
  onOpportunityClick,
  onOpportunitySelect,
  selectedOpportunities = [],
  color = 'bg-gray-500',
  onEdit,
  onDelete,
  onConvertToProposal,
  onPlanMeeting
}: OpportunityColumnProps) => {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className={`min-h-[400px] w-full p-3 rounded-md transition-colors duration-200 h-full flex flex-col ${
            snapshot.isDraggingOver ? 'bg-red-50' : getColumnBackground(color)
          }`}
          {...provided.droppableProps}
        >
          <div className="flex-1">
            {opportunities.map((opportunity, index) => (
                          <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              index={index}
              onClick={() => onOpportunityClick(opportunity)}
              onSelect={onOpportunitySelect ? () => onOpportunitySelect(opportunity) : undefined}
              isSelected={selectedOpportunities.some(o => o.id === opportunity.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onConvertToProposal={onConvertToProposal}
              onPlanMeeting={onPlanMeeting}
            />
            ))}
          </div>
          {opportunities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 border border-dashed border-gray-300 rounded-md mt-1">
              <p className="text-gray-400 text-xs">Bu durumda fırsat yok</p>
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default OpportunityColumn;
