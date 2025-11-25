import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/dateUtils";

interface ProductInvoicesTabProps {
  productId: string;
}

export const ProductInvoicesTab = ({ productId }: ProductInvoicesTabProps) => {
  const navigate = useNavigate();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['product-invoices', productId],
    queryFn: async () => {
      const { data: invoiceItems, error } = await supabase
        .from('sales_invoice_items')
        .select(`
          id,
          sales_invoice_id,
          miktar,
          birim_fiyat,
          satir_toplami,
          kdv_orani,
          indirim_orani,
          para_birimi,
          created_at,
          sales_invoices (
            id,
            invoice_number,
            customer_id,
            status,
            invoice_date,
            total_amount,
            customers (
              id,
              name,
              company
            )
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return invoiceItems || [];
    },
  });

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Faturalar yükleniyor...</p>
        </div>
      </Card>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Receipt className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Fatura Bulunamadı</h3>
          <p className="text-gray-600">Bu ürün henüz hiçbir faturada kullanılmamış.</p>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Taslak", variant: "outline" },
      pending: { label: "Beklemede", variant: "secondary" },
      sent: { label: "Gönderildi", variant: "default" },
      paid: { label: "Ödendi", variant: "secondary" },
      overdue: { label: "Vadesi Geçti", variant: "destructive" },
      cancelled: { label: "İptal Edildi", variant: "destructive" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Faturalar ({invoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fatura No</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead className="text-right">Miktar</TableHead>
              <TableHead className="text-right">Birim Fiyat</TableHead>
              <TableHead className="text-right">Toplam</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-center">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((item: any) => {
              const invoice = item.sales_invoices;
              const customer = invoice?.customers;
              return (
                <TableRow key={item.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {invoice?.invoice_number || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {customer?.company || customer?.name || 'Müşteri Bilgisi Yok'}
                  </TableCell>
                  <TableCell className="text-right">{item.miktar}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.birim_fiyat, item.para_birimi || 'TRY')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.satir_toplami, item.para_birimi || 'TRY')}
                  </TableCell>
                  <TableCell>
                    {invoice?.status ? getStatusBadge(invoice.status) : '-'}
                  </TableCell>
                  <TableCell>
                    {invoice?.invoice_date ? formatDate(invoice.invoice_date) : formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/sales-invoices/${invoice?.id}`);
                        }}
                        className="text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

