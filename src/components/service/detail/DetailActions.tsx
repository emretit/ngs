
import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";

interface DetailActionsProps {
  isPending: boolean;
  onSave: () => void;
  onClose: () => void;
}

export const DetailActions: React.FC<DetailActionsProps> = ({ isPending, onSave, onClose }) => {
  return (
    <div className="mt-6 flex justify-end space-x-3">
      <Button variant="outline" onClick={onClose} className="font-medium">
        Kapat
      </Button>
      <Button 
        onClick={onSave}
        disabled={isPending}
        className="font-medium"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Kaydet
          </>
        )}
      </Button>
    </div>
  );
};
