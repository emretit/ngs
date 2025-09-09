
import { useState } from "react";
import { ProposalTemplate } from "@/types/proposal-template";

export const useProposalTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);

  const handleSelectTemplate = (template: ProposalTemplate) => {
    setSelectedTemplate(template);
  };

  return {
    selectedTemplate,
    setSelectedTemplate,
    handleSelectTemplate,
  };
};
