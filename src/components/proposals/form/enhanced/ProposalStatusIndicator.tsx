import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Save, Loader2 } from "lucide-react";

interface ProposalStatusIndicatorProps {
  hasChanges: boolean;
  autoSaving: boolean;
  validationErrors: Record<string, string[]>;
}

const ProposalStatusIndicator: React.FC<ProposalStatusIndicatorProps> = ({
  hasChanges,
  autoSaving,
  validationErrors
}) => {
  const errorCount = Object.keys(validationErrors).length;

  if (autoSaving) {
    return (
      <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        Kaydediliyor...
      </Badge>
    );
  }

  if (errorCount > 0) {
    return (
      <Badge variant="destructive" className="gap-1 animate-pulse">
        <AlertCircle className="h-3 w-3" />
        {errorCount} Hata
      </Badge>
    );
  }

  if (hasChanges) {
    return (
      <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
        <Save className="h-3 w-3" />
        Kaydedilmemiş Değişiklikler
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
      <CheckCircle className="h-3 w-3" />
      Güncel
    </Badge>
  );
};

export default ProposalStatusIndicator; 