import React from "react";
import ProductionBOMsViewToggle, { BOMsViewType } from "./ProductionBOMsViewToggle";
import BOMTable from "./BOMTable";
import BOMsGrid from "./BOMsGrid";
import { BOM } from "@/types/production";

interface BOMsContentProps {
  boms: BOM[];
  isLoading: boolean;
  activeView: BOMsViewType;
  setActiveView: (view: BOMsViewType) => void;
  onSelectBOM: (bom: BOM) => void;
  onEditBOM?: (bom: BOM) => void;
  onDeleteBOM?: (bomId: string) => void;
  onDuplicateBOM?: (bom: BOM) => void;
  searchQuery?: string;
}

const BOMsContent = ({
  boms,
  isLoading,
  activeView,
  setActiveView,
  onSelectBOM,
  onEditBOM,
  onDeleteBOM,
  onDuplicateBOM,
  searchQuery
}: BOMsContentProps) => {
  return (
    <div className="space-y-4">
      {/* View Toggle - Sağ üstte */}
      <div className="flex justify-end">
        <ProductionBOMsViewToggle
          activeView={activeView}
          setActiveView={setActiveView}
        />
      </div>

      {/* Content based on active view */}
      {activeView === "table" && (
        <BOMTable
          boms={boms}
          isLoading={isLoading}
          onSelectBOM={onSelectBOM}
          onEditBOM={onEditBOM}
          onDeleteBOM={onDeleteBOM}
          onDuplicateBOM={onDuplicateBOM}
          searchQuery={searchQuery}
        />
      )}

      {activeView === "grid" && (
        <BOMsGrid
          boms={boms}
          isLoading={isLoading}
          onBOMClick={onSelectBOM}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};

export default BOMsContent;

