
// Shared types that can be used across different modules
export type ProposalStatusShared = 
  | 'draft'
  | 'pending_approval'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired';

export const proposalWorkflowSteps: ProposalStatusShared[] = [
  'draft', 'pending_approval', 'sent', 'accepted'
];

export const finalProposalStages: ProposalStatusShared[] = [
  'accepted', 'rejected', 'expired'
];
