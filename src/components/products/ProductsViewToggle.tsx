import React from "react";
import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";

type ViewType = "grid" | "table";

interface ProductsViewToggleProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

const ProductsViewToggle = ({ activeView, setActiveView }: ProductsViewToggleProps) => {
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

export default ProductsViewToggle;

