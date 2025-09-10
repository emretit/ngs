
import { ActionButtonGroup } from "@/components/shared";

interface FormActionsProps {
  onClose: () => void;
  isEditing: boolean;
  isSubmitting: boolean;
}

const FormActions = ({ onClose, isEditing, isSubmitting }: FormActionsProps) => {
  return (
    <ActionButtonGroup
      onCancel={onClose}
      onSave={undefined} // Form submit kullanıyor
      saveText={isEditing ? "Güncelle" : "Oluştur"}
      cancelText="İptal"
      saveLoading={isSubmitting}
      saveDisabled={isSubmitting}
      className="pt-4"
    />
  );
};

export default FormActions;
