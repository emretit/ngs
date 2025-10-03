import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
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
import { ArrowLeft, Award, Send, CheckCircle } from "lucide-react";
import { useRFQ, useSelectQuote, useUpdateRFQStatus, useInviteVendors } from "@/hooks/useRFQs";
import { useVendors } from "@/hooks/useVendors";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: "Taslak", variant: "secondary" as const },
    sent: { label: "Gönderildi", variant: "default" as const },
    received: { label: "Teklif Alındı", variant: "default" as const },
    closed: { label: "Kapatıldı", variant: "default" as const },
    cancelled: { label: "İptal", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function RFQDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: rfq, isLoading } = useRFQ(id!);
  const { data: vendors } = useVendors({ is_active: true });
  const selectQuote = useSelectQuote();
  const updateStatus = useUpdateRFQStatus();
  const inviteVendors = useInviteVendors();
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!rfq) {
    return <div className="container mx-auto p-6">RFQ bulunamadı</div>;
  }

  const invitedVendorIds = new Set(rfq.vendors?.map(v => v.vendor_id) || []);
  const availableVendors = vendors?.filter(v => !invitedVendorIds.has(v.id)) || [];

  const handleSelectQuote = async (quoteId: string) => {
    await selectQuote.mutateAsync({ rfqId: rfq.id, quoteId });
  };

  const handleInviteVendors = async () => {
    if (selectedVendorIds.length > 0) {
      await inviteVendors.mutateAsync({ rfqId: rfq.id, vendorIds: selectedVendorIds });
      setShowInviteDialog(false);
      setSelectedVendorIds([]);
    }
  };

  const handleCreatePO = () => {
    const selectedQuote = rfq.quotes?.find(q => q.is_selected);
    if (selectedQuote) {
      navigate(`/purchase-orders/new?rfq_id=${rfq.id}&vendor_id=${selectedQuote.vendor_id}`);
    }
  };

  const calculateScore = (quote: any) => {
    const priceScore = quote.grand_total > 0 ? (1 / quote.grand_total) * 0.6 : 0;
    const deliveryScore = quote.delivery_days > 0 ? (1 / quote.delivery_days) * 0.25 : 0;
    const otherScore = (quote.vendor?.rating || 0) * 0.15;
    return ((priceScore + deliveryScore + otherScore) * 100).toFixed(1);
  };

  const hasCompleteQuote = rfq.quotes && rfq.quotes.length > 0;
  const selectedQuote = rfq.quotes?.find(q => q.is_selected);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/purchase-rfqs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">RFQ Karşılaştırma</h1>
          <p className="text-muted-foreground">{rfq.rfq_number}</p>
        </div>
        <div className="flex gap-2">
          {rfq.status === 'draft' && (
            <>
              <Button variant="outline" onClick={() => setShowInviteDialog(true)}>
                Tedarikçi Davet Et
              </Button>
              <Button onClick={() => updateStatus.mutateAsync({ id: rfq.id, status: 'sent' })}>
                <Send className="h-4 w-4 mr-2" />
                Gönder
              </Button>
            </>
          )}
          {rfq.status === 'sent' && (
            <Button onClick={() => updateStatus.mutateAsync({ id: rfq.id, status: 'received' })}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Teklif Alındı
            </Button>
          )}
          {selectedQuote && hasCompleteQuote && (
            <Button onClick={handleCreatePO}>
              <Award className="h-4 w-4 mr-2" />
              Sipariş Oluştur
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durum:</span>
              <span>{getStatusBadge(rfq.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Son Teklif:</span>
              <span>{rfq.due_date ? format(new Date(rfq.due_date), 'dd.MM.yyyy') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Incoterm:</span>
              <span>{rfq.incoterm || '-'}</span>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Davet Edilen:</span>
              <span>{invitedVendorIds.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teklif Sayısı:</span>
              <span>{rfq.quotes?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Para Birimi:</span>
              <span>{rfq.currency}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-5 gap-6">
        <Card className="col-span-2 p-4">
          <h3 className="font-semibold mb-3">RFQ Kalemleri</h3>
          <div className="space-y-2">
            {rfq.lines?.map((line, idx) => (
              <div key={line.id} className="p-3 border rounded text-sm">
                <div className="font-medium">{line.description}</div>
                <div className="text-muted-foreground">
                  {line.quantity} {line.uom}
                  {line.target_price && ` • Hedef: ${line.target_price.toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-3 p-4">
          <h3 className="font-semibold mb-3">Tedarikçi Teklifleri (Matris)</h3>
          
          {!hasCompleteQuote ? (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Henüz teklif alınmadı</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 bg-background">Kalem</TableHead>
                    {rfq.quotes?.map((quote) => (
                      <TableHead key={quote.id} className="sticky top-0 bg-background text-center min-w-[180px]">
                        <div className="font-medium">{quote.vendor?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Skor: {calculateScore(quote)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfq.lines?.map((line) => {
                    const quoteLinesForItem = rfq.quotes?.map(quote => 
                      quote.lines?.find(ql => ql.rfq_line_id === line.id)
                    );
                    
                    return (
                      <TableRow key={line.id}>
                        <TableCell className="font-medium">
                          <div>{line.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {line.quantity} {line.uom}
                          </div>
                        </TableCell>
                        {quoteLinesForItem?.map((quoteLine, idx) => {
                          const quote = rfq.quotes?.[idx];
                          return (
                            <TableCell key={idx} className="text-center">
                              {quoteLine ? (
                                <div className="space-y-1 text-xs">
                                  <div className="font-semibold text-sm">
                                    {new Intl.NumberFormat('tr-TR', {
                                      style: 'currency',
                                      currency: quote?.currency || 'TRY',
                                    }).format(quoteLine.unit_price)}
                                  </div>
                                  <div className="text-muted-foreground">
                                    KDV: {quoteLine.tax_rate}%
                                  </div>
                                  {quoteLine.delivery_days && (
                                    <div className="text-muted-foreground">
                                      Teslimat: {quoteLine.delivery_days}g
                                    </div>
                                  )}
                                  <div className="font-medium">
                                    Toplam: {new Intl.NumberFormat('tr-TR', {
                                      style: 'currency',
                                      currency: quote?.currency || 'TRY',
                                    }).format(quoteLine.line_total)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-semibold">GENEL TOPLAM</TableCell>
                    {rfq.quotes?.map((quote) => (
                      <TableCell key={quote.id} className="text-center">
                        <div className="space-y-1">
                          <div className="font-bold text-lg">
                            {new Intl.NumberFormat('tr-TR', {
                              style: 'currency',
                              currency: quote.currency,
                            }).format(quote.grand_total)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {quote.delivery_days}g teslimat
                          </div>
                          {!quote.is_selected && rfq.status !== 'closed' && (
                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={() => handleSelectQuote(quote.id)}
                              disabled={selectQuote.isPending}
                            >
                              <Award className="h-3 w-3 mr-1" />
                              Seç
                            </Button>
                          )}
                          {quote.is_selected && (
                            <Badge className="mt-2">Kazanan</Badge>
                          )}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </Card>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tedarikçi Davet Et</DialogTitle>
            <DialogDescription>
              RFQ'ya eklemek istediğiniz tedarikçileri seçin
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {availableVendors.map((vendor) => (
                <div key={vendor.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    id={`invite-${vendor.id}`}
                    checked={selectedVendorIds.includes(vendor.id)}
                    onCheckedChange={(checked) => {
                      setSelectedVendorIds(prev =>
                        checked
                          ? [...prev, vendor.id]
                          : prev.filter(id => id !== vendor.id)
                      );
                    }}
                  />
                  <label
                    htmlFor={`invite-${vendor.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {vendor.name} ({vendor.city || vendor.country})
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              İptal
            </Button>
            <Button
              onClick={handleInviteVendors}
              disabled={selectedVendorIds.length === 0 || inviteVendors.isPending}
            >
              Davet Et ({selectedVendorIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
