import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Building, 
  Calendar, 
  DollarSign, 
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EInvoiceDetails, EInvoiceItem } from '@/types/einvoice';

interface InvoiceDetailsStepProps {
  invoiceId?: string;
  onNext: () => void;
}

export default function InvoiceDetailsStep({ invoiceId, onNext }: InvoiceDetailsStepProps) {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<EInvoiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceDetails();
    }
  }, [invoiceId]);

  const loadInvoiceDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading invoice details for:', invoiceId);

      // First get the invoice from incoming invoices
      const { data: invoicesData, error: invoicesError } = await supabase.functions.invoke('nilvera-incoming-invoices', {
        body: { 
          filters: {
            startDate: '2025-08-31T00:00:00.000Z',
            endDate: '2025-09-29T23:59:59.999Z'
          }
        }
      });

      if (invoicesError) throw invoicesError;
      
      const invoiceData = invoicesData?.invoices?.find((inv: any) => inv.id === invoiceId);
      if (!invoiceData) {
        throw new Error('Fatura bulunamadı');
      }

      // Then get detailed invoice items
      const { data: detailsData, error: detailsError } = await supabase.functions.invoke('nilvera-invoice-details', {
        body: {
          invoiceId: invoiceData.id,
          envelopeUUID: invoiceData.envelopeUUID
        }
      });

      if (detailsError) throw detailsError;
      if (!detailsData?.success) {
        throw new Error(detailsData?.error || 'Fatura detayları alınamadı');
      }

      const items: EInvoiceItem[] = detailsData.invoiceDetails?.items?.map((item: any, index: number) => ({
        id: `item-${index}`,
        line_number: index + 1,
        product_name: item.description || 'Açıklama yok',
        product_code: item.productCode,
        quantity: item.quantity || 1,
        unit: item.unit || 'Adet',
        unit_price: item.unitPrice || 0,
        tax_rate: item.taxRate || 18,
        discount_rate: item.discountRate || 0,
        line_total: item.totalAmount || 0,
        tax_amount: item.taxAmount || 0,
        gtip_code: item.gtipCode,
        description: item.description
      })) || [];

      const invoiceDetails: EInvoiceDetails = {
        id: invoiceData.id,
        invoice_number: invoiceData.invoiceNumber,
        supplier_name: invoiceData.supplierName,
        supplier_tax_number: invoiceData.supplierTaxNumber,
        invoice_date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate,
        currency: invoiceData.currency || 'TRY',
        subtotal: invoiceData.totalAmount - invoiceData.taxAmount,
        tax_total: invoiceData.taxAmount,
        total_amount: invoiceData.totalAmount,
        items
      };

      setInvoice(invoiceDetails);
      
      // Store invoice details for other steps
      sessionStorage.setItem(`einvoice_details_${invoiceId}`, JSON.stringify(invoiceDetails));

      console.log('✅ Invoice details loaded:', invoiceDetails);

    } catch (error: any) {
      console.error('❌ Error loading invoice details:', error);
      setError(error.message || 'Fatura detayları yüklenirken hata oluştu');
      toast({
        title: "Hata",
        description: error.message || "Fatura detayları yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Fatura detayları yükleniyor...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !invoice) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fatura Yüklenemedi</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadInvoiceDetails} variant="outline">
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Tedarikçi Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Firma Adı</label>
                <p className="text-sm font-semibold text-gray-900 mt-1">{invoice.supplier_name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vergi Numarası</label>
                <p className="text-sm font-mono text-gray-900 mt-1">{invoice.supplier_tax_number}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-green-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Fatura Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fatura No</label>
                <p className="text-sm font-mono text-gray-900 mt-1">{invoice.invoice_number}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tarih</label>
                <p className="text-sm text-gray-900 mt-1">
                  {format(new Date(invoice.invoice_date), 'dd MMMM yyyy', { locale: tr })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-orange-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Finansal Özet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Net Tutar</span>
                <span className="text-sm font-mono">{invoice.subtotal.toFixed(2)} {invoice.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">KDV</span>
                <span className="text-sm font-mono">{invoice.tax_total.toFixed(2)} {invoice.currency}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-semibold">TOPLAM</span>
                <span className="text-sm font-mono font-semibold text-blue-600">
                  {invoice.total_amount.toFixed(2)} {invoice.currency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items Table */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Fatura Kalemleri ({invoice.items.length} adet)
            </CardTitle>
            <Badge variant="secondary">
              Gelen Fatura Sütunları
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-48">Ürün/Hizmet Adı</TableHead>
                  <TableHead className="w-32">Ürün Kodu</TableHead>
                  <TableHead className="w-20 text-right">Miktar</TableHead>
                  <TableHead className="w-20">Birim</TableHead>
                  <TableHead className="w-24 text-right">Birim Fiyat</TableHead>
                  <TableHead className="w-20 text-right">KDV %</TableHead>
                  <TableHead className="w-24 text-right">Tutar</TableHead>
                  <TableHead className="w-32">GTIP Kodu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-center">
                      {item.line_number}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-48">
                        <p className="font-medium text-gray-900 truncate">{item.product_name}</p>
                        {item.description && item.description !== item.product_name && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {item.product_code || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.quantity.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {item.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        %{item.tax_rate}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {item.line_total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-gray-600">
                        {item.gtip_code || '-'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={onNext} className="flex items-center gap-2">
          Ürün Eşleştirmeye Geç
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}