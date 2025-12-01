import { useState } from "react";
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
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  FileCheck, 
  DollarSign,
  Download,
  AlertTriangle
} from "lucide-react";
import { 
  useVendorInvoice, 
  useUpdateVendorInvoiceStatus,
  useThreeWayMatch
} from "@/hooks/useVendorInvoices";
import ThreeWayMatchWidget from "@/components/purchasing/ThreeWayMatchWidget";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";

const getStatusBadge = (status: string) => {
  const variants = {
    draft: { label: "Taslak", variant: "secondary" as const },
    matched: { label: "Eşleşti", variant: "default" as const },
    approved: { label: "Onaylandı", variant: "default" as const },
    posted: { label: "Muhasebeleşti", variant: "default" as const },
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
  const { data: matchData } = useThreeWayMatch(id!);
  const updateStatus = useUpdateVendorInvoiceStatus();

  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return <div className="container mx-auto p-6">Yükleniyor...</div>;
  }

  if (!invoice) {
    return <div className="container mx-auto p-6">Fatura bulunamadı</div>;
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: newStatus });
      
      if (newStatus === 'posted') {
        toast({
          title: "Başarılı",
          description: "Fatura muhasebeleşti. AP borcu oluşturuldu.",
        });
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const handleEInvoiceImport = () => {
    toast({
      title: "Yakında",
      description: "E-Fatura import özelliği yakında eklenecek.",
    });
  };

  const canApprove = invoice.status === 'matched';
  const canPost = invoice.status === 'approved';
  const canPay = invoice.status === 'posted';

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
          {invoice.status === 'draft' && (
            <Button 
              variant="outline"
              onClick={() => handleStatusChange('matched')}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Eşleştir
            </Button>
          )}
          {canApprove && (
            <Button 
              onClick={() => handleStatusChange('approved')}
              disabled={updateStatus.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Onayla
            </Button>
          )}
          {canPost && (
            <Button 
              onClick={() => handleStatusChange('posted')}
              disabled={updateStatus.isPending}
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Muhasebeleştir
            </Button>
          )}
          {canPay && (
            <Button 
              onClick={() => handleStatusChange('paid')}
              disabled={updateStatus.isPending}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Ödeme Yap
            </Button>
          )}
          {invoice.status === 'draft' && (
            <Button 
              variant="destructive"
              onClick={() => handleStatusChange('void')}
              disabled={updateStatus.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              İptal Et
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vade Tarihi:</span>
                  <span>{invoice.due_date ? format(new Date(invoice.due_date), 'dd.MM.yyyy') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Para Birimi:</span>
                  <span>{invoice.currency} (Kur: {invoice.exchange_rate})</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-semibold">Bağlantılar</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO No:</span>
                  <span className="font-medium">{invoice.po?.order_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GRN No:</span>
                  <span className="font-medium">{invoice.grn?.grn_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-Fatura UUID:</span>
                  <span className="text-xs">{invoice.e_invoice_uuid || '-'}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleEInvoiceImport}
              >
                <Download className="h-4 w-4 mr-2" />
                E-Fatura Import (TODO)
              </Button>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Fatura Kalemleri</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead className="text-right">KDV %</TableHead>
                  <TableHead className="text-right">İskonto %</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lines?.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="font-medium">{line.description}</TableCell>
                    <TableCell className="text-right">
                      {line.quantity} {line.uom}
                    </TableCell>
                    <TableCell className="text-right">
                      {line.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">{line.tax_rate}%</TableCell>
                    <TableCell className="text-right">{line.discount_rate}%</TableCell>
                    <TableCell className="text-right font-medium">
                      {line.line_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ara Toplam:</span>
                  <span>{invoice.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KDV:</span>
                  <span>{invoice.tax_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Genel Toplam:</span>
                  <span>{invoice.grand_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
                {invoice.currency !== 'TRY' && invoice.currency !== 'TL' && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>TRY Karşılığı:</span>
                    <span>{formatCurrency(invoice.grand_total * invoice.exchange_rate)}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {invoice.notes && (
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Notlar</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {invoice.po_id && matchData && (
            <ThreeWayMatchWidget data={matchData} />
          )}

          {invoice.status === 'posted' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Ödeme Bilgisi</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Toplam Tutar:</span>
                  <span className="font-medium">
                    {invoice.grand_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ödenen:</span>
                  <span>
                    {invoice.paid_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Kalan:</span>
                  <span className="font-bold text-lg">
                    {(invoice.grand_total - invoice.paid_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Fatura muhasebeleştirildi. AP borcu ve ödeme planı oluşturuldu.
                  </span>
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
