
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProposalActionsProps {
  onCreateClick: () => void;
}

const ProposalActions = ({ onCreateClick }: ProposalActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Teklifler</h1>
        <p className="text-sm text-muted-foreground">
          Müşterilere gönderilen teklifleri yönetin ve takip edin
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={onCreateClick} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Yeni Teklif</span>
        </Button>
      </div>
    </div>
  );
};

export default ProposalActions;
