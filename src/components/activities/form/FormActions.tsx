
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onClose: () => void;
  isEditing: boolean;
  isSubmitting: boolean;
}

const FormActions = ({ onClose, isEditing, isSubmitting }: FormActionsProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose} 
        disabled={isSubmitting}
      >
        İptal
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Oluştur"}
      </Button>
    </div>
  );
};

export default FormActions;
