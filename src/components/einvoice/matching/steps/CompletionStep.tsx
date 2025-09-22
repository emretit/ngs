import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  FileText, 
  Package, 
  DollarSign, 
  Eye,
  ArrowRight,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { EInvoiceDetails } from '@/types/einvoice';

interface CompletionStepProps {
  invoiceId?: string;
  onFinish: () => void;
}

export default function CompletionStep({ invoiceId, onFinish }: CompletionStepProps) {
  const [invoice, setInvoice] = useState<EInvoiceDetails | null>(null);
  const [purchaseInvoice, setPurchaseInvoice] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    loadCompletionData();
  }, [invoiceId]);

  const loadCompletionData = () => {
    try {
      // Load original invoice
      const invoiceData = sessionStorage.getItem(`einvoice_details_${invoiceId}`);
      if (invoiceData) {
        setInvoice(JSON.parse(invoiceData));
      }

      // Load created purchase invoice
      const purchaseData = sessionStorage.getItem(`purchase_invoice_${invoiceId}`);
      if (purchaseData) {
        setPurchaseInvoice(JSON.parse(purchaseData));
      }

      // Load matching results for summary
      const matchingData = sessionStorage.getItem(`product_matching_${invoiceId}`);
      if (matchingData) {
        const matchingItems = JSON.parse(matchingData);
        const processedItems = matchingItems.filter(item => item.match_type !== 'unmatched').length;
        const newProducts = matchingItems.filter(item => item.match_type === 'new_product').length;
        
        setSummary({
          total_items: matchingItems.length,
          processed_items: processedItems,
          new_products: newProducts
        });
      }

    } catch (error) {
      console.error('Error loading completion data:', error);
    }
  };

  const handleFinish = () => {
    // Clean up session storage
    if (invoiceId) {
      sessionStorage.removeItem(`einvoice_details_${invoiceId}`);
      sessionStorage.removeItem(`product_matching_${invoiceId}`);
      sessionStorage.removeItem(`matching_saved_${invoiceId}`);
      sessionStorage.removeItem(`purchase_invoice_${invoiceId}`);
    }
    onFinish();
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            İşlem Başarıyla Tamamlandı!
          </h2>
          <p className="text-green-700">
            E-fatura başarıyla işlendi ve alış faturası oluşturuldu.
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Orijinal E-Fatura
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {invoice && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fatura No</label>
                  <p className="text-sm font-mono text-gray-900 mt-1">{invoice.invoice_number}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tedarikçi</label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{invoice.supplier_name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tarih</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {format(new Date(invoice.invoice_date), 'dd MMMM yyyy', { locale: tr })}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tutar</label>
                  <p className="text-sm font-mono font-semibold text-blue-600 mt-1">
                    {invoice.total_amount.toFixed(2)} {invoice.currency}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-green-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              Ürün Eşleştirme
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {summary && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Toplam Kalem</span>
                  <span className="text-sm font-semibold">{summary.total_items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">İşlenen Kalem</span>
                  <span className="text-sm font-semibold text-green-600">{summary.processed_items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Yeni Ürün</span>
                  <span className="text-sm font-semibold text-orange-600">{summary.new_products}</span>
                </div>
                <div className="pt-2 border-t">
                  <Badge variant="secondary" className="w-full justify-center bg-green-100 text-green-800">
                    %{Math.round((summary.processed_items / summary.total_items) * 100)} Başarı
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-orange-50 border-b">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Oluşturulan Alış Faturası
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {purchaseInvoice && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fatura ID</label>
                  <p className="text-sm font-mono text-gray-900 mt-1">#{purchaseInvoice.id.slice(-8)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Durum</label>
                  <Badge variant="secondary" className="mt-1 bg-yellow-100 text-yellow-800">
                    {purchaseInvoice.status === 'pending' ? 'Beklemede' : purchaseInvoice.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Toplam Tutar</label>
                  <p className="text-sm font-mono font-semibold text-orange-600 mt-1">
                    {purchaseInvoice.total_amount.toFixed(2)} {purchaseInvoice.currency}
                  </p>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Faturayı Görüntüle
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Process Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            İşlem Özeti
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Tamamlanan İşlemler</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">E-fatura detayları analiz edildi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Ürünler sistemdeki ürünlerle eşleştirildi</span>
                </div>
                {summary && summary.new_products > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{summary.new_products} yeni ürün oluşturuldu</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Alış faturası başarıyla oluşturuldu</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Eşleştirme sonuçları kaydedildi</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Sonraki Adımlar</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Oluşturulan alış faturasını inceleyin ve onaylayın</p>
                <p>• Ödeme planını belirleyin</p>
                <p>• Stok hareketlerini kontrol edin</p>
                <p>• Muhasebe entegrasyonunu yapın</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="h-4 w-4 mr-2" />
          Raporu İndir
        </Button>
        <Button onClick={handleFinish} className="flex items-center gap-2">
          E-faturalar Listesine Dön
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}