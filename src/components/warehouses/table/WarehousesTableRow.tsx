import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { Warehouse } from "@/types/warehouse";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface WarehousesTableRowProps {
  warehouse: Warehouse;
  onSelect?: (warehouse: Warehouse) => void;
  onSelectToggle?: (warehouse: Warehouse) => void;
  onView: (warehouse: Warehouse) => void;
  onDelete?: (warehouse: Warehouse) => void;
  isSelected?: boolean;
}

const WarehousesTableRow = ({ 
  warehouse, 
  onSelect, 
  onSelectToggle,
  onView,
  onDelete,
  isSelected = false
}: WarehousesTableRowProps) => {
  const navigate = useNavigate();

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'main':
        return 'Ana Depo';
      case 'sub':
        return 'Alt Depo';
      case 'virtual':
        return 'Sanal Depo';
      case 'transit':
        return 'Geçici Depo';
      default:
        return 'Depo';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'main':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'sub':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'virtual':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'transit':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <TableRow 
      className={`cursor-pointer hover:bg-blue-50 h-8 ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => onView(warehouse)}
    >
      {/* Checkbox */}
      {onSelectToggle && (
        <TableCell className="py-2 px-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectToggle(warehouse)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}

      {/* Depo Adı */}
      <TableCell className="py-2 px-3">
        <div className="text-xs font-medium text-gray-900">
          {warehouse.name}
        </div>
      </TableCell>

      {/* Kod */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {warehouse.code || '-'}
      </TableCell>

      {/* Adres */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        <div className="max-w-[200px] truncate">
          {warehouse.address || '-'}
        </div>
      </TableCell>

      {/* Tip */}
      <TableCell className="py-2 px-3">
        {warehouse.warehouse_type ? (
          <Badge variant="outline" className={getTypeColor(warehouse.warehouse_type)}>
            {getTypeLabel(warehouse.warehouse_type)}
          </Badge>
        ) : (
          '-'
        )}
      </TableCell>

      {/* Durum */}
      <TableCell className="py-2 px-3">
        <Badge 
          variant="outline" 
          className={warehouse.is_active 
            ? "bg-green-100 text-green-800 border-green-300" 
            : "bg-gray-100 text-gray-800 border-gray-300"
          }
        >
          {warehouse.is_active ? "Aktif" : "Pasif"}
        </Badge>
      </TableCell>

      {/* İşlemler */}
      <TableCell className="py-2 px-3">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/inventory/warehouses/${warehouse.id}/edit`);
            }}
            className="h-8 w-8"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(warehouse);
              }}
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default WarehousesTableRow;

