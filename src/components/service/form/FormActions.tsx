
import React from "react";
import { ActionButtonGroup, ButtonGroup, SecondaryButton, PrimaryButton } from "@/components/shared";
import { Eye, Edit } from "lucide-react";

type FormActionsProps = {
  onClose: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
  showPreview?: boolean;
  setShowPreview?: (show: boolean) => void;
  onSave?: () => void;
};

export const FormActions: React.FC<FormActionsProps> = ({ 
  onClose, 
  isSubmitting, 
  isEditing,
  showPreview,
  setShowPreview,
  onSave
}) => {
  return (
    <div className="pt-8 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        {/* Preview Button */}
        {setShowPreview && (
          <SecondaryButton
            onClick={() => setShowPreview(!showPreview)}
            icon={showPreview ? Edit : Eye}
            className="font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
          >
            {showPreview ? "Düzenle" : "Önizle"}
          </SecondaryButton>
        )}

        {/* Action Button Group */}
        <ActionButtonGroup
          onCancel={onClose}
          onSave={isEditing ? onSave : undefined}
          saveText={isEditing ? "Kaydet" : "Oluştur"}
          cancelText="İptal"
          saveLoading={isSubmitting}
          saveDisabled={isSubmitting}
          orientation="horizontal"
          className="bg-transparent border-0 pt-0"
        />
      </div>
    </div>
  );
};
