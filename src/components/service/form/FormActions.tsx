
import React from "react";
import { Button } from "@/components/ui/button";

type FormActionsProps = {
  onClose: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
};

export const FormActions: React.FC<FormActionsProps> = ({ 
  onClose, 
  isSubmitting, 
  isEditing
}) => {
  return (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="outline" 
        type="button" 
        onClick={onClose} 
        disabled={isSubmitting}
      >
        İptal
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Kaydediliyor..." : (isEditing ? "Güncelle" : "Kaydet")}
      </Button>
    </div>
  );
};
