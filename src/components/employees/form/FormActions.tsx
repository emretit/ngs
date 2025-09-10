
import React from "react";
import { ActionButtonGroup } from "@/components/shared";

interface FormActionsProps {
  isEditMode: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel?: () => void;
}

export const FormActions: React.FC<FormActionsProps> = ({
  isEditMode,
  isSaving,
  onSave,
  onCancel
}) => {
  return (
    <ActionButtonGroup
      onCancel={onCancel}
      onSave={onSave}
      saveText={isEditMode ? "Save Changes" : "Add Employee"}
      cancelText="Cancel"
      saveLoading={isSaving}
      saveDisabled={isSaving}
      className="mt-6"
    />
  );
};
