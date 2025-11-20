
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalStatus } from "@/types/proposal";
import { Json } from "@/types/json";
import { parseProposalData } from "../helpers/dataParser";
import { generateProposalNumber } from "../helpers/numberGenerator";
import { ServiceOptions } from "../../base/BaseService";

/**
 * Fetches a list of proposals with pagination and sorting
 */
export async function getProposals(options: ServiceOptions = {}) {
  const {
    pageSize = 10,
    page = 1,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;
  
  const startRow = (page - 1) * pageSize;
  const endRow = startRow + pageSize - 1;
  
  try {
    const { data, error, count } = await supabase
      .from('proposals')
      .select(`
        *,
        customer:customer_id(*),
        employee:employee_id(*)
      `, { count: 'exact' })
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(startRow, endRow);
    
    if (error) throw error;
    
    return { data, count };
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return { data: [], count: 0 };
  }
}

/**
 * Fetches a single proposal by ID
 */
export async function getProposalById(id: string) {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        customer:customer_id(*),
        employee:employee_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Parse the JSON strings to convert back to proper types
    const parsedData = parseProposalData(data);
    
    return { data: parsedData, error: null };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return { data: null, error };
  }
}

/**
 * Creates a new proposal
 */
export async function createProposal(proposal: Partial<Proposal>) {
  try {
    

    // Generate proposal number
    const proposalNumber = await generateProposalNumber();
    
    // Create proposal data object with required fields
    const insertData: {
      title: string;
      description?: string;
      customer_id?: string;
      employee_id?: string;
      opportunity_id?: string;
      company_id?: string;
      number: string;
      status: string;
      offer_date?: string;
      valid_until?: string;
      payment_terms?: string;
      delivery_terms?: string;
      warranty_terms?: string;
      price_terms?: string;
      other_terms?: string;
      selected_payment_terms?: string[];
      selected_delivery_terms?: string[];
      selected_warranty_terms?: string[];
      selected_pricing_terms?: string[];
      selected_other_terms?: string[];
      notes?: string;
      terms?: string;
      currency: string;
      total_amount: number;
      attachments?: Json;
      items?: Json;
      created_at: string;
      updated_at: string;
    } = {
      title: proposal.title || "Untitled Proposal",
      description: proposal.description,
      customer_id: proposal.customer_id,
      employee_id: proposal.employee_id,
      opportunity_id: proposal.opportunity_id,
      company_id: (proposal as any).company_id || null,
      number: proposalNumber,
      status: proposal.status || 'draft',
      offer_date: (proposal as any).offer_date || null,
      valid_until: proposal.valid_until,
      payment_terms: proposal.payment_terms,
      delivery_terms: proposal.delivery_terms,
      warranty_terms: proposal.warranty_terms,
      price_terms: proposal.price_terms,
      other_terms: proposal.other_terms,
      selected_payment_terms: (proposal as any).selected_payment_terms || [],
      selected_delivery_terms: (proposal as any).selected_delivery_terms || [],
      selected_warranty_terms: (proposal as any).selected_warranty_terms || [],
      selected_pricing_terms: (proposal as any).selected_pricing_terms || [],
      selected_other_terms: (proposal as any).selected_other_terms || [],
      notes: proposal.notes,
      terms: proposal.terms,
      currency: proposal.currency || 'TRY',
      total_amount: proposal.total_amount || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Handle complex types by proper serialization
    if (proposal.attachments && proposal.attachments.length > 0) {
      insertData.attachments = JSON.stringify(proposal.attachments) as unknown as Json;
    }
    
    if (proposal.items && proposal.items.length > 0) {
      insertData.items = JSON.stringify(proposal.items) as unknown as Json;
    }
    
    const { data, error } = await supabase
      .from('proposals')
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Parse response data
    const parsedData = parseProposalData(data);
    
    return { data: parsedData, error: null };
  } catch (error) {
    console.error('Error creating proposal:', error);
    return { data: null, error };
  }
}

/**
 * Updates an existing proposal
 */
export async function updateProposal(id: string, proposal: Partial<Proposal>) {
  try {
    // Create a properly typed update data object
    const updateData: {
      updated_at: string;
      title?: string;
      description?: string;
      customer_id?: string;
      employee_id?: string;
      opportunity_id?: string;
      status?: string;
      valid_until?: string;
      payment_terms?: string;
      delivery_terms?: string;
      warranty_terms?: string;
      price_terms?: string;
      other_terms?: string;
      notes?: string;
      terms?: string;
      currency?: string;
      total_amount?: number;
      attachments?: Json;
      items?: Json;
    } = { 
      updated_at: new Date().toISOString() 
    };
    
    // Copy simple properties
    if (proposal.title !== undefined) updateData.title = proposal.title;
    if (proposal.description !== undefined) updateData.description = proposal.description;
    if (proposal.customer_id !== undefined) updateData.customer_id = proposal.customer_id;
    if (proposal.employee_id !== undefined) updateData.employee_id = proposal.employee_id;
    if (proposal.opportunity_id !== undefined) updateData.opportunity_id = proposal.opportunity_id;
    if (proposal.status !== undefined) updateData.status = proposal.status;
    if (proposal.valid_until !== undefined) updateData.valid_until = proposal.valid_until;
    if (proposal.payment_terms !== undefined) updateData.payment_terms = proposal.payment_terms;
    if (proposal.delivery_terms !== undefined) updateData.delivery_terms = proposal.delivery_terms;
    if (proposal.warranty_terms !== undefined) updateData.warranty_terms = proposal.warranty_terms;
    if (proposal.price_terms !== undefined) updateData.price_terms = proposal.price_terms;
    if (proposal.other_terms !== undefined) updateData.other_terms = proposal.other_terms;
    if (proposal.notes !== undefined) updateData.notes = proposal.notes;
    if (proposal.terms !== undefined) updateData.terms = proposal.terms;
    if (proposal.currency !== undefined) updateData.currency = proposal.currency;
    if (proposal.total_amount !== undefined) updateData.total_amount = proposal.total_amount;
    
    // Handle complex types with proper serialization
    if (proposal.attachments !== undefined) {
      updateData.attachments = JSON.stringify(proposal.attachments) as unknown as Json;
    }
    
    if (proposal.items !== undefined) {
      updateData.items = JSON.stringify(proposal.items) as unknown as Json;
    }
    
    const { data, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Parse response data
    const parsedData = parseProposalData(data);
    
    return { data: parsedData, error: null };
  } catch (error) {
    console.error('Error updating proposal:', error);
    return { data: null, error };
  }
}

/**
 * Deletes a proposal
 */
export async function deleteProposal(id: string) {
  try {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return { success: false, error };
  }
}

/**
 * Updates only the status of a proposal
 */
export async function updateProposalStatus(id: string, status: ProposalStatus) {
  return updateProposal(id, { status });
}
