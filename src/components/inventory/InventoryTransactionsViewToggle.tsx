import React from "react";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

interface InventoryTransactionsViewToggleProps {
  activeView: "grid" | "table";
  setActiveView: (view: "grid" | "table") => void;
}

const InventoryTransactionsViewToggle = ({ 
  activeView, 
  setActiveView 
}: InventoryTransactionsViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-200">
      <Button
        variant={activeView === "table" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveView("table")}
        className="h-8 px-3"
      >
        <List className="h-4 w-4 mr-1" />
        <span className="text-xs">Tablo</span>
      </Button>
      <Button
        variant={activeView === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => setActiveView("grid")}
        className="h-8 px-3"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        <span className="text-xs">Izgara</span>
      </Button>
    </div>
  );
};

export default InventoryTransactionsViewToggle;

