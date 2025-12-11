import React, { useMemo } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { BOM } from "@/types/production";
import BOMTableHeader, { BOMSortField, BOMSortDirection } from "./table/BOMTableHeader";
import { BOMTableRow } from "./table/BOMTableRow";
import BOMTableEmpty from "./table/BOMTableEmpty";
import BOMTableSkeleton from "./table/BOMTableSkeleton";

interface BOMTableProps {
  boms: BOM[];
  isLoading: boolean;
  onSelectBOM: (bom: BOM) => void;
  onEditBOM?: (bom: BOM) => void;
  onDeleteBOM?: (bomId: string) => void;
  onDuplicateBOM?: (bom: BOM) => void;
  selectedBOMs?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  sortField?: BOMSortField;
  sortDirection?: BOMSortDirection;
  onSort?: (field: BOMSortField) => void;
}

const BOMTable = ({
  boms,
  isLoading,
  onSelectBOM,
  onEditBOM,
  onDeleteBOM,
  onDuplicateBOM,
  selectedBOMs = [],
  onSelectionChange,
  sortField: externalSortField = "created_at",
  sortDirection: externalSortDirection = "desc",
  onSort: externalOnSort
}: BOMTableProps) => {
  // Internal sort state (fallback)
  const [internalSortField, setInternalSortField] = React.useState<BOMSortField>("created_at");
  const [internalSortDirection, setInternalSortDirection] = React.useState<BOMSortDirection>("desc");
  
  // Use external sort if provided, otherwise use internal
  const sortField = externalSortField ?? internalSortField;
  const sortDirection = externalSortDirection ?? internalSortDirection;

  // Sort BOMs (filtering is done in parent component)
  const sortedBOMs = useMemo(() => {
    const sorted = [...boms];
    
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case "name":
          aValue = a.name?.toLowerCase() || "";
          bValue = b.name?.toLowerCase() || "";
          break;
        case "product_name":
          aValue = a.product_name?.toLowerCase() || "";
          bValue = b.product_name?.toLowerCase() || "";
          break;
        case "items_count":
          aValue = a.items?.length || 0;
          bValue = b.items?.length || 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc" 
          ? aValue - bValue
          : bValue - aValue;
      }
    });
    
    return sorted;
  }, [boms, sortField, sortDirection]);

  const allSelected = sortedBOMs.length > 0 && sortedBOMs.every(bom => selectedBOMs.includes(bom.id));
  const someSelected = sortedBOMs.some(bom => selectedBOMs.includes(bom.id));

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      const allIds = sortedBOMs.map(bom => bom.id);
      onSelectionChange([...new Set([...selectedBOMs, ...allIds])]);
    } else {
      const filteredIds = sortedBOMs.map(bom => bom.id);
      onSelectionChange(selectedBOMs.filter(id => !filteredIds.includes(id)));
    }
  };

  const handleSort = (field: BOMSortField) => {
    if (externalOnSort) {
      externalOnSort(field);
    } else {
      if (field === internalSortField) {
        setInternalSortDirection(internalSortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setInternalSortField(field);
        setInternalSortDirection('asc');
      }
    }
  };

  const handleSelectionChange = (bomId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange([...selectedBOMs, bomId]);
    } else {
      onSelectionChange(selectedBOMs.filter(id => id !== bomId));
    }
  };

  if (isLoading) {
    return <BOMTableSkeleton showCheckbox={!!onSelectionChange} />;
  }

  return (
    <div className="rounded-md border border-gray-200">
      <Table>
        <BOMTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          handleSort={handleSort}
          showCheckbox={!!onSelectionChange}
          allSelected={allSelected}
          someSelected={someSelected}
          onSelectAll={handleSelectAll}
        />
        <TableBody>
          {sortedBOMs.length === 0 ? (
            <BOMTableEmpty showCheckbox={!!onSelectionChange} />
          ) : (
            sortedBOMs.map((bom, index) => (
              <BOMTableRow
                key={bom.id}
                bom={bom}
                index={index}
                onSelect={onSelectBOM}
                onEdit={onEditBOM}
                onDelete={onDeleteBOM}
                onDuplicate={onDuplicateBOM}
                isSelected={selectedBOMs.includes(bom.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default BOMTable;
