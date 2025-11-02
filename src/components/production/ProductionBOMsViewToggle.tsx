import React from "react";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";

export type BOMsViewType = "table" | "grid";

interface ProductionBOMsViewToggleProps {
  activeView: BOMsViewType;
  setActiveView: (view: BOMsViewType) => void;
}

const ProductionBOMsViewToggle = ({
  activeView,
  setActiveView,
}: ProductionBOMsViewToggleProps) => {
  return (
    <div className="flex rounded-md overflow-hidden border bg-background">
      <Button
        type="button"
        variant={activeView === "table" ? "default" : "ghost"}
        size="sm"
        className="rounded-none border-0 h-8"
        onClick={() => setActiveView("table")}
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
        <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
    </div>
  );
};

export default ProductionBOMsViewToggle;

