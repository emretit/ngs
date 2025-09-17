import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductSelector from '@/components/proposals/form/ProductSelector';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Building,
  Calendar,
  DollarSign,
  FileText,
  X,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';
import DefaultLayout from '@/components/layouts/DefaultLayout';

interface InvoiceItem {
  id: string;
  lineNumber: number;
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice?: number;
  totalAmount?: number;
  matchedProduct?: {
    id: string;
    name: string;
    sku?: string;
  };
}


const EInvoiceProcess = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceData();
      loadProducts();
    }
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading invoice with ID:', invoiceId);

      // Use the same date range as the list page
      const startDate = '2025-08-31T00:00:00.000Z';
      const endDate = '2025-09-29T23:59:59.999Z';
      
      const { data, error } = await supabase.functions.invoke('nilvera-incoming-invoices', {
        body: { 
          filters: {
            startDate,
            endDate
          }
        }
      });

      console.log('📡 Nilvera function response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Fatura detayları alınamadı');
      }

      if (!data) {
        console.error('❌ No data received from function');
        throw new Error('Function response is empty');
      }

      if (!data.success) {
        console.error('❌ Function returned error:', data?.error);
        throw new Error(data?.error || 'Fatura bulunamadı');
      }

      // Find the specific invoice by ID
      console.log('🔍 Searching for invoice ID:', invoiceId);
      console.log('📋 Available invoices:', data.invoices?.map((inv: any) => ({ id: inv.id, number: inv.invoiceNumber })));
      
      const invoiceData = data.invoices?.find((inv: any) => inv.id === invoiceId);
      
      if (!invoiceData) {
        console.error('❌ Invoice not found with ID:', invoiceId);
        console.error('❌ Available IDs:', data.invoices?.map((inv: any) => inv.id));
        throw new Error('Fatura bulunamadı');
      }

      console.log('✅ Found invoice:', invoiceData);
      setInvoice(invoiceData);

      // Then get detailed invoice items
      console.log('🔄 Loading invoice details for:', invoiceData.id);

      const { data: detailsData, error: detailsError } = await supabase.functions.invoke('nilvera-invoice-details', {
        body: {
          invoiceId: invoiceData.id,
          envelopeUUID: invoiceData.envelopeUUID
        }
      });

      console.log('📡 Invoice details response:', { detailsData, detailsError });

      if (detailsError) {
        console.error('❌ Supabase function error:', detailsError);
        throw new Error(detailsError.message || 'Fatura detayları alınamadı');
      }

      if (!detailsData) {
        console.error('❌ No data received from function');
        throw new Error('Function response is empty');
      }

      if (!detailsData.success) {
        console.error('❌ Function returned error:', detailsData?.error);
        throw new Error(detailsData?.error || 'Fatura detayları alınamadı');
      }

      if (detailsData.invoiceDetails?.items) {
        const items: InvoiceItem[] = detailsData.invoiceDetails.items.map((item: any, index: number) => ({
          id: `xml-line-${index}`,
          lineNumber: index + 1,
          description: item.description || 'Açıklama yok',
          productCode: item.productCode,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalAmount: item.totalAmount || 0,
        }));

        console.log('✅ Parsed invoice items:', items.length);
        console.log('📄 First item:', items[0]);
        setInvoiceItems(items);
      } else {
        console.warn('⚠️ No items found in invoice details');
        setInvoiceItems([]);
      }

    } catch (error: any) {
      console.error('❌ Error loading invoice details:', error);
      toast({
        title: "Hata",
        description: error.message || "Fatura yüklenirken bir hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, barcode, description')
        .eq('is_active', true)
        .order('name');

      if (data && !error) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleProductMatch = (itemId: string, productName: string, product?: Product) => {
    if (!product) return;

    setInvoiceItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            matchedProduct: {
              id: product.id,
              name: product.name,
              sku: product.sku
            }
          }
        : item
    ));
  };

  const handleCreateNewProduct = async (item: InvoiceItem) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: item.description,
          sku: item.productCode || null,
          description: `E-fatura'dan oluşturuldu: ${invoice.invoiceNumber}`,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      // Match the item to the new product
      handleProductMatch(item.id, data.name, data as Product);
      
      // Reload products
      loadProducts();

      toast({
        title: "Başarılı",
        description: "Yeni ürün oluşturuldu ve eşleştirildi"
      });
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Ürün oluşturulurken hata oluştu",
        variant: "destructive"
      });
    }
  };

  const handleSaveAndSendAnswer = async () => {
    setIsSaving(true);
    try {
      // Here you would implement the actual save logic
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Başarılı",
        description: "Fatura başarıyla işlendi"
      });
      
      navigate('/purchase/e-invoice');
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Kaydetme sırasında hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };


  const matchedCount = invoiceItems.filter(item => item.matchedProduct).length;
  const allItemsMatched = invoiceItems.length > 0 && matchedCount === invoiceItems.length;

  if (isLoading) {
    return (
      <DefaultLayout 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        title="E-Fatura İşleme"
        subtitle="Fatura yükleniyor..."
      >
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Fatura bilgileri yükleniyor...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  if (!invoice) {
    return (
      <DefaultLayout 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        title="E-Fatura İşleme"
        subtitle="Fatura bulunamadı"
      >
        <div className="text-center py-20">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Fatura Bulunamadı</h3>
          <p className="text-gray-600 mb-6">Aradığınız fatura bulunamadı veya yüklenirken bir hata oluştu.</p>
          <Button onClick={() => navigate('/purchase/e-invoice')}>
            E-faturalar Listesine Dön
          </Button>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="E-Fatura İşleme"
      subtitle={`Fatura No: ${invoice.invoiceNumber}`}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/purchase/e-invoice')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  E-faturalar
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <h1 className="text-2xl font-semibold text-gray-900">Fatura İşleme</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {invoice.invoiceNumber}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {invoice.supplierName}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Invoice Info */}
            <div className="xl:col-span-1">
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Fatura Bilgileri
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gönderen</label>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{invoice.supplierName || 'Bilinmiyor'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fatura No</label>
                        <p className="text-sm font-mono text-gray-900 mt-1">{invoice.invoiceNumber || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vergi No</label>
                        <p className="text-sm font-mono text-gray-900 mt-1">{invoice.supplierTaxNumber || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fatura Tarihi</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'dd MMMM yyyy', { locale: tr }) : '-'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Invoice Summary */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Fatura Özeti</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brüt Toplam</span>
                          <span className="font-mono font-medium">{invoice.totalAmount?.toFixed(2) || '0,00'} {invoice.currency || 'TRY'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">İndirim</span>
                          <span className="font-mono">0,00 {invoice.currency || 'TRY'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Net Toplam</span>
                          <span className="font-mono">{((invoice.totalAmount || 0) * 0.82).toFixed(2)} {invoice.currency || 'TRY'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">KDV (%18)</span>
                          <span className="font-mono">{((invoice.totalAmount || 0) * 0.18).toFixed(2)} {invoice.currency || 'TRY'}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base pt-3 border-t border-gray-200">
                          <span>TOPLAM</span>
                          <span className="font-mono text-blue-600">{invoice.totalAmount?.toFixed(2) || '0,00'} {invoice.currency || 'TRY'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Product Matching */}
            <div className="xl:col-span-2">
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-600" />
                      Ürün Eşleştirme
                    </CardTitle>
                    <Badge variant={allItemsMatched ? "default" : "secondary"} className={
                      allItemsMatched ? "bg-green-100 text-green-800 border-green-200" : "bg-orange-100 text-orange-800 border-orange-200"
                    }>
                      {matchedCount} / {invoiceItems.length} Eşleştirildi
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Matching Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Eşleştirme İlerlemesi</span>
                      <span className="text-sm text-gray-500">{Math.round((matchedCount / invoiceItems.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          allItemsMatched ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${(matchedCount / invoiceItems.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div className="space-y-4">
                    {invoiceItems.map((item, index) => (
                      <div key={item.id} className={`border rounded-lg p-4 transition-all duration-200 ${
                        item.matchedProduct 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              item.matchedProduct 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {item.lineNumber}
                            </div>
                            <span className="text-sm font-medium text-gray-700">Kalem</span>
                          </div>
                          {item.matchedProduct && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Eşleştirildi</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">{item.description}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Miktar:</span>
                              <span className="ml-1 font-medium">{item.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Fiyat:</span>
                              <span className="ml-1 font-medium">{item.unitPrice?.toFixed(2) || '0,00'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Tutar:</span>
                              <span className="ml-1 font-medium">{item.totalAmount?.toFixed(2) || '0,00'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Net:</span>
                              <span className="ml-1 font-medium">{((item.totalAmount || 0) * 0.82).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <ProductSelector
                            value={item.matchedProduct?.name || ''}
                            onChange={(productName, product) => handleProductMatch(item.id, productName, product)}
                            placeholder="Ürün seçin..."
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateNewProduct(item)}
                            className="w-full border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Yeni Ürün Oluştur
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate('/purchase/e-invoice')}
              className="border-gray-300 hover:border-gray-400"
            >
              İptal
            </Button>
            
            <div className="flex items-center gap-4">
              {!allItemsMatched && (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Tüm kalemler eşleştirilmelidir</span>
                </div>
              )}
              
              <Button
                onClick={handleSaveAndSendAnswer}
                disabled={!allItemsMatched || isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Kaydet ve İşle
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default EInvoiceProcess;