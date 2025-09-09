
import { supabase } from '@/integrations/supabase/client';
import { Opportunity, ContactHistoryItem } from '@/types/crm';

// Type alias for JSON compatibility with Supabase
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export const mockCrmOpportunitiesService = {
  getOpportunities: async () => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          customer:customer_id (*),
          employee:employee_id (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform opportunities to ensure contact history is properly cast
      const opportunities = data.map(opportunity => ({
        ...opportunity,
        contact_history: Array.isArray(opportunity.contact_history) 
          ? opportunity.contact_history as unknown as ContactHistoryItem[]
          : []
      })) as unknown as Opportunity[];
      
      return { data: opportunities, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  getOpportunityById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          customer:customer_id (*),
          employee:employee_id (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Transform opportunity to ensure contact history is properly cast
      const opportunity = {
        ...data,
        contact_history: Array.isArray(data.contact_history) 
          ? data.contact_history as unknown as ContactHistoryItem[]
          : []
      } as unknown as Opportunity;
      
      return { data: opportunity, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};
