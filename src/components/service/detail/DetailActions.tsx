
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
    <div className="flex justify-end space-x-2 pt-2 bg-muted/10 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
      <Button variant="outline" onClick={onClose} className="font-medium h-8 text-sm">
        Kapat
      </Button>
      <Button 
        onClick={onSave}
        disabled={isPending}
        className="font-medium h-8 text-sm"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          <>
            <Save className="mr-1 h-3 w-3" />
            Kaydet
          </>
        )}
      </Button>
    </div>
  );
};
