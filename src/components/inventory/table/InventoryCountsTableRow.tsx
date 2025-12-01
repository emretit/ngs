import React from "react";
import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { InventoryTransaction } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Edit2,
  Trash2,
  CheckCircle2,
  Printer,
  XCircle
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface InventoryCountsTableRowProps {
  transaction: InventoryTransaction;
  onView: (transaction: InventoryTransaction) => void;
  onEdit?: (transaction: InventoryTransaction) => void;
  onDelete?: (transaction: InventoryTransaction) => void;
  onApprove?: (transaction: InventoryTransaction) => void;
  onCancel?: (transaction: InventoryTransaction) => void;
  onPrint?: (transaction: InventoryTransaction) => void;
}

const InventoryCountsTableRow = ({ 
  transaction, 
  onView,
  onEdit,
  onDelete,
  onApprove,
  onCancel,
  onPrint,
}: InventoryCountsTableRowProps) => {
  const navigate = useNavigate();
  
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
      className="cursor-pointer hover:bg-purple-50 h-8"
      onClick={() => onView(transaction)}
    >
      {/* Sayım No */}
      <TableCell className="py-2 px-3">
        <div className="text-xs font-medium text-gray-900">
          {transaction.transaction_number || 'N/A'}
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
                navigate(`/inventory/warehouses/${transaction.warehouse_id}`);
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

      {/* Referans */}
      <TableCell className="py-2 px-3 text-xs text-gray-600">
        {transaction.reference_number || '-'}
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
                title="Daha Fazla"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onApprove && transaction.status === 'pending' && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(transaction);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  <span>Onayla ve Tamamla</span>
                </DropdownMenuItem>
              )}
              {onPrint && (
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrint(transaction);
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  <span>Yazdır</span>
                </DropdownMenuItem>
              )}
              {onCancel && transaction.status === 'pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onCancel(transaction);
                    }}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    <span>İptal Et</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default InventoryCountsTableRow;
