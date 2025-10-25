import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, FileText, Receipt } from "lucide-react";
import { useCompanyFinancials } from "@/hooks/useCompanyFinancials";
import { format } from "date-fns";

const CompanyFinancials = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { summary, salesInvoices, purchaseInvoices, isLoading } = useCompanyFinancials(id || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/admin/companies')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <p className="text-muted-foreground">Şirket finansal bilgileri bulunamadı.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      odendi: { label: "Ödendi", variant: "default" },
      paid: { label: "Ödendi", variant: "default" },
      kismi_odendi: { label: "Kısmi Ödendi", variant: "secondary" },
      partially_paid: { label: "Kısmi Ödendi", variant: "secondary" },
      odenmedi: { label: "Ödenmedi", variant: "destructive" },
      pending: { label: "Bekliyor", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/admin/companies')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Şirketler
          </Button>
          <h1 className="text-3xl font-bold">{summary.companyName}</h1>
          <p className="text-muted-foreground">Finansal Özet</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alacaklar</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.receivables)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalSalesInvoices} satış faturası
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borçlar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.payables)}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalPurchaseInvoices} alış faturası
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Durum</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.netBalance >= 0 ? 'Pozitif bakiye' : 'Negatif bakiye'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
            <Receipt className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalSalesAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Tahsil edilen: {formatCurrency(summary.paidSalesAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Satış Faturaları ({salesInvoices?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura No</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="text-right">Ödenen</TableHead>
                <TableHead className="text-right">Kalan</TableHead>
                <TableHead>Para Birimi</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesInvoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Henüz satış faturası bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                salesInvoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customer_name || '-'}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy')}</TableCell>
                    <TableCell className="text-right">
                      {invoice.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.paid_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {invoice.remaining_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{invoice.currency}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Purchase Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Alış Faturaları ({purchaseInvoices?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura No</TableHead>
                <TableHead>Tedarikçi</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="text-right">Ödenen</TableHead>
                <TableHead className="text-right">Kalan</TableHead>
                <TableHead>Para Birimi</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseInvoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Henüz alış faturası bulunmuyor
                  </TableCell>
                </TableRow>
              ) : (
                purchaseInvoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.supplier_name || '-'}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy')}</TableCell>
                    <TableCell className="text-right">
                      {invoice.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.paid_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {invoice.remaining_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{invoice.currency}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyFinancials;
