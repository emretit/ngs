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
import { ArrowLeft, FileText } from "lucide-react";
import { useRFQ, useSelectQuote, useUpdateRFQStatus } from "@/hooks/useRFQs";
import { format } from "date-fns";

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
  const selectQuote = useSelectQuote();
  const updateStatus = useUpdateRFQStatus();

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!rfq) {
    return <div className="container mx-auto p-6">RFQ bulunamadı</div>;
  }

  const handleSelectQuote = async (quoteId: string) => {
    try {
      await selectQuote.mutateAsync({ rfqId: rfq.id, quoteId });
    } catch (error) {
      console.error('Error selecting quote:', error);
    }
  };

  const handleCreatePO = () => {
    const selectedQuote = rfq.quotes?.find(q => q.is_selected);
    if (selectedQuote) {
      navigate(`/purchasing/orders/new?rfq_id=${rfq.id}&vendor_id=${selectedQuote.vendor_id}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/purchasing/rfqs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">RFQ Detayı</h1>
          <p className="text-muted-foreground">{rfq.rfq_number}</p>
        </div>
        <div className="flex gap-2">
          {rfq.status === 'draft' && (
            <Button onClick={() => updateStatus.mutateAsync({ id: rfq.id, status: 'sent' })}>
              Gönder
            </Button>
          )}
          {rfq.quotes?.some(q => q.is_selected) && (
            <Button onClick={handleCreatePO}>
              Sipariş Oluştur
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">RFQ Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durum:</span>
              <span>{getStatusBadge(rfq.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Son Teklif Tarihi:</span>
              <span>{rfq.due_date ? format(new Date(rfq.due_date), 'dd.MM.yyyy') : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Incoterm:</span>
              <span>{rfq.incoterm || '-'}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Notlar</h3>
          <p className="text-sm">{rfq.notes || 'Not yok'}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Talep Edilen Ürünler</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Açıklama</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Birim</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfq.lines?.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.description}</TableCell>
                <TableCell>{line.quantity}</TableCell>
                <TableCell>{line.uom}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Tedarikçi Teklifleri</h3>
        {rfq.quotes?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Henüz teklif alınmadı</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rfq.quotes?.map((quote) => (
              <Card key={quote.id} className={`p-4 ${quote.is_selected ? 'border-primary' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">{quote.vendor?.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Geçerlilik: {quote.valid_until ? format(new Date(quote.valid_until), 'dd.MM.yyyy') : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {quote.is_selected && <Badge>Seçildi</Badge>}
                    {!quote.is_selected && rfq.status !== 'closed' && (
                      <Button
                        size="sm"
                        onClick={() => handleSelectQuote(quote.id)}
                        disabled={selectQuote.isPending}
                      >
                        Seç
                      </Button>
                    )}
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-right">Birim Fiyat</TableHead>
                      <TableHead className="text-right">KDV %</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quote.lines?.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.rfq_line?.description}</TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: quote.currency,
                          }).format(line.unit_price)}
                        </TableCell>
                        <TableCell className="text-right">{line.tax_rate}%</TableCell>
                        <TableCell className="text-right font-medium">
                          {new Intl.NumberFormat('tr-TR', {
                            style: 'currency',
                            currency: quote.currency,
                          }).format(line.line_total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 flex justify-between text-sm">
                  <span>Teslimat Süresi: {quote.delivery_days || '-'} gün</span>
                  <span className="font-semibold">
                    Toplam: {new Intl.NumberFormat('tr-TR', {
                      style: 'currency',
                      currency: quote.currency,
                    }).format(quote.grand_total)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
