import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check, X } from "lucide-react";
import { usePurchaseOrderNew, useSubmitPurchaseOrderNew, useConfirmPurchaseOrderNew } from "@/hooks/usePurchaseOrdersNew";
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

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = usePurchaseOrderNew(id!);
  const submitOrder = useSubmitPurchaseOrderNew();
  const confirmOrder = useConfirmPurchaseOrderNew();

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!order) {
    return <div className="container mx-auto p-6">Sipariş bulunamadı</div>;
  }

  const handleSubmit = async () => {
    try {
      await submitOrder.mutateAsync(order.id);
    } catch (error) {
      console.error('Error submitting order:', error);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmOrder.mutateAsync(order.id);
    } catch (error) {
      console.error('Error confirming order:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/purchasing/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Sipariş Detayı</h1>
          <p className="text-muted-foreground">{order.order_number}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'draft' && (
            <Button onClick={handleSubmit} disabled={submitOrder.isPending}>
              <Check className="h-4 w-4 mr-2" />
              Onaya Gönder
            </Button>
          )}
          {order.status === 'submitted' && (
            <Button onClick={handleConfirm} disabled={confirmOrder.isPending}>
              <Check className="h-4 w-4 mr-2" />
              Onayla
            </Button>
          )}
          {(order.status === 'confirmed' || order.status === 'partial_received') && (
            <Button onClick={() => navigate(`/purchasing/orders/${order.id}/receive`)}>
              <Check className="h-4 w-4 mr-2" />
              Mal Kabul
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Sipariş Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durum:</span>
              <span>{getStatusBadge(order.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tedarikçi:</span>
              <span className="font-medium">{order.supplier?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sipariş Tarihi:</span>
              <span>{format(new Date(order.order_date), 'dd.MM.yyyy')}</span>
            </div>
            {order.expected_delivery_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teslim Tarihi:</span>
                <span>{format(new Date(order.expected_delivery_date), 'dd.MM.yyyy')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Öncelik:</span>
              <span className="capitalize">{order.priority}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Tutar Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ara Toplam:</span>
              <span>
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: order.currency,
                }).format(order.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KDV:</span>
              <span>
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: order.currency,
                }).format(order.tax_total)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Toplam:</span>
              <span>
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: order.currency,
                }).format(order.total_amount)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {(order.delivery_address || order.notes) && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Ek Bilgiler</h3>
          {order.delivery_address && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Teslimat Adresi:</span>
              <p className="text-sm">{order.delivery_address}</p>
            </div>
          )}
          {order.notes && (
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Notlar:</span>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Ürünler</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Açıklama</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">İskonto %</TableHead>
              <TableHead className="text-right">KDV %</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.uom}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: order.currency,
                  }).format(item.unit_price)}
                </TableCell>
                <TableCell className="text-right">{item.discount_rate}%</TableCell>
                <TableCell className="text-right">{item.tax_rate}%</TableCell>
                <TableCell className="text-right font-medium">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: order.currency,
                  }).format(item.line_total)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
