import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProposalColumn from "./kanban/ProposalColumn";
import type { Proposal, ProposalStatus } from "@/types/proposal";
import { proposalStatusLabels, proposalStatusIcons } from "@/types/proposal";
import { changeProposalStatus } from "@/services/crmService";

interface ProposalKanbanProps {
  proposals: Proposal[];
  onProposalSelect: (proposal: Proposal) => void;
}

const columns = [
  { id: "draft", title: proposalStatusLabels.draft, icon: proposalStatusIcons.draft },
  { id: "pending_approval", title: proposalStatusLabels.pending_approval, icon: proposalStatusIcons.pending_approval },
  { id: "sent", title: proposalStatusLabels.sent, icon: proposalStatusIcons.sent },
  { id: "accepted", title: proposalStatusLabels.accepted, icon: proposalStatusIcons.accepted },
  { id: "rejected", title: proposalStatusLabels.rejected, icon: proposalStatusIcons.rejected },
  { id: "expired", title: proposalStatusLabels.expired, icon: proposalStatusIcons.expired }
];

export const ProposalKanban = ({ proposals, onProposalSelect }: ProposalKanbanProps) => {
  const queryClient = useQueryClient();
  const [localProposals, setLocalProposals] = useState<Proposal[]>(proposals);

  useEffect(() => {
    setLocalProposals(proposals);
  }, [proposals]);

  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProposalStatus }) => {
      await changeProposalStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Teklif durumu güncellendi');
    },
    onError: (error) => {
      toast.error('Teklif güncellenirken bir hata oluştu');
      console.error('Error updating proposal:', error);
    }
  });

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as ProposalStatus;
    
    const newProposals = Array.from(localProposals);
    const proposal = newProposals.find(p => p.id === draggableId);
    
    if (proposal) {
      proposal.status = newStatus;
      setLocalProposals(newProposals);

      await updateProposalMutation.mutateAsync({ 
        id: draggableId, 
        status: newStatus 
      });
    }
  };

  const filterProposalsByStatus = (status: string) => {
    return localProposals.filter(proposal => proposal.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex overflow-x-auto gap-6 pb-4">
        {columns.map(column => {
          const Icon = column.icon;
          return (
            <div key={column.id} className="flex-none min-w-[320px]">
              <div className="flex items-center gap-2 mb-4">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-gray-900">
                  {column.title} ({filterProposalsByStatus(column.id).length})
                </h2>
              </div>
              <ProposalColumn
                id={column.id}
                title={column.title}
                icon={column.icon}
                proposals={filterProposalsByStatus(column.id)}
                onSelect={onProposalSelect}
              />
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
