
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import OpportunityForm from "./OpportunityForm";
import OpportunitiesViewToggle from "./OpportunitiesViewToggle";

type ViewType = "kanban" | "list";

interface OpportunitiesHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const OpportunitiesHeader = ({ activeView, setActiveView }: OpportunitiesHeaderProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-card to-muted/50 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Satış Fırsatları
          </h1>
          <p className="text-sm text-muted-foreground/80">
            Tüm satış fırsatlarınızı yönetin ve takip edin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <OpportunitiesViewToggle 
            activeView={activeView} 
            setActiveView={setActiveView} 
          />
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Fırsat</span>
          </Button>
        </div>
      </div>
      
      <OpportunityForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </>
  );
};

export default OpportunitiesHeader;
