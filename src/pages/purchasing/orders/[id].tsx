import { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Send, CheckCircle, XCircle, FileText, Save } from "lucide-react";
import { 
  usePurchaseOrder, 
  useUpdatePurchaseOrder, 
  useRequestPOApproval,
  useUpdatePOStatus,
  PurchaseOrderItem,
} from "@/hooks/usePurchaseOrders";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: "Taslak", variant: "secondary" as const },
    submitted: { label: "Onayda", variant: "default" as const },
    approved: { label: "Onaylandı", variant: "default" as const },
    sent: { label: "Gönderildi", variant: "default" as const },
    received: { label: "Teslim Alındı", variant: "default" as const },
    completed: { label: "Tamamlandı", variant: "default" as const },
    cancelled: { label: "İptal", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: po, isLoading } = usePurchaseOrder(id!);
  const updatePO = useUpdatePurchaseOrder();
  const requestApproval = useRequestPOApproval();
  const updateStatus = useUpdatePOStatus();
  
  const [editableItems, setEditableItems] = useState<PurchaseOrderItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!po) {
    return <div className="container mx-auto p-6">Sipariş bulunamadı</div>;
  }

  const handleStartEdit = () => {
    setEditableItems(po.items || []);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    await updatePO.mutateAsync({
      id: po.id,
      data: { items: editableItems },
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditableItems([]);
    setIsEditing(false);
  };

  // Memoized update item function
  const updateItem = useCallback((index: number, field: keyof PurchaseOrderItem, value: any) => {
    setEditableItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  // Memoized line total calculation
  const calculateLineTotal = useCallback((item: PurchaseOrderItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_rate / 100);
    const taxable = subtotal - discount;
    const tax = taxable * (item.tax_rate / 100);
    return taxable + tax;
  }, []);

  // Memoized display items
  const displayItems = useMemo(() => {
    return isEditing ? editableItems : (po.items || []);
  }, [isEditing, editableItems, po.items]);

  // Memoized totals calculation
  const { grandTotal, tryTotal } = useMemo(() => {
    const total = displayItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
    return {
      grandTotal: total,
      tryTotal: total * po.exchange_rate
    };
  }, [displayItems, calculateLineTotal, po.exchange_rate]);

  // Memoized event handlers
  const handleRequestApproval = useCallback(async () => {
    await requestApproval.mutateAsync(po.id);
  }, [requestApproval, po.id]);

  const handleSendToVendor = useCallback(() => {
    toast({
      title: "PDF Gönderiliyor",
      description: "Sipariş PDF'i tedarikçiye email ile gönderilecek.",
    });
  }, []);

  const approvalThreshold = 50000;
  const needsApproval = tryTotal >= approvalThreshold;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/purchasing/orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Satın Alma Siparişi</h1>
          <p className="text-muted-foreground">{po.order_number}</p>
        </div>
        <div className="flex gap-2">
          {po.status === 'draft' && (
            <>
              <Button variant="outline" onClick={handleRequestApproval}>
                <Send className="h-4 w-4 mr-2" />
                Onay Talebi
              </Button>
              {!needsApproval && (
                <Button onClick={() => updateStatus.mutateAsync({ id: po.id, status: 'approved' })}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Onayla
                </Button>
              )}
            </>
          )}
          {po.status === 'submitted' && (
            <>
              <Button 
                variant="outline" 
                onClick={() => updateStatus.mutateAsync({ id: po.id, status: 'draft' })}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reddet
              </Button>
              <Button onClick={() => updateStatus.mutateAsync({ id: po.id, status: 'approved' })}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Onayla
              </Button>
            </>
          )}
          {po.status === 'approved' && (
            <Button onClick={handleSendToVendor}>
              <FileText className="h-4 w-4 mr-2" />
              Tedarikçiye Gönder
            </Button>
          )}
          {(po.status === 'draft' || po.status === 'submitted') && (
            <Button 
              variant="destructive"
              onClick={() => updateStatus.mutateAsync({ id: po.id, status: 'cancelled' })}
            >
              İptal Et
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Kalemler</TabsTrigger>
          <TabsTrigger value="approvals">Onaylar</TabsTrigger>
          <TabsTrigger value="info">Bilgiler</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Sipariş Kalemleri</h3>
              {!isEditing && po.status === 'draft' && (
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  Düzenle
                </Button>
              )}
              {isEditing && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    İptal
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="h-4 w-4 mr-2" />
                    Kaydet
                  </Button>
                </div>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-right">KDV %</TableHead>
                  <TableHead className="text-right">İsk %</TableHead>
                  <TableHead className="text-right">Satır Toplamı</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 text-right"
                        />
                      ) : (
                        item.quantity
                      )}
                    </TableCell>
                    <TableCell>{item.uom}</TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-28 text-right"
                        />
                      ) : (
                        item.unit_price.toFixed(2)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.tax_rate}
                          onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                          className="w-16 text-right"
                        />
                      ) : (
                        item.tax_rate
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          value={item.discount_rate}
                          onChange={(e) => updateItem(index, 'discount_rate', parseFloat(e.target.value) || 0)}
                          className="w-16 text-right"
                        />
                      ) : (
                        item.discount_rate
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {calculateLineTotal(item).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-6 flex justify-end">
              <div className="space-y-2 text-right">
                <div className="text-lg font-semibold">
                  Genel Toplam: {formatCurrency(grandTotal, po.currency)}
                </div>
                {po.currency !== 'TL' && (
                  <div className="text-sm text-muted-foreground">
                    TL Karşılığı (Kur: {po.exchange_rate}): {formatCurrency(tryTotal)}
                  </div>
                )}
                {needsApproval && po.status === 'draft' && (
                  <div className="text-sm text-amber-600">
                    ⚠️ Onay gerekli (Eşik: {formatCurrency(approvalThreshold)})
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Onay Geçmişi</h3>
            {po.approvals && po.approvals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Adım</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Onaylayan</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Yorum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {po.approvals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>Seviye {approval.step}</TableCell>
                      <TableCell>
                        <Badge variant={approval.status === 'approved' ? 'default' : 'secondary'}>
                          {approval.status === 'approved' ? 'Onaylandı' : 'Bekliyor'}
                        </Badge>
                      </TableCell>
                      <TableCell>{approval.approver_id || '-'}</TableCell>
                      <TableCell>
                        {approval.decided_at 
                          ? format(new Date(approval.decided_at), 'dd.MM.yyyy HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>{approval.comment || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Henüz onay süreci başlatılmadı
              </p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold">Sipariş Bilgileri</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durum:</span>
                  <span>{getStatusBadge(po.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sipariş Tarihi:</span>
                  <span>{format(new Date(po.order_date), 'dd.MM.yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beklenen Teslimat:</span>
                  <span>
                    {po.expected_delivery_date 
                      ? format(new Date(po.expected_delivery_date), 'dd.MM.yyyy')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Para Birimi:</span>
                  <span>{po.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kur:</span>
                  <span>{po.exchange_rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Incoterm:</span>
                  <span>{po.incoterm || '-'}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-semibold">Tedarikçi Bilgileri</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Firma:</div>
                  <div className="font-medium">{po.supplier?.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Email:</div>
                  <div>{po.supplier?.email || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Telefon:</div>
                  <div>{po.supplier?.phone || '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Adres:</div>
                  <div>{po.supplier?.address || '-'}</div>
                </div>
              </div>
            </Card>
          </div>

          {po.notes && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Notlar</h3>
              <p className="text-sm whitespace-pre-wrap">{po.notes}</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
