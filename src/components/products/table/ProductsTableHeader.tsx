import React from "react";
import { TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductsTableHeaderProps {
  sortField: "name" | "price" | "stock_quantity" | "category";
  sortDirection: "asc" | "desc";
  onSort: (field: "name" | "price" | "stock_quantity" | "category") => void;
  hasSelection: boolean;
  onSelectAll?: (checked: boolean) => void;
  isAllSelected?: boolean;
  totalProducts?: number;
}

const ProductsTableHeader = ({ 
  sortField, 
  sortDirection, 
  onSort, 
  hasSelection, 
  onSelectAll, 
  isAllSelected,
  totalProducts = 0
}: ProductsTableHeaderProps) => {
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  return (
    <TableHeader>
      <TableRow className="bg-slate-100 border-b border-slate-200">
        {hasSelection && (
          <TableHead className="w-[40px] py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">
            <Checkbox
              checked={isAllSelected || false}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
        )}
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("name")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📦</span>
            <span>Ürün Adı</span>
            {getSortIcon("name")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">🏷️</span>
            <span>SKU</span>
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("category")}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg mr-2">📂</span>
            <span>Kategori</span>
            {getSortIcon("category")}
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("price")}
        >
          <div className="flex items-center justify-end gap-1">
            <span className="text-lg mr-2">💰</span>
            <span>Fiyat</span>
            {getSortIcon("price")}
          </div>
        </TableHead>
        <TableHead
          className={cn(
            "py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right",
            "cursor-pointer hover:bg-slate-200"
          )}
          onClick={() => onSort("stock_quantity")}
        >
          <div className="flex items-center justify-end gap-1">
            <span className="text-lg mr-2">📊</span>
            <span>Stok</span>
            {getSortIcon("stock_quantity")}
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg mr-2">🟢</span>
            <span>Durum</span>
          </div>
        </TableHead>
        <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">
          <div className="flex items-center justify-end gap-1">
            <span className="text-lg mr-2">⚙️</span>
            <span>İşlemler</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ProductsTableHeader;

