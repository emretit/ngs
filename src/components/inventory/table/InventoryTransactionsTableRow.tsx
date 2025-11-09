import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit2, MoreHorizontal, Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { InventoryTransaction } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ClipboardList } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface InventoryTransactionsTableRowProps {
  transaction: InventoryTransaction;
  onSelect?: (transaction: InventoryTransaction) => void;
  onSelectToggle?: (transaction: InventoryTransaction) => void;
  onView: (transaction: InventoryTransaction) => void;
  onEdit?: (transaction: InventoryTransaction) => void;
  onDelete?: (transaction: InventoryTransaction) => void;
  onPrint?: (transaction: InventoryTransaction) => void;
  isSelected?: boolean;
}

const InventoryTransactionsTableRow = ({ 
  transaction, 
  onSelect, 
  onSelectToggle,
  onView,
  onEdit,
  onDelete,
  onPrint,
  isSelected = false
}: InventoryTransactionsTableRowProps) => {
  const getTypeBadge = () => {
    switch (transaction.transaction_type) {
      case 'giris':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">⬇️ Giriş</Badge>;
      case 'cikis':
        return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">⬆️ Çıkış</Badge>;
      case 'transfer':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">↔️ Transfer</Badge>;
      case 'sayim':
        return <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">📋 Sayım</Badge>;
      default:
        return <Badge variant="outline">{transaction.transaction_type}</Badge>;
    }
  };

  const getTypeIcon = () => {
    switch (transaction.transaction_type) {
      case 'giris':
        return <ArrowDownToLine className="h-3 w-3 text-green-600" />;
      case 'cikis':
        return <ArrowUpFromLine className="h-3 w-3 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="h-3 w-3 text-blue-600" />;
      case 'sayim':
        return <ClipboardList className="h-3 w-3 text-purple-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    switch (transaction.status) {
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">⏳ Bekleyen</Badge>;
      case 'approved':
        return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">✅ Onaylı</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">✔️ Tamamlandı</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">❌ İptal</Badge>;
      default:
        return <Badge variant="outline">{transaction.status}</Badge>;
    }
  };

  return (
    <TableRow 
      className={`cursor-pointer hover:bg-blue-50 h-8 ${isSelected ? 'bg-blue-50' : ''}`}
      onClick={() => onView(transaction)}
    >
      {/* Checkbox */}
      {onSelectToggle && (
        <TableCell className="py-2 px-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelectToggle(transaction)}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>
      )}

      {/* İşlem No */}
      <TableCell className="py-2 px-3">
        <div className="text-xs font-medium text-gray-900">
          {transaction.transaction_number || 'N/A'}
        </div>
      </TableCell>

      {/* İşlem Tipi */}
      <TableCell className="py-2 px-3">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          {getTypeBadge()}
        </div>
      </TableCell>

      {/* Tarih */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {transaction.transaction_date 
          ? format(new Date(transaction.transaction_date), "dd MMM yyyy", { locale: tr })
          : '-'}
      </TableCell>

      {/* Depo */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {transaction.warehouse_name || transaction.warehouse?.name ? (
          <Button
            variant="link"
            className="h-auto p-0 text-xs font-medium text-blue-600 hover:text-blue-800"
            onClick={(e) => {
              e.stopPropagation();
              if (transaction.warehouse_id) {
                window.location.href = `/inventory/warehouses/${transaction.warehouse_id}`;
              }
            }}
          >
            {transaction.warehouse_name || transaction.warehouse?.name}
          </Button>
        ) : (
          '-'
        )}
      </TableCell>

      {/* Ürün Sayısı */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {transaction.items?.length || 0} ürün
      </TableCell>

      {/* Durum */}
      <TableCell className="py-2 px-3">
        {getStatusBadge()}
      </TableCell>

      {/* İşlemler */}
      <TableCell className="py-2 px-3">
        <div className="flex justify-center space-x-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
              }}
              className="h-8 w-8"
              title="Düzenle"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction);
              }}
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          
          {(onPrint) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8"
                  title="Daha Fazla"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onPrint && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onPrint(transaction);
                  }}>
                    <Printer className="h-4 w-4 mr-2" />
                    Yazdır
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default InventoryTransactionsTableRow;

