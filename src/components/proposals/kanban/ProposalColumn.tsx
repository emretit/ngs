
import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { LucideIcon } from 'lucide-react';
import { Proposal } from '@/types/proposal';
import ProposalCard from './ProposalCard';

// Get appropriate background color for each column based on header color
const getColumnBackground = (color: string) => {
  // Convert header color to light pastel background
  const colorMap: { [key: string]: string } = {
    'bg-gray-600': 'bg-gray-50',
    'bg-yellow-600': 'bg-yellow-50',
    'bg-blue-600': 'bg-blue-50',
    'bg-green-600': 'bg-green-50',
    'bg-red-600': 'bg-red-50',
    'bg-orange-600': 'bg-orange-50',
    'bg-purple-600': 'bg-purple-50',
    'bg-indigo-600': 'bg-indigo-50', 
    'bg-amber-600': 'bg-amber-50',
    'bg-pink-600': 'bg-pink-50',
    'bg-cyan-600': 'bg-cyan-50',
    'bg-teal-600': 'bg-teal-50',
    'bg-lime-600': 'bg-lime-50',
    'bg-emerald-600': 'bg-emerald-50'
  };
  
  return colorMap[color] || 'bg-gray-50';
};

interface ProposalColumnProps {
  id: string;
  title: string;
  proposals: Proposal[];
  onSelect?: (proposal: Proposal) => void;
  icon?: LucideIcon;
  color?: string;
}

const ProposalColumn = ({
  id,
  title,
  proposals,
  onSelect,
  icon: Icon,
  color = 'bg-gray-600'
}: ProposalColumnProps) => {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          className={`min-h-[500px] w-full p-2 rounded-md transition-colors duration-200 h-full flex flex-col ${
            snapshot.isDraggingOver ? 'bg-red-50' : getColumnBackground(color)
          }`}
          {...provided.droppableProps}
        >
          <div className="flex-1">
            {proposals.map((proposal, index) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                index={index}
                onClick={() => onSelect && onSelect(proposal)}
              />
            ))}
          </div>
          {proposals.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 border border-dashed border-gray-200 rounded-md mt-2">
              {Icon && <Icon className="h-4 w-4 text-gray-400 mb-1" />}
              <p className="text-gray-500 text-xs text-center">Bu durumda teklif yok</p>
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default ProposalColumn;
