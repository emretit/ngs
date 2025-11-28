import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { PurchaseOrder } from "@/hooks/usePurchaseOrders";
import StatusBadge from "@/components/common/StatusBadge";

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[];
  isLoading: boolean;
  onOrderSelect: (order: PurchaseOrder) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const PurchaseOrdersTable = ({ orders, isLoading, onOrderSelect }: PurchaseOrdersTableProps) => {
  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Siparişler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-gray-100 p-6 mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Henüz sipariş bulunmuyor
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          İlk satın alma siparişinizi oluşturmak için "Yeni Sipariş" butonuna tıklayın.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold">Sipariş No</TableHead>
            <TableHead className="font-semibold">Tedarikçi</TableHead>
            <TableHead className="font-semibold">Durum</TableHead>
            <TableHead className="font-semibold">Sipariş Tarihi</TableHead>
            <TableHead className="font-semibold">Beklenen Teslimat</TableHead>
            <TableHead className="font-semibold text-right">Ara Toplam</TableHead>
            <TableHead className="font-semibold text-right">KDV</TableHead>
            <TableHead className="font-semibold text-right">Toplam</TableHead>
            <TableHead className="font-semibold">Para Birimi</TableHead>
            <TableHead className="font-semibold text-center w-[100px]">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-gray-50/50 transition-colors"
              onClick={() => onOrderSelect(order)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {order.order_number}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{order.supplier?.name || "-"}</div>
                  {order.supplier?.email && (
                    <div className="text-xs text-muted-foreground">{order.supplier.email}</div>
                  )}
                </div>
              </TableCell>
              <TableCell><StatusBadge status={order.status} /></TableCell>
              <TableCell>{format(new Date(order.order_date), "dd.MM.yyyy")}</TableCell>
              <TableCell>
                {order.expected_delivery_date
                  ? format(new Date(order.expected_delivery_date), "dd.MM.yyyy")
                  : "-"}
              </TableCell>
              <TableCell className="text-right">
                {order.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                {order.tax_total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {order.total_amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono">
                  {order.currency}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOrderSelect(order);
                    }}
                    title="Detayları Görüntüle"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default React.memo(PurchaseOrdersTable);
