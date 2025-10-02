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
import { ArrowLeft, Check } from "lucide-react";
import { useVendorInvoice, useUpdateInvoiceStatus, useThreeWayMatch, usePerformMatch } from "@/hooks/useVendorInvoices";
import { format } from "date-fns";

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: "Taslak", variant: "secondary" as const },
    matched: { label: "Eşleştirildi", variant: "default" as const },
    approved: { label: "Onaylandı", variant: "default" as const },
    posted: { label: "Kaydedildi", variant: "default" as const },
    paid: { label: "Ödendi", variant: "default" as const },
    void: { label: "İptal", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getLineMatchBadge = (status: string) => {
  const variants = {
    matched: { label: "Eşleşti", variant: "default" as const },
    qty_mismatch: { label: "Miktar Farkı", variant: "destructive" as const },
    price_mismatch: { label: "Fiyat Farkı", variant: "destructive" as const },
    unmatched: { label: "Eşleşmemiş", variant: "secondary" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.unmatched;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function VendorInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: invoice, isLoading } = useVendorInvoice(id!);
  const updateStatus = useUpdateInvoiceStatus();
  const { data: matchData } = useThreeWayMatch(invoice?.po_id);
  const performMatch = usePerformMatch();

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!invoice) {
    return <div className="container mx-auto p-6">Fatura bulunamadı</div>;
  }

  const handleMatch = async () => {
    if (!invoice.po_id) return;
    try {
      await performMatch.mutateAsync(invoice.id);
    } catch (error) {
      console.error('Error matching invoice:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: 'approved' });
    } catch (error) {
      console.error('Error approving invoice:', error);
    }
  };

  const handlePost = async () => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: 'posted' });
    } catch (error) {
      console.error('Error posting invoice:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/purchasing/invoices")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Fatura Detayı</h1>
          <p className="text-muted-foreground">{invoice.invoice_number}</p>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && invoice.po_id && (
            <Button onClick={handleMatch} disabled={performMatch.isPending}>
              <Check className="h-4 w-4 mr-2" />
              3-Way Match
            </Button>
          )}
          {invoice.status === 'matched' && (
            <Button onClick={handleApprove} disabled={updateStatus.isPending}>
              <Check className="h-4 w-4 mr-2" />
              Onayla
            </Button>
          )}
          {invoice.status === 'approved' && (
            <Button onClick={handlePost} disabled={updateStatus.isPending}>
              Kaydet
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Fatura Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durum:</span>
              <span>{getStatusBadge(invoice.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tedarikçi:</span>
              <span className="font-medium">{invoice.vendor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fatura Tarihi:</span>
              <span>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy')}</span>
            </div>
            {invoice.due_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vade Tarihi:</span>
                <span>{format(new Date(invoice.due_date), 'dd.MM.yyyy')}</span>
              </div>
            )}
            {invoice.po && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">İlgili PO:</span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => navigate(`/purchasing/orders/${invoice.po_id}`)}
                >
                  {invoice.po.order_number}
                </Button>
              </div>
            )}
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
                  currency: invoice.currency,
                }).format(invoice.subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KDV:</span>
              <span>
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: invoice.currency,
                }).format(invoice.tax_total)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t font-semibold">
              <span>Toplam:</span>
              <span>
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: invoice.currency,
                }).format(invoice.grand_total)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ödenen:</span>
              <span>
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: invoice.currency,
                }).format(invoice.paid_amount)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {invoice.notes && (
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Notlar</h3>
          <p className="text-sm">{invoice.notes}</p>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Fatura Kalemleri</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Açıklama</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Birim</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">KDV %</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead>Eşleşme</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.lines?.map((line) => (
              <TableRow key={line.id}>
                <TableCell>{line.description}</TableCell>
                <TableCell>{line.quantity}</TableCell>
                <TableCell>{line.uom}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(line.unit_price)}
                </TableCell>
                <TableCell className="text-right">{line.tax_rate}%</TableCell>
                <TableCell className="text-right font-medium">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(line.line_total)}
                </TableCell>
                <TableCell>{getLineMatchBadge(line.match_status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {matchData && matchData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">3-Way Match Raporu</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead className="text-right">Sipariş</TableHead>
                <TableHead className="text-right">Teslim</TableHead>
                <TableHead className="text-right">Fatura</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchData.map((match, index) => (
                <TableRow key={index}>
                  <TableCell>{match.description}</TableCell>
                  <TableCell className="text-right">{match.ordered_qty}</TableCell>
                  <TableCell className="text-right">{match.received_qty}</TableCell>
                  <TableCell className="text-right">{match.invoiced_qty}</TableCell>
                  <TableCell>
                    <Badge variant={match.match_status === 'matched' ? 'default' : 'destructive'}>
                      {match.match_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
