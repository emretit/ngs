
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Opportunity, OpportunityStatus, opportunityStatusLabels } from "@/types/crm";
import OpportunityColumn from "./OpportunityColumn";

interface OpportunitiesState {
  new: Opportunity[];
  first_contact: Opportunity[];
  site_visit: Opportunity[];
  preparing_proposal: Opportunity[];
  proposal_sent: Opportunity[];
  accepted: Opportunity[];
  lost: Opportunity[];
}

interface OpportunitiesKanbanProps {
  opportunities: OpportunitiesState;
  onDragEnd: (result: DropResult) => void;
  onOpportunityClick: (opportunity: Opportunity) => void;
  onOpportunitySelect?: (opportunity: Opportunity) => void;
  selectedOpportunities?: Opportunity[];
  onUpdateOpportunityStatus: (id: string, status: string) => Promise<void>;
}

const columns = [
  { id: "new", title: "Yeni", color: "bg-blue-600" },
  { id: "first_contact", title: "İlk Görüşme", color: "bg-purple-600" },
  { id: "site_visit", title: "Ziyaret Yapıldı", color: "bg-indigo-600" },
  { id: "preparing_proposal", title: "Teklif Hazırlanıyor", color: "bg-amber-600" },
  { id: "proposal_sent", title: "Teklif Gönderildi", color: "bg-yellow-600" },
  { id: "accepted", title: "Kabul Edildi", color: "bg-green-600" },
  { id: "lost", title: "Kaybedildi", color: "bg-red-600" }
];

const OpportunitiesKanban = ({
  opportunities,
  onDragEnd,
  onOpportunityClick,
  onOpportunitySelect,
  selectedOpportunities = [],
  onUpdateOpportunityStatus,
}: OpportunitiesKanbanProps) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex overflow-x-auto gap-4 pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-none min-w-[300px]">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-3 w-3 rounded-full ${column.color}`}></div>
              <h2 className="font-semibold text-gray-900">
                {column.title} ({opportunities[column.id as keyof OpportunitiesState]?.length || 0})
              </h2>
            </div>
            <OpportunityColumn
              id={column.id as OpportunityStatus}
              title={column.title}
              opportunities={opportunities[column.id as keyof OpportunitiesState] || []}
              onOpportunityClick={onOpportunityClick}
              onOpportunitySelect={onOpportunitySelect}
              selectedOpportunities={selectedOpportunities}
            />
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default OpportunitiesKanban;
