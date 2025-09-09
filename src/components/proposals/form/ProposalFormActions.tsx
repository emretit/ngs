
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

export interface ProposalFormActionsProps {
  isNew: boolean;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
  isFormDirty: boolean;
}

const ProposalFormActions: React.FC<ProposalFormActionsProps> = ({
  isNew,
  saving,
  onSave,
  onBack,
  isFormDirty
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={saving}
        className="w-full sm:w-auto"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Geri Dön
      </Button>

      <Button
        type="button"
        onClick={onSave}
        disabled={saving || !isFormDirty}
        className="w-full sm:w-auto"
      >
        <Save className="mr-2 h-4 w-4" />
        {isNew ? "Teklif Oluştur" : "Teklifi Güncelle"}
      </Button>
    </div>
  );
};

export default ProposalFormActions;
