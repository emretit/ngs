import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePurchaseOrdersNew } from "@/hooks/usePurchaseOrdersNew";
import { format } from "date-fns";

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: "Taslak", variant: "secondary" as const },
    submitted: { label: "Onay Bekliyor", variant: "default" as const },
    confirmed: { label: "Onaylandı", variant: "default" as const },
    partial_received: { label: "Kısmi Alındı", variant: "default" as const },
    received: { label: "Tamamlandı", variant: "default" as const },
    cancelled: { label: "İptal", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function PurchaseOrdersList() {
  const navigate = useNavigate();
  const { data: orders, isLoading } = usePurchaseOrdersNew();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Satın Alma Siparişleri</h1>
          <p className="text-muted-foreground">Tedarikçilerden sipariş yönetimi</p>
        </div>
        <Button onClick={() => navigate("/purchasing/orders/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sipariş
        </Button>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="text-center py-8">Yükleniyor...</div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Henüz sipariş bulunmuyor
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş No</TableHead>
                <TableHead>Tedarikçi</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Teslim Tarihi</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/purchasing/orders/${order.id}`)}
                >
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{order.supplier?.name || '-'}</TableCell>
                  <TableCell>{format(new Date(order.order_date), 'dd.MM.yyyy')}</TableCell>
                  <TableCell>
                    {order.expected_delivery_date 
                      ? format(new Date(order.expected_delivery_date), 'dd.MM.yyyy')
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: order.currency || 'TRY',
                    }).format(order.total_amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
