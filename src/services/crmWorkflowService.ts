
import { handleProposalStatusChange } from './workflow/proposalWorkflow';
import { taskWorkflow } from './workflow/taskWorkflow';
import { handleOpportunityCreation, handleOpportunityStatusChange } from './workflow/opportunityWorkflow';

export {
  handleProposalStatusChange,
  taskWorkflow,
  handleOpportunityCreation,
  handleOpportunityStatusChange
};

// Re-export specific task workflow functions for backward compatibility
export const createFollowUpTask = taskWorkflow.createFollowUpTask;
