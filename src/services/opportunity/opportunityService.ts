
import { supabase } from "@/integrations/supabase/client";
import { Opportunity } from "@/types/crm";
import { Json } from "@/types/json";
import { BaseService } from "../base/BaseService";

export class OpportunityService extends BaseService {
  // Add method for updating opportunities
  async updateOpportunity(id: string, updateData: Partial<Opportunity>) {
    try {
      // Create a clean update data object with only the properties
      // that exist in the database table
      const dataToUpdate: Record<string, any> = {};
      
      // Copy simple properties
      if (updateData.title !== undefined) dataToUpdate.title = updateData.title;
      if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
      if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
      if (updateData.priority !== undefined) dataToUpdate.priority = updateData.priority;
      if (updateData.value !== undefined) dataToUpdate.value = updateData.value;
      if ('currency' in updateData) dataToUpdate.currency = updateData.currency;
      if (updateData.customer_id !== undefined) dataToUpdate.customer_id = updateData.customer_id;
      if (updateData.employee_id !== undefined) dataToUpdate.employee_id = updateData.employee_id;
      if (updateData.expected_close_date !== undefined) dataToUpdate.expected_close_date = updateData.expected_close_date;
      if ('proposal_id' in updateData) dataToUpdate.proposal_id = updateData.proposal_id;
      if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;
      
      // Handle complex types that need conversion
      if ('contact_history' in updateData && updateData.contact_history !== undefined) {
        dataToUpdate.contact_history = JSON.parse(JSON.stringify(updateData.contact_history)) as Json;
      }
      
      if ('products' in updateData && updateData.products !== undefined) {
        dataToUpdate.products = JSON.parse(JSON.stringify(updateData.products)) as Json;
      }
      
      if ('tags' in updateData && updateData.tags !== undefined) {
        dataToUpdate.tags = updateData.tags;
      }
      
      const { data, error } = await supabase
        .from('opportunities')
        .update(dataToUpdate)
        .eq('id', id)
        .select(`
          *,
          customer:customer_id (*),
          employee:employee_id (*)
        `)
        .single();

      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating opportunity:', error);
      return { data: null, error };
    }
  }
}

export const opportunityService = new OpportunityService();
