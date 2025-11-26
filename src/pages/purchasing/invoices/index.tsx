import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, FileText } from "lucide-react";
import { useVendorInvoices } from "@/hooks/useVendorInvoices";
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

const getMatchBadge = (status: string) => {
  const variants = {
    unmatched: { label: "Eşleşmemiş", variant: "secondary" as const },
    matched: { label: "Eşleşti", variant: "default" as const },
    discrepancy: { label: "Fark Var", variant: "destructive" as const },
    over_billed: { label: "Fazla Fatura", variant: "destructive" as const },
  };
  const config = variants[status as keyof typeof variants] || variants.unmatched;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function VendorInvoicesList() {
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useVendorInvoices();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInvoices = invoices?.filter(
    (invoice) =>
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tedarikçi Faturaları</h1>
          <p className="text-muted-foreground">Gelen faturaları yönetin</p>
        </div>
        <Button onClick={() => navigate("/purchasing/invoices/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Fatura
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Fatura no veya tedarikçi ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura No</TableHead>
              <TableHead>Tedarikçi</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Ara Toplam</TableHead>
              <TableHead className="text-right">KDV</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Para Birimi</TableHead>
              <TableHead>Bağlı PO</TableHead>
              <TableHead>Güncelleme</TableHead>
              <TableHead className="w-[100px] text-center">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Henüz fatura bulunmuyor</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices?.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/purchasing/invoices/${invoice.id}`)}
                >
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.vendor?.name}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy')}</TableCell>
                  <TableCell className="text-right">
                    {invoice.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.tax_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {invoice.grand_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{invoice.currency}</TableCell>
                  <TableCell>{invoice.po?.order_number || '-'}</TableCell>
                  <TableCell>{format(new Date(invoice.updated_at), 'dd.MM.yyyy')}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/purchasing/invoices/${invoice.id}`);
                        }}
                      >
                        Detay
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
