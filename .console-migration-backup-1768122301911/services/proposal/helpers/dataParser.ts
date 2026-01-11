
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
      // product_id is required for new items, but kept optional for backward compatibility with old data
      // image_url is kept for backward compatibility but should not be used for new items
      data.items = data.items.map((item: any) => ({
        ...item,
        name: item.name || item.product_name || '', // product_name'den name'e map et
        discount_rate: item.discount_rate !== undefined ? item.discount_rate : (item.discount || 0), // discount'u discount_rate'e map et
        // product_id: item.product_id (kept as-is, required for new items)
        // image_url: item.image_url (kept for backward compatibility, but new items should use product_id)
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
