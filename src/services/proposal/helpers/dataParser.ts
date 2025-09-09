
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
    } else {
      data.items = [];
    }
    
    return data as Proposal;
  } catch (e) {
    console.error('Error parsing proposal data:', e);
    return data;
  }
}
