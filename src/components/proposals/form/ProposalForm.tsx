
import React from "react";
import { Proposal } from "@/types/proposal";
import { ProposalFormData } from "@/types/proposal-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useProposalFormState } from "@/hooks/proposals/useProposalFormState";
import ProposalFormContent from "./ProposalFormContent";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ProposalFormProps {
  proposal: Proposal | null;
  loading: boolean;
  saving: boolean;
  isNew: boolean;
  onSave: (formData: any) => Promise<void>;
  onBack: () => void;
  title: string;
  subtitle: string;
}

const ProposalForm = ({
  proposal,
  loading,
  saving,
  isNew,
  onSave,
  onBack,
  title,
  subtitle,
}: ProposalFormProps) => {
  const {
    formData,
    formErrors,
    isFormDirty,
    formInitialized,
    handleInputChange,
    handleSelectChange,
    handleDateChange,
    handleItemsChange,
    handleCurrencyChange,
    handleSave,
    validateForm,
    saving: isSaving
  } = useProposalFormState(proposal, isNew, onSave);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: tr });
    } catch (error) {
      return "";
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSave();
  };

  if (loading || !formInitialized) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <form id="proposal-form" onSubmit={handleFormSubmit} className="space-y-6">
      <ProposalFormContent
        formData={formData}
        formErrors={formErrors}
        isNew={isNew}
        proposal={proposal}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleDateChange={handleDateChange}
        handleItemsChange={handleItemsChange}
        formatDate={formatDate}
      />
    </form>
  );
};

export default ProposalForm;
