
import React from "react";
import { ProposalTemplate } from "@/types/proposal-template";
import ProposalTemplateForm from "./form/ProposalTemplateForm";

interface ProposalFormProps {
  template: ProposalTemplate;
  onSaveDraft: () => void;
}

const ProposalForm: React.FC<ProposalFormProps> = ({ template, onSaveDraft }) => {
  return <ProposalTemplateForm template={template} onSaveDraft={onSaveDraft} />;
};

export default ProposalForm;
