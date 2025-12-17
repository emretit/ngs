import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { BOM } from "@/types/production";
import { Edit2, MoreHorizontal, Trash2, Copy, Layers, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface BOMTableRowProps {
  bom: BOM | null;
  index: number;
  onSelect: (bom: BOM) => void;
  onEdit?: (bom: BOM) => void;
  onDelete?: (bomId: string) => void;
  onDuplicate?: (bom: BOM) => void;
  isLoading?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (bomId: string, checked: boolean) => void;
}

export const BOMTableRow: React.FC<BOMTableRowProps> = ({
  bom,
  index,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isLoading = false,
  isSelected = false,
  onSelectionChange
}) => {
  const navigate = useNavigate();

  // Loading state için skeleton göster
  if (isLoading || !bom) {
    return (
      <TableRow className="h-8">
        {onSelectionChange && <TableCell className="py-2 px-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>}
        <TableCell className="py-2 px-3"><div className="h-3 w-48 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
      </TableRow>
    );
  }

  const handleRowClick = (e: React.MouseEvent) => {
    // Checkbox veya action button'a tıklanırsa row click'i engelle
    if ((e.target as HTMLElement).closest('button, input, [role="menuitem"]')) {
      return;
    }
    onSelect(bom);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(bom.id);
    }
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-gray-50/80 transition-colors h-8"
      onClick={handleRowClick}
    >
      {onSelectionChange && (
        <TableCell onClick={(e) => e.stopPropagation()} className="py-2 px-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectionChange(bom.id, checked as boolean)}
          />
        </TableCell>
      )}
      
      <TableCell className="py-2 px-3 font-medium">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-sm">{bom.name}</span>
          </div>
          {bom.description && (
            <div className="text-xs text-muted-foreground mt-1 pl-6 truncate max-w-[250px]">
              {bom.description}
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell className="py-2 px-3">
        <div className="flex items-center gap-2 text-gray-700 text-sm">
          <Package className="h-4 w-4 text-gray-400" />
          {bom.product_name || '-'}
        </div>
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center">
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs">
          {bom.items?.length || 0} bileşen
        </Badge>
      </TableCell>
      
      <TableCell className="py-2 px-3 text-gray-600 text-sm text-center">
        {format(new Date(bom.created_at), "dd MMM yyyy", { locale: tr })}
      </TableCell>
      
      <TableCell className="py-2 px-3 text-center">
        <div className="flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(bom);
              }}
              className="h-8 w-8 text-gray-500 hover:text-primary hover:bg-primary/10"
              title="Düzenle"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onDuplicate && (
                <DropdownMenuItem onClick={(e) => { 
                  e.stopPropagation(); 
                  onDuplicate(bom); 
                }}>
                  <Copy className="h-4 w-4 mr-2" />
                  Kopyala
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BOMTableRow;
