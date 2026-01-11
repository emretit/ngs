import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Receipt, 
  Calendar, 
  DollarSign, 
  FileText, 
  Eye, 
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface SupplierInvoicesTabProps {
  supplierId: string;
  supplierName: string;
}

interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  currency: string;
  notes?: string;
}

interface SalesInvoice {
  id: string;
  fatura_no: string;
  fatura_tarihi: string;
  toplam_tutar: number;
  durum: string;
  para_birimi: string;
  aciklama?: string;
}

const SupplierInvoicesTab = ({ supplierId, supplierName }: SupplierInvoicesTabProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'purchase' | 'sales'>('purchase');

  // Alış faturalarını çek
  const { data: purchaseInvoices = [], isLoading: isLoadingPurchase } = useQuery({
    queryKey: ['supplier-purchase-invoices', supplierId],
    queryFn: async (): Promise<PurchaseInvoice[]> => {
      const { data, error } = await supabase
        .from('purchase_invoices')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching purchase invoices:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!supplierId,
  });

  // Satış faturalarını çek
  const { data: salesInvoices = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['supplier-sales-invoices', supplierId],
    queryFn: async (): Promise<SalesInvoice[]> => {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('customer_id', supplierId) // Tedarikçi aynı zamanda müşteri olabilir
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sales invoices:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!supplierId,
  });

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string } } = {
      'pending': { variant: 'secondary', label: 'Beklemede' },
      'paid': { variant: 'default', label: 'Ödendi' },
      'overdue': { variant: 'destructive', label: 'Gecikmiş' },
      'draft': { variant: 'outline', label: 'Taslak' },
      'sent': { variant: 'secondary', label: 'Gönderildi' },
      'cancelled': { variant: 'destructive', label: 'İptal' },
    };

    const config = statusMap[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleInvoiceClick = (invoiceId: string, type: 'purchase' | 'sales') => {
    if (type === 'purchase') {
      navigate(`/purchase-invoices/${invoiceId}`);
    } else {
      navigate(`/sales-invoices/${invoiceId}`);
    }
  };

  const EmptyState = ({ type }: { type: 'purchase' | 'sales' }) => (
    <Card className="p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <Receipt className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {type === 'purchase' ? 'Alış Faturası' : 'Satış Faturası'} Bulunamadı
        </h3>
        <p className="text-gray-600">
          {type === 'purchase' 
            ? 'Bu tedarikçiden alınan fatura bulunmuyor.'
            : 'Bu tedarikçiye satılan fatura bulunmuyor.'
          }
        </p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Faturalar</h3>
          <p className="text-sm text-gray-600">{supplierName} ile olan fatura işlemleri</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/purchase-invoices')}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Tüm Alış Faturaları
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/sales-invoices')}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Tüm Satış Faturaları
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'purchase' | 'sales')}>
        <TabsList className="inline-flex h-12 items-center justify-start rounded-lg bg-white/80 p-1 shadow-sm backdrop-blur-sm border border-gray-100 gap-1">
          <TabsTrigger value="purchase" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <Receipt className="h-4 w-4" />
            Alış Faturaları ({purchaseInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
            <Receipt className="h-4 w-4" />
            Satış Faturaları ({salesInvoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="space-y-4">
          {isLoadingPurchase ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Alış faturaları yükleniyor...</span>
              </div>
            </Card>
          ) : purchaseInvoices.length === 0 ? (
            <EmptyState type="purchase" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Alış Faturaları ({purchaseInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura No</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Para Birimi</TableHead>
                      <TableHead className="text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            {invoice.invoice_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(new Date(invoice.invoice_date), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            {invoice.total_amount.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{invoice.currency}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleInvoiceClick(invoice.id, 'purchase')}
                              className="h-8 w-8"
                              title="Detayları Görüntüle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {isLoadingSales ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Satış faturaları yükleniyor...</span>
              </div>
            </Card>
          ) : salesInvoices.length === 0 ? (
            <EmptyState type="sales" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Satış Faturaları ({salesInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura No</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Para Birimi</TableHead>
                      <TableHead className="text-center">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesInvoices.map((invoice) => (
                      <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-green-500" />
                            {invoice.fatura_no}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(new Date(invoice.fatura_tarihi), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            {invoice.toplam_tutar.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.durum)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{invoice.para_birimi}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleInvoiceClick(invoice.id, 'sales')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupplierInvoicesTab;
