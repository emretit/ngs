import React from "react";
import { BOMsViewType } from "./ProductionBOMsViewToggle";
import BOMTable from "./BOMTable";
import BOMsGrid from "./BOMsGrid";
import { BOM } from "@/types/production";

interface BOMsContentProps {
  boms: BOM[];
  isLoading: boolean;
  totalCount?: number;
  error?: any;
  activeView: BOMsViewType;
  setActiveView: (view: BOMsViewType) => void;
  onSelectBOM: (bom: BOM) => void;
  onEditBOM?: (bom: BOM) => void;
  onDeleteBOM?: (bomId: string) => void;
  onDuplicateBOM?: (bom: BOM) => void;
  searchQuery?: string;
  selectedBOMs?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const BOMsContent = ({
  boms,
  isLoading,
  totalCount,
  error,
  activeView,
  setActiveView,
  onSelectBOM,
  onEditBOM,
  onDeleteBOM,
  onDuplicateBOM,
  searchQuery,
  selectedBOMs = [],
  onSelectionChange,
  sortField,
  sortDirection,
  onSort
}: BOMsContentProps) => {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Reçeteler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            {activeView === "table" ? (
              <BOMTable
                boms={boms}
                isLoading={isLoading}
                onSelectBOM={onSelectBOM}
                onEditBOM={onEditBOM}
                onDeleteBOM={onDeleteBOM}
                onDuplicateBOM={onDuplicateBOM}
                selectedBOMs={selectedBOMs}
                onSelectionChange={onSelectionChange}
                sortField={sortField as any}
                sortDirection={sortDirection as any}
                onSort={onSort as any}
              />
            ) : (
              <BOMsGrid
                boms={boms}
                isLoading={isLoading}
                onBOMClick={onSelectBOM}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </div>
        
        {/* Toplam reçete sayısı */}
        {boms.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            {totalCount || boms.length} reçete
          </div>
        )}
      </div>
    </div>
  );
};

export default BOMsContent;

