
import { Proposal, ProposalAttachment, ProposalItem } from "@/types/proposal";

/**
 * Parses JSON data from proposal response into proper types
 */
export function parseProposalData(data: any): Proposal | null {
  if (!data) return null;
  
  try {
    // Parse attachments
    if (data.attachments) {
      if (typeof data.attachments === 'string') {
        data.attachments = JSON.parse(data.attachments) as ProposalAttachment[];
      }
    } else {
      data.attachments = [];
    }
    
    // Parse items
    if (data.items) {
      if (typeof data.items === 'string') {
        data.items = JSON.parse(data.items) as ProposalItem[];
      }
      // Transform items: product_name -> name, discount -> discount_rate
      data.items = data.items.map((item: any) => ({
        ...item,
        name: item.name || item.product_name || '', // product_name'den name'e map et
        discount_rate: item.discount_rate !== undefined ? item.discount_rate : (item.discount || 0), // discount'u discount_rate'e map et
      }));
    } else {
      data.items = [];
    }
    
    // Parse history
    if (data.history) {
      if (typeof data.history === 'string') {
        try {
          data.history = JSON.parse(data.history);
        } catch (e) {
          console.error('Error parsing history:', e);
          data.history = [];
        }
      }
      // Ensure history is an array
      if (!Array.isArray(data.history)) {
        data.history = [];
      }
    } else {
      data.history = [];
    }
    
    return data as Proposal;
  } catch (e) {
    console.error('Error parsing proposal data:', e);
    return data;
  }
}
