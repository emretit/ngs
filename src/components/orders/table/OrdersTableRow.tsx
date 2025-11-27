import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Order, OrderStatus } from "@/types/orders";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  ShoppingCart, 
  FileText, 
  Settings, 
  Printer,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { formatProposalAmount } from "@/services/workflow/proposalWorkflow";

interface OrdersTableRowProps {
  order: Order;
  index: number;
  onSelect: (order: Order) => void;
  onEdit?: (order: Order) => void;
  onDelete?: (orderId: string) => void;
  onConvertToInvoice?: (order: Order) => void;
  onConvertToService?: (order: Order) => void;
  onPrint?: (order: Order) => void;
}

export const OrdersTableRow: React.FC<OrdersTableRowProps> = ({
  order, 
  index, 
  onSelect,
  onEdit,
  onDelete,
  onConvertToInvoice,
  onConvertToService,
  onPrint
}) => {
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "processing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "shipped":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "confirmed":
        return "Onaylandı";
      case "processing":
        return "İşleniyor";
      case "shipped":
        return "Kargoda";
      case "delivered":
        return "Teslim Edildi";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  const shortenText = (text: string, maxLength: number = 25) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: tr });
    } catch {
      return "-";
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(order);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(order.id);
  };

  const handleConvertToInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConvertToInvoice) onConvertToInvoice(order);
  };

  const handleConvertToService = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConvertToService) onConvertToService(order);
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPrint) onPrint(order);
  };

  return (
    <TableRow 
      className="h-16 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelect(order)}
    >
      <TableCell className="p-4 font-medium text-sm">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span>#{order.order_number}</span>
        </div>
      </TableCell>
      <TableCell className="p-4">
        <div className="flex items-center space-x-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {order.customer?.name?.substring(0, 1) || 'M'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium" title={order.customer?.name}>
              {shortenText(order.customer?.name || "Müşteri yok", 30)}
            </div>
            {order.customer?.company && (
              <div className="text-xs text-muted-foreground" title={order.customer.company}>
                {shortenText(order.customer.company, 18)}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center p-4">
        <Badge className={getStatusColor(order.status)}>
          {getStatusLabel(order.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-center p-4 text-sm font-medium">
        {order.total_amount != null ? formatProposalAmount(order.total_amount, order.currency || 'TRY') : '-'}
      </TableCell>
      <TableCell className="text-center p-4 text-sm">{formatDate(order.order_date)}</TableCell>
      <TableCell className="text-center p-4 text-sm">{formatDate(order.delivery_date)}</TableCell>
      <TableCell className="p-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8"
            title="Düzenle"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* Dönüştürme İşlemleri */}
              <DropdownMenuLabel>Dönüştür</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handleConvertToInvoice}
                className="cursor-pointer"
              >
                <Receipt className="h-4 w-4 mr-2 text-purple-500" />
                <span>Faturaya Çevir</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleConvertToService}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-2 text-blue-500" />
                <span>Servise Çevir</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Yazdırma */}
              <DropdownMenuLabel>Yazdırma</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={handlePrint}
                className="cursor-pointer"
              >
                <Printer className="h-4 w-4 mr-2 text-blue-500" />
                <span>Yazdır</span>
              </DropdownMenuItem>
              
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Sil</span>
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