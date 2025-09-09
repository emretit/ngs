
import { supabase } from '@/integrations/supabase/client';

export const mockCrmStatsService = {
  // Task statistics 
  getTaskStats: async () => {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status');

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: overdueTasks, error: overdueError } = await supabase
        .from('tasks')
        .select('id')
        .lt('due_date', today.toISOString())
        .neq('status', 'completed');

      if (overdueError) throw overdueError;

      return {
        total: tasks?.length || 0,
        overdue: overdueTasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'completed')?.length || 0,
        inProgress: tasks?.filter(t => t.status === 'in_progress')?.length || 0,
        todo: tasks?.filter(t => t.status === 'todo')?.length || 0,
      };
    } catch (error) {
      // Return default stats on error
      return {
        total: 0,
        overdue: 0,
        completed: 0,
        inProgress: 0,
        todo: 0
      };
    }
  },

  // Proposal statistics
  getProposalStats: async () => {
    try {
      const { data: proposals, error } = await supabase
        .from('proposals')
        .select('status, total_amount');

      if (error) throw error;

      const statusCounts: Record<string, number> = {};
      let totalAmount = 0;
      let acceptedAmount = 0;

      proposals?.forEach(proposal => {
        statusCounts[proposal.status] = (statusCounts[proposal.status] || 0) + 1;
        totalAmount += proposal.total_amount || 0;
        if (proposal.status === 'accepted') {
          acceptedAmount += proposal.total_amount || 0;
        }
      });

      return {
        totalCount: proposals?.length || 0,
        statusCounts,
        totalAmount,
        acceptedAmount,
        conversionRate: proposals?.length > 0 ? (statusCounts['accepted'] || 0) / proposals.length * 100 : 0
      };
    } catch (error) {
      // Return default stats on error
      return {
        totalCount: 0,
        statusCounts: {},
        totalAmount: 0,
        acceptedAmount: 0,
        conversionRate: 0
      };
    }
  },

  // Opportunity statistics
  getOpportunityStats: async () => {
    try {
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('status, value');

      if (error) throw error;

      const statusCounts: Record<string, number> = {};
      let totalValue = 0;
      let wonValue = 0;

      opportunities?.forEach(opportunity => {
        statusCounts[opportunity.status] = (statusCounts[opportunity.status] || 0) + 1;
        totalValue += opportunity.value || 0;
        if (opportunity.status === 'accepted') {
          wonValue += opportunity.value || 0;
        }
      });

      return {
        totalCount: opportunities?.length || 0,
        statusCounts,
        totalValue,
        wonValue,
        winRate: opportunities?.length > 0 ? (statusCounts['accepted'] || 0) / opportunities.length * 100 : 0
      };
    } catch (error) {
      // Return default stats on error
      return {
        totalCount: 0,
        statusCounts: {},
        totalValue: 0,
        wonValue: 0,
        winRate: 0
      };
    }
  }
};
