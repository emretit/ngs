import React from "react";
import { Button } from "@/components/ui/button";
import { List, Grid3x3 } from "lucide-react";

type ViewType = "grid" | "list";

interface PdfTemplatesViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const PdfTemplatesViewToggle = ({ activeView, setActiveView }: PdfTemplatesViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border bg-background">
      <Button
        type="button"
        variant={activeView === "list" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-0 h-8"
        onClick={() => setActiveView("list")}
      >
        <List className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden sm:inline">Liste</span>
      </Button>
      <Button
        type="button"
        variant={activeView === "grid" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-0 h-8"
        onClick={() => setActiveView("grid")}
      >
        <Grid3x3 className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  );
};

export default PdfTemplatesViewToggle;

