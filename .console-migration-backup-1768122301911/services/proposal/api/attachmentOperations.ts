
import { ProposalAttachment } from "@/types/proposal";
import { getProposalById } from "./crudOperations";
import { updateProposal } from "./crudOperations";

/**
 * Adds an attachment to a proposal
 */
export async function addProposalAttachment(id: string, attachment: ProposalAttachment) {
  try {
    // First get the current proposal to get the existing attachments
    const { data: currentProposal } = await getProposalById(id);
    
    if (!currentProposal) {
      throw new Error('Proposal not found');
    }
    
    const currentAttachments = currentProposal.attachments || [];
    const updatedAttachments = [...currentAttachments, attachment];
    
    return updateProposal(id, { attachments: updatedAttachments });
  } catch (error) {
    console.error('Error adding proposal attachment:', error);
    return { data: null, error };
  }
}
