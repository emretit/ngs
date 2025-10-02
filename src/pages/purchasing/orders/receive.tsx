import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check } from "lucide-react";
import { usePurchaseOrderNew, useReceivePurchaseOrder } from "@/hooks/usePurchaseOrdersNew";
import { format } from "date-fns";

export default function ReceivePurchaseOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = usePurchaseOrderNew(id!);
  const receiveOrder = useReceivePurchaseOrder();
  
  const [receiptData, setReceiptData] = useState<{
    received_date: string;
    notes?: string;
    items: { item_id: string; received_quantity: number }[];
  }>({
    received_date: new Date().toISOString().split('T')[0],
    items: [],
  });

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setReceiptData(prev => {
      const existingIndex = prev.items.findIndex(i => i.item_id === itemId);
      if (existingIndex >= 0) {
        const newItems = [...prev.items];
        newItems[existingIndex] = { item_id: itemId, received_quantity: quantity };
        return { ...prev, items: newItems };
      }
      return {
        ...prev,
        items: [...prev.items, { item_id: itemId, received_quantity: quantity }],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await receiveOrder.mutateAsync({
        orderId: id!,
        ...receiptData,
      });
      navigate(`/purchasing/orders/${id}`);
    } catch (error) {
      console.error('Error receiving order:', error);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!order) {
    return <div className="container mx-auto p-6">Sipariş bulunamadı</div>;
  }

  if (order.status !== 'confirmed') {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <p className="text-destructive">Bu sipariş henüz onaylanmadı. Mal kabul için sipariş onaylanmış olmalıdır.</p>
          <Button onClick={() => navigate(`/purchasing/orders/${id}`)} className="mt-4">
            Sipariş Detayına Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/purchasing/orders/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Mal Kabul</h1>
          <p className="text-muted-foreground">{order.order_number}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Teslimat Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="received_date">Teslimat Tarihi *</Label>
              <Input
                id="received_date"
                type="date"
                value={receiptData.received_date}
                onChange={(e) => setReceiptData({ ...receiptData, received_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={receiptData.notes || ''}
              onChange={(e) => setReceiptData({ ...receiptData, notes: e.target.value })}
              rows={3}
              placeholder="Teslimat hakkında notlar..."
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Teslim Alınan Ürünler</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Sipariş Miktarı</TableHead>
                <TableHead>Daha Önce Alınan</TableHead>
                <TableHead>Kalan</TableHead>
                <TableHead>Teslim Alınan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => {
                const remaining = item.quantity - item.received_quantity;
                const receivedQty = receiptData.items.find(i => i.item_id === item.id)?.received_quantity || 0;
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity} {item.uom}</TableCell>
                    <TableCell>{item.received_quantity} {item.uom}</TableCell>
                    <TableCell>{remaining} {item.uom}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={remaining}
                        step="0.001"
                        value={receivedQty}
                        onChange={(e) => updateItemQuantity(item.id, parseFloat(e.target.value) || 0)}
                        className="w-32"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(`/purchasing/orders/${id}`)}>
            İptal
          </Button>
          <Button type="submit" disabled={receiveOrder.isPending}>
            <Check className="h-4 w-4 mr-2" />
            {receiveOrder.isPending ? "Kaydediliyor..." : "Mal Kabul Tamamla"}
          </Button>
        </div>
      </form>
    </div>
  );
}
