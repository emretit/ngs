import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check } from "lucide-react";
import { usePurchaseOrderNew } from "@/hooks/usePurchaseOrdersNew";
import { useCreateGRN } from "@/hooks/useGRNs";
import { format } from "date-fns";

interface GRNLineData {
  po_line_id: string;
  received_quantity: number;
  qc_status: 'accepted' | 'rework' | 'rejected';
  location_id?: string;
  serials?: string[];
  batches?: string[];
  notes?: string;
}

export default function ReceivePurchaseOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading } = usePurchaseOrderNew(id!);
  const createGRN = useCreateGRN();
  
  const [receiptData, setReceiptData] = useState<{
    received_date: string;
    warehouse_id?: string;
    notes?: string;
    lines: GRNLineData[];
  }>({
    received_date: new Date().toISOString().split('T')[0],
    lines: [],
  });

  const updateLineData = (itemId: string, field: keyof GRNLineData, value: any) => {
    setReceiptData(prev => {
      const existingIndex = prev.lines.findIndex(l => l.po_line_id === itemId);
      if (existingIndex >= 0) {
        const newLines = [...prev.lines];
        newLines[existingIndex] = { ...newLines[existingIndex], [field]: value };
        return { ...prev, lines: newLines };
      }
      return {
        ...prev,
        lines: [...prev.lines, { 
          po_line_id: itemId, 
          received_quantity: 0,
          qc_status: 'accepted',
          [field]: value 
        }],
      };
    });
  };

  const getLineData = (itemId: string): GRNLineData => {
    return receiptData.lines.find(l => l.po_line_id === itemId) || {
      po_line_id: itemId,
      received_quantity: 0,
      qc_status: 'accepted',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGRN.mutateAsync({
        po_id: id!,
        received_date: receiptData.received_date,
        warehouse_id: receiptData.warehouse_id,
        notes: receiptData.notes,
        lines: receiptData.lines.filter(l => l.received_quantity > 0),
      });
      navigate(`/purchasing/grns`);
    } catch (error) {
      console.error('Error creating GRN:', error);
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
                <TableHead>Sipariş</TableHead>
                <TableHead>Alınan</TableHead>
                <TableHead>Kalan</TableHead>
                <TableHead>Teslim Miktar</TableHead>
                <TableHead>Kalite</TableHead>
                <TableHead>Lokasyon</TableHead>
                <TableHead>Notlar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items?.map((item) => {
                const remaining = item.quantity - (item.received_quantity || 0);
                const lineData = getLineData(item.id);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell>{item.quantity} {item.uom}</TableCell>
                    <TableCell>{item.received_quantity || 0} {item.uom}</TableCell>
                    <TableCell>{remaining} {item.uom}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={remaining}
                        step="0.001"
                        value={lineData.received_quantity}
                        onChange={(e) => updateLineData(item.id, 'received_quantity', parseFloat(e.target.value) || 0)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={lineData.qc_status}
                        onValueChange={(value) => updateLineData(item.id, 'qc_status', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accepted">Kabul</SelectItem>
                          <SelectItem value="rework">İşlem Gerekli</SelectItem>
                          <SelectItem value="rejected">Red</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="LOC-A1"
                        value={lineData.location_id || ''}
                        onChange={(e) => updateLineData(item.id, 'location_id', e.target.value)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Notlar..."
                        value={lineData.notes || ''}
                        onChange={(e) => updateLineData(item.id, 'notes', e.target.value)}
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
          <Button type="submit" disabled={createGRN.isPending}>
            <Check className="h-4 w-4 mr-2" />
            {createGRN.isPending ? "Kaydediliyor..." : "GRN Oluştur"}
          </Button>
        </div>
      </form>
    </div>
  );
}
