
import { useProposalTemplates } from "./proposals/useProposalTemplates";
import { useProposalCalculations } from "./proposals/useProposalCalculations";
import { useProposalCreation } from "./proposals/useProposalCreation";
import { useProposalDraft } from "./proposals/useProposalDraft";

export const useProposalForm = () => {
  const templates = useProposalTemplates();
  const calculations = useProposalCalculations();
  const { isLoading: isCreating, createProposal } = useProposalCreation();
  const { isLoading: isSavingDraft, saveDraft } = useProposalDraft();

  return {
    // Template-related props
    selectedTemplate: templates.selectedTemplate,
    setSelectedTemplate: templates.setSelectedTemplate,
    handleSelectTemplate: templates.handleSelectTemplate,
    
    // Calculation-related props
    calculateTotals: calculations.calculateTotals,
    
    // Creation-related props
    handleCreateProposal: createProposal,
    createProposal,
    
    // Draft-related props
    saveDraft,
    
    // Loading states
    isLoading: isCreating || isSavingDraft
  };
};
