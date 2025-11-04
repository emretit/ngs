import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { InventoryTransaction } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ClipboardList } from "lucide-react";

interface InventoryTransactionsTableRowProps {
  transaction: InventoryTransaction;
  onSelect?: (transaction: InventoryTransaction) => void;
  onSelectToggle?: (transaction: InventoryTransaction) => void;
  onView: (transaction: InventoryTransaction) => void;
  isSelected?: boolean;
}

const InventoryTransactionsTableRow = ({ 
  transaction, 
  onSelect, 
  onSelectToggle,
  onView,
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
        <div className="flex justify-end space-x-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onView(transaction);
            }}
            className="h-4 w-4 hover:bg-blue-100"
          >
            <Eye className="h-2.5 w-2.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default InventoryTransactionsTableRow;

