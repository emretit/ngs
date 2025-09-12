import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ServiceViewToggle from "./ServiceViewToggle";

type ViewType = "calendar" | "list";

interface ServicePageHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onCreateRequest: () => void;
}

const ServicePageHeader = ({ 
  activeView, 
  setActiveView, 
  onCreateRequest
}: ServicePageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-card to-muted/50 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          Servis Yönetimi
        </h1>
        <p className="text-sm text-muted-foreground/80">
          Teknisyenlerinizi yönetin ve servis taleplerini takip edin.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <ServiceViewToggle 
          activeView={activeView} 
          setActiveView={setActiveView} 
        />
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onCreateRequest}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Servis Talebi</span>
        </Button>
      </div>
    </div>
  );
};

export default ServicePageHeader;
