
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalStatus, ProposalAttachment } from "@/types/proposal";
import { BaseService, ServiceOptions } from "../base/BaseService";
import { 
  getProposals, 
  getProposalById, 
  createProposal, 
  updateProposal, 
  deleteProposal, 
  updateProposalStatus as updateProposalStatusApi
} from "./api/crudOperations";
import { addProposalAttachment } from "./api/attachmentOperations";
import { parseProposalData } from "./helpers/dataParser";

export class ProposalService extends BaseService {
  async getProposals(options: ServiceOptions = {}) {
    return getProposals(options);
  }
  
  async getProposalById(id: string) {
    return getProposalById(id);
  }
  
  async createProposal(proposal: Partial<Proposal>) {
    return createProposal(proposal);
  }
  
  async updateProposal(id: string, proposal: Partial<Proposal>) {
    return updateProposal(id, proposal);
  }
  
  async deleteProposal(id: string) {
    return deleteProposal(id);
  }
  
  async updateProposalStatus(id: string, status: ProposalStatus) {
    return updateProposalStatusApi(id, status);
  }
  
  async addProposalAttachment(id: string, attachment: ProposalAttachment) {
    return addProposalAttachment(id, attachment);
  }

  // Helper method to parse JSON data from proposal response
  private parseProposalData(data: any): Proposal | null {
    return parseProposalData(data);
  }
}

export const proposalService = new ProposalService();

// Export the function with a different name to avoid conflicts
export const changeProposalStatus = (id: string, status: ProposalStatus) => {
  return proposalService.updateProposalStatus(id, status);
};

