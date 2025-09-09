
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ServiceViewToggle, ViewType } from "../view/ServiceViewToggle";

interface ServicePageHeaderProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  onCreateRequest: () => void;
}

export const ServicePageHeader: React.FC<ServicePageHeaderProps> = ({
  activeView,
  setActiveView,
  onCreateRequest
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Servis Yönetimi</h1>
        <p className="text-muted-foreground mt-2">Tüm servis taleplerini görüntüleyin ve yönetin</p>
      </div>
      <div className="flex gap-3 items-center">
        <ServiceViewToggle activeView={activeView} setActiveView={setActiveView} />
        <Button 
          size="sm"
          onClick={onCreateRequest}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Servis Talebi
        </Button>
      </div>
    </div>
  );
};
