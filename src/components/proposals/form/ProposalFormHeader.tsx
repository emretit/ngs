
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save } from "lucide-react";
import { Proposal } from "@/types/proposal";

interface ProposalFormHeaderProps {
  title: string;
  subtitle: string;
  loading: boolean;
  saving: boolean;
  isNew: boolean;
  proposal: Proposal | null;
  onBack?: () => void;
  onSave?: () => void;
  isFormDirty?: boolean;
  validateForm?: () => boolean;
}

const ProposalFormHeader: React.FC<ProposalFormHeaderProps> = ({
  title,
  subtitle,
  loading,
  saving,
  isNew,
  proposal,
  onBack,
  onSave,
  isFormDirty,
  validateForm
}) => {
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      
      <div className="flex gap-2 self-end">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading || saving}
            className="hidden md:inline-flex"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        )}
        
        {onSave && (
          <Button
            onClick={handleSave}
            disabled={loading || saving || (!isFormDirty && !isNew)}
            className="hidden md:inline-flex"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProposalFormHeader;
