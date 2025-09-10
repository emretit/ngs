
import React from "react";
import { Button } from "@/components/ui/button";

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
    <div className="flex justify-end space-x-2 mt-6">
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
      )}
      <Button
        type="button"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Add Employee"}
      </Button>
    </div>
  );
};
