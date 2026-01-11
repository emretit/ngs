import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { DropResult } from "@hello-pangea/dnd";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProposalKanbanBoard from "./kanban/ProposalKanbanBoard";
import type { Proposal, ProposalStatus } from "@/types/proposal";
import { proposalStatusLabels, proposalStatusIcons } from "@/types/proposal";
import { changeProposalStatus } from "@/services/crmService";

interface ProposalKanbanProps {
  proposals: Proposal[];
  onProposalSelect: (proposal: Proposal) => void;
  onStatusChange?: () => void;
}

const columns = [
  { id: "draft", title: proposalStatusLabels.draft, icon: proposalStatusIcons.draft, color: "bg-gray-600" },
  { id: "pending_approval", title: proposalStatusLabels.pending_approval, icon: proposalStatusIcons.pending_approval, color: "bg-yellow-600" },
  { id: "sent", title: proposalStatusLabels.sent, icon: proposalStatusIcons.sent, color: "bg-blue-600" },
  { id: "accepted", title: proposalStatusLabels.accepted, icon: proposalStatusIcons.accepted, color: "bg-green-600" },
  { id: "rejected", title: proposalStatusLabels.rejected, icon: proposalStatusIcons.rejected, color: "bg-red-600" },
  { id: "expired", title: proposalStatusLabels.expired, icon: proposalStatusIcons.expired, color: "bg-orange-600" }
];

export const ProposalKanban = ({ proposals, onProposalSelect, onStatusChange }: ProposalKanbanProps) => {
  const queryClient = useQueryClient();
  const [localProposals, setLocalProposals] = useState<Proposal[]>(proposals);

  useEffect(() => {
    setLocalProposals(proposals);
  }, [proposals]);

  const updateProposalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProposalStatus }) => {
      await changeProposalStatus(id, status);
    },
    onSuccess: async () => {
      // Hem normal proposals hem de infinite scroll query'lerini invalidate et
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
      // Hemen refetch yap - tablo otomatik yenilensin
      await queryClient.refetchQueries({ queryKey: ['proposals-infinite'] });
      // Sayfayı yenile
      onStatusChange?.();
      toast.success('Teklif durumu güncellendi');
    },
    onError: (error) => {
      toast.error('Teklif güncellenirken bir hata oluştu');
      logger.error('Error updating proposal:', error);
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

  return (
    <ProposalKanbanBoard
      proposals={localProposals}
      onDragEnd={handleDragEnd}
      onProposalSelect={onProposalSelect}
      columns={columns}
    />
  );
};
