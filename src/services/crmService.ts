
import { ServiceOptions } from "./base/BaseService";
import { proposalService, changeProposalStatus } from "./proposal/proposalService";
import { opportunityService } from "./opportunity/opportunityService";
import { Proposal, ProposalStatus, ProposalAttachment } from "@/types/proposal";
import { Opportunity } from "@/types/crm";

// Re-export the services
export { proposalService, opportunityService, changeProposalStatus };

// Re-export the interface
export type CrmServiceOptions = ServiceOptions;

class CrmService {
  // Proposal Methods
  async getProposals(options: CrmServiceOptions = {}) {
    return proposalService.getProposals(options);
  }
  
  async getProposalById(id: string) {
    return proposalService.getProposalById(id);
  }
  
  async createProposal(proposal: Partial<Proposal>) {
    return proposalService.createProposal(proposal);
  }
  
  async updateProposal(id: string, proposal: Partial<Proposal>) {
    return proposalService.updateProposal(id, proposal);
  }
  
  async deleteProposal(id: string) {
    return proposalService.deleteProposal(id);
  }
  
  async updateProposalStatus(id: string, status: ProposalStatus) {
    return proposalService.updateProposalStatus(id, status);
  }
  
  async addProposalAttachment(id: string, attachment: ProposalAttachment) {
    return proposalService.addProposalAttachment(id, attachment);
  }
  
  // Opportunity Methods
  async updateOpportunity(id: string, updateData: Partial<Opportunity>) {
    return opportunityService.updateOpportunity(id, updateData);
  }
}

export const crmService = new CrmService();
