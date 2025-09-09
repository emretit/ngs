import React from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Proposal } from "@/types/proposal";
import ProposalColumn from "./ProposalColumn";
import ColumnHeader from "../../opportunities/ColumnHeader";

interface ProposalKanbanBoardProps {
  proposals: Proposal[];
  onDragEnd: (result: DropResult) => void;
  onProposalSelect: (proposal: Proposal) => void;
  columns: Array<{
    id: string;
    title: string;
    icon: any;
    color: string;
  }>;
}

const ProposalKanbanBoard: React.FC<ProposalKanbanBoardProps> = ({
  proposals,
  onDragEnd,
  onProposalSelect,
  columns
}) => {
  const filterProposalsByStatus = (status: string) => {
    return proposals.filter(proposal => proposal.status === status);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="columns" direction="horizontal" type="COLUMN">
        {(provided) => (
          <div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-4 auto-rows-fr"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {columns.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(provided, snapshot) => (
                   <div 
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`w-full min-w-0 ${snapshot.isDragging ? 'opacity-80' : ''}`}
                  >
                    <div 
                      className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 h-full ${snapshot.isDragging ? 'shadow-lg border-primary' : ''}`}
                    >
                      <div 
                        className="p-3 bg-white/95 backdrop-blur-sm rounded-t-lg border-b border-gray-100 cursor-grab"
                        {...provided.dragHandleProps}
                      >
                        <ColumnHeader
                          id={column.id}
                          title={column.title}
                          icon={column.icon}
                          color={column.color}
                          opportunityCount={filterProposalsByStatus(column.id).length}
                          onDeleteColumn={() => {}} // Disabled for proposals
                          onUpdateTitle={() => {}} // Disabled for proposals
                          isDefaultColumn={true} // All proposal columns are default
                        />
                      </div>
                      <div className="p-2 bg-white/90 rounded-b-lg h-full">
                        <ProposalColumn
                          id={column.id}
                          title={column.title}
                          icon={column.icon}
                          proposals={filterProposalsByStatus(column.id)}
                          onSelect={onProposalSelect}
                          color={column.color}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default ProposalKanbanBoard;