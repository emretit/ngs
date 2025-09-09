
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Edit, X, Check, Plus } from "lucide-react";

type FormActionsProps = {
  onClose: () => void;
  isSubmitting: boolean;
  isEditing: boolean;
  showPreview?: boolean;
  setShowPreview?: (show: boolean) => void;
};

export const FormActions: React.FC<FormActionsProps> = ({ 
  onClose, 
  isSubmitting, 
  isEditing,
  showPreview,
  setShowPreview
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
      <Button 
        variant="outline" 
        onClick={onClose} 
        type="button" 
        className="font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <X className="h-4 w-4" />
        İptal
      </Button>
      
      {setShowPreview && (
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => setShowPreview(!showPreview)}
          className="font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {showPreview ? (
            <>
              <Edit className="h-4 w-4" />
              Düzenle
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Önizle
            </>
          )}
        </Button>
      )}
      
      <Button 
        type="submit" 
        disabled={isSubmitting} 
        className="font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 min-w-[120px]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          <>
            {isEditing ? (
              <>
                <Check className="h-4 w-4" />
                Güncelle
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Oluştur
              </>
            )}
          </>
        )}
      </Button>
    </div>
  );
};
