import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';

export const useProposalRevisions = (proposalId?: string, parentProposalId?: string) => {
  const [revisions, setRevisions] = useState<any[]>([]);

  useEffect(() => {
    const fetchRevisions = async () => {
      if (!proposalId) return;

      try {
        const { supabase } = await import('@/integrations/supabase/client');

        // Orijinal proposal ID'yi belirle
        const originalProposalId = parentProposalId || proposalId;

        // Tüm revizyonları getir (parent + tüm revisions)
        const { data, error } = await supabase
          .from('proposals')
          .select('id, number, revision_number, status, created_at, valid_until')
          .or(`id.eq.${originalProposalId},parent_proposal_id.eq.${originalProposalId}`)
          .order('revision_number', { ascending: true });

        if (error) {
          logger.error('Error fetching revisions:', error);
          return;
        }

        setRevisions(data || []);
      } catch (error) {
        logger.error('Error fetching revisions:', error);
      }
    };

    fetchRevisions();
  }, [proposalId, parentProposalId]);

  return { revisions };
};

