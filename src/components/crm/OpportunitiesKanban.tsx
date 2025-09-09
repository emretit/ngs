
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Opportunity, OpportunityStatus, opportunityStatusLabels } from "@/types/crm";
import OpportunityKanbanBoard from "../opportunities/OpportunityKanbanBoard";

interface OpportunitiesState {
  [key: string]: Opportunity[];
}

interface OpportunitiesKanbanProps {
  opportunities: OpportunitiesState;
  onDragEnd: (result: DropResult) => void;
  onOpportunityClick: (opportunity: Opportunity) => void;
  onOpportunitySelect?: (opportunity: Opportunity) => void;
  selectedOpportunities?: Opportunity[];
  onUpdateOpportunityStatus: (id: string, status: string) => Promise<void>;
}


const OpportunitiesKanban = ({
  opportunities,
  onDragEnd,
  onOpportunityClick,
  onOpportunitySelect,
  selectedOpportunities = [],
  onUpdateOpportunityStatus,
}: OpportunitiesKanbanProps) => {
  return (
    <OpportunityKanbanBoard
      opportunities={opportunities}
      onDragEnd={onDragEnd}
      onOpportunityClick={onOpportunityClick}
      onOpportunitySelect={onOpportunitySelect}
      selectedOpportunities={selectedOpportunities}
      onUpdateOpportunityStatus={onUpdateOpportunityStatus}
    />
  );
};

export default OpportunitiesKanban;
