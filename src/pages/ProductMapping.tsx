import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Loader2,
  Building,
  Calendar,
  DollarSign,
  Package,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import DefaultLayout from '@/components/layouts/DefaultLayout';

interface ParsedProduct {
  name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  unit: string;
  tax_rate: number;
  line_total: number;
  tax_amount?: number;
  discount_amount?: number;
}

interface ExistingProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  category_type: string;
  stock_quantity: number;
  unit: string;
  tax_rate: number;
}

interface ProductMapping {
  parsedProduct: ParsedProduct;
  selectedProductId: string | null;
  action: 'create' | 'update' | 'skip';
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierTaxNumber: string;
  invoiceDate: string;
  totalAmount: number;
  currency: string;
  taxAmount: number;
  status: string;
}

interface ProductMappingProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function ProductMapping({ isCollapsed = false, setIsCollapsed = () => {} }: ProductMappingProps) {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [existingProducts, setExistingProducts] = useState<ExistingProduct[]>([]);
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Mevcut ürünleri yükle
  const loadExistingProducts = async () => {
    try {
      console.log('🔄 Mevcut ürünler yükleniyor...');
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price, category_type, stock_quantity, unit, tax_rate')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      console.log('✅ Mevcut ürünler yüklendi:', data?.length || 0);
      setExistingProducts(data || []);
      return data || [];
    } catch (error) {
      console.error('❌ Mevcut ürünler yüklenemedi:', error);
      toast({
        title: "❌ Hata",
        description: "Mevcut ürünler yüklenemedi",
        variant: "destructive",
      });
      return [];
    }
  };

  // Fatura ve ürün verilerini yükle
  const loadInvoiceData = async () => {
    if (!invoiceId) {
      toast({
        title: "❌ Hata",
        description: "Fatura ID bulunamadı",
        variant: "destructive",
      });
      navigate('/orders/purchase');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔄 Fatura verileri yükleniyor...', invoiceId);
      
      // Fatura verilerini session storage'dan al
      const invoiceData = sessionStorage.getItem(`invoice_${invoiceId}`);
      if (invoiceData) {
        const parsedInvoice = JSON.parse(invoiceData);
        setInvoice(parsedInvoice);
        console.log('✅ Fatura bilgileri session storage\'dan alındı:', parsedInvoice.invoiceNumber);
      }

      // Önce mevcut ürünleri yükle
      const existingProductsData = await loadExistingProducts();

      // XML'den ürünleri parse et
      console.log('🔄 XML\'den ürünler parse ediliyor...');
      const { data, error } = await supabase.functions.invoke('nilvera-invoices', {
        body: { 
          action: 'process_xml_invoice',
          invoiceId: invoiceId
        }
      });

      console.log('📥 XML Parse API Response:', data);

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw error;
      }

      if (data && data.success) {
        const products = data.xmlParsed || [];
        console.log('✅ Parse edilen ürünler:', products.length);
        console.log('🎯 İlk ürün örneği:', products[0]);
        
        setParsedProducts(products);
        
        // Otomatik eşleştirme önerileri oluştur
        const mappings = products.map((product: ParsedProduct) => {
          let suggestedProduct = null;
          
          // SKU ile eşleştirme
          if (product.sku) {
            suggestedProduct = existingProductsData.find(p => p.sku === product.sku);
          }
          
          // İsim ile eşleştirme
          if (!suggestedProduct && product.name) {
            suggestedProduct = existingProductsData.find(p => 
              p.name.toLowerCase().includes(product.name.toLowerCase()) ||
              product.name.toLowerCase().includes(p.name.toLowerCase())
            );
          }
          
          return {
            parsedProduct: product,
            selectedProductId: suggestedProduct?.id || null,
            action: 'create' // Varsayılan olarak yeni ürün oluştur
          } as ProductMapping;
        });
        
        setProductMappings(mappings);
        console.log('✅ Eşleştirme önerileri oluşturuldu:', mappings.length);
        
        if (products.length === 0) {
          toast({
            title: "⚠️ Uyarı",
            description: "Faturada ürün bilgisi bulunamadı",
            variant: "destructive",
          });
        } else {
          toast({
            title: "✅ Başarılı",
            description: `${products.length} ürün başarıyla parse edildi`,
          });
        }
      } else {
        console.error('❌ XML Parse başarısız:', data);
        throw new Error(data?.message || 'XML işlenemedi');
      }
    } catch (error: any) {
      console.error('❌ Veri yükleme hatası:', error);
      toast({
        title: "❌ Hata",
        description: error.message || "Veriler yüklenirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoiceData();
  }, [invoiceId]);

  // Eşleştirme değişikliği
  const handleMappingChange = (index: number, selectedValue: string) => {
    const newMappings = [...productMappings];
    
    if (selectedValue === 'create') {
      // Yeni ürün oluştur
      newMappings[index] = {
        ...newMappings[index],
        selectedProductId: null,
        action: 'create'
      };
    } else if (selectedValue === 'skip') {
      // Atla
      newMappings[index] = {
        ...newMappings[index],
        selectedProductId: null,
        action: 'skip'
      };
    } else {
      // Mevcut ürünle eşleştir
      newMappings[index] = {
        ...newMappings[index],
        selectedProductId: selectedValue,
        action: 'update'
      };
    }
    
    setProductMappings(newMappings);
  };

  // Geri dön
  const handleBack = () => {
    navigate('/orders/purchase');
  };

  // Eşleştirmeleri kaydet
  const saveMappings = async () => {
    if (!invoice) return;
    
    setIsSaving(true);
    
    try {
      const processedMappings = productMappings.filter(m => m.action !== 'skip');
      const results = [];
      
      for (const mapping of processedMappings) {
        try {
          if (mapping.action === 'create') {
            // Yeni ürün oluştur
            const { data: newProduct, error } = await supabase
              .from('products')
              .insert({
                name: mapping.parsedProduct.name,
                sku: mapping.parsedProduct.sku,
                price: mapping.parsedProduct.unit_price,
                tax_rate: mapping.parsedProduct.tax_rate || 18,
                unit: mapping.parsedProduct.unit || 'Adet',
                currency: invoice.currency || 'TRY',
                category_type: 'product',
                product_type: 'physical',
                status: 'active',
                is_active: true,
                stock_quantity: 0,
                min_stock_level: 0,
                stock_threshold: 0,
                description: `Nilvera faturasından aktarılan ürün - Fatura No: ${invoice.invoiceNumber}`,
              })
              .select()
              .single();

            if (error) throw error;
            results.push({ type: 'created', product: newProduct });
          } else if (mapping.action === 'update' && mapping.selectedProductId) {
            // Mevcut ürünü güncelle
            const { data: updatedProduct, error } = await supabase
              .from('products')
              .update({
                price: mapping.parsedProduct.unit_price,
                tax_rate: mapping.parsedProduct.tax_rate || 18,
                updated_at: new Date().toISOString()
              })
              .eq('id', mapping.selectedProductId)
              .select()
              .single();

            if (error) throw error;
            results.push({ type: 'updated', product: updatedProduct });
          }
        } catch (error) {
          console.error('Ürün işleme hatası:', error);
          results.push({ type: 'error', error: error });
        }
      }

      const createdCount = results.filter(r => r.type === 'created').length;
      const updatedCount = results.filter(r => r.type === 'updated').length;
      const errorCount = results.filter(r => r.type === 'error').length;

      toast({
        title: "✅ Eşleştirme Tamamlandı",
        description: `${createdCount} ürün oluşturuldu, ${updatedCount} ürün güncellendi${errorCount > 0 ? `, ${errorCount} hata` : ''}`,
      });

      // Başarılı ise geri dön
      if (errorCount === 0) {
        setTimeout(() => {
          handleBack();
        }, 2000);
      }

    } catch (error: any) {
      console.error('❌ Kaydetme hatası:', error);
      toast({
        title: "❌ Hata",
        description: error.message || "Eşleştirmeler kaydedilirken hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="Ürün Eşleştirme"
      subtitle={`Fatura No: ${invoice?.invoiceNumber || 'Yükleniyor...'} - ${invoice?.supplierName || ''}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
          
          {!isLoading && productMappings.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {productMappings.length} ürün • {productMappings.filter(m => m.action === 'create').length} yeni • {productMappings.filter(m => m.action === 'update').length} güncelleme
              </div>
              <Button
                onClick={saveMappings}
                disabled={isSaving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Kaydet
              </Button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ürünler Yükleniyor</h3>
                <p className="text-gray-500">
                  Fatura XML'i parse ediliyor ve ürün bilgileri çıkarılıyor...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : parsedProducts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ürün Bulunamadı</h3>
                <p className="text-gray-500 mb-4">
                  Bu faturada ürün bilgisi bulunamadı veya XML parse edilemedi.
                </p>
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Geri Dön
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Sol Panel - Evrak Bilgileri */}
            <div className="col-span-5">
              <Card>
                <CardHeader className="bg-blue-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    EVRAK BİLGİLERİ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Gönderen</label>
                      <p className="font-semibold">{invoice?.supplierName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tedarikçi</label>
                      <p className="font-semibold">{invoice?.supplierName}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Adres</label>
                      <p className="text-sm text-gray-700">-</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vergi No</label>
                      <p className="font-semibold">{invoice?.supplierTaxNumber}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Belge No</label>
                      <p className="font-semibold">{invoice?.invoiceNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tarihi</label>
                      <p className="font-semibold">
                        {invoice ? format(new Date(invoice.invoiceDate), 'dd.MM.yyyy', { locale: tr }) : '-'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Vadesi</label>
                      <p className="font-semibold">
                        {invoice ? format(new Date(invoice.invoiceDate), 'dd.MM.yyyy', { locale: tr }) : '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Proje</label>
                      <select className="w-full p-2 border rounded text-sm">
                        <option>(isteğe bağlı)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Masraf Kalemi</label>
                      <select className="w-full p-2 border rounded text-sm">
                        <option>Masraf kalemi seçin</option>
                      </select>
                    </div>
                    <div></div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Açıklama</label>
                    <textarea 
                      className="w-full p-2 border rounded text-sm h-20"
                      placeholder="Açıklama giriniz..."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sağ Panel - Ürün/Hizmetler */}
            <div className="col-span-7">
              <Card>
                <CardHeader className="bg-green-500 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    ÜRÜN / HİZMETLER
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">#</th>
                          <th className="text-left p-3 text-sm font-medium">Kod</th>
                          <th className="text-left p-3 text-sm font-medium">Açıklama</th>
                          <th className="text-center p-3 text-sm font-medium">Miktar</th>
                          <th className="text-right p-3 text-sm font-medium">Fiyat</th>
                          <th className="text-right p-3 text-sm font-medium">Tutar</th>
                          <th className="text-right p-3 text-sm font-medium">İndirim</th>
                          <th className="text-right p-3 text-sm font-medium">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productMappings.map((mapping, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm">{String(index + 1).padStart(4, '0')}</td>
                            <td className="p-3 text-sm font-mono">
                              {mapping.parsedProduct.sku || '-'}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  {mapping.parsedProduct.name}
                                </div>
                                <div className="relative">
                                  <Select
                                    value={
                                      mapping.action === 'create' ? 'create' :
                                      mapping.action === 'skip' ? 'skip' :
                                      mapping.selectedProductId || 'create'
                                    }
                                    onValueChange={(value) => handleMappingChange(index, value)}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-blue-50 border-blue-200">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="create">
                                        <span className="text-blue-600 font-medium">Yeni Ürün Kartı Aç</span>
                                      </SelectItem>
                                      <SelectItem value="skip">
                                        <span className="text-gray-600">Atla</span>
                                      </SelectItem>
                                      {existingProducts.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          <div className="flex flex-col">
                                            <span className="font-medium">{product.name}</span>
                                            {product.sku && (
                                              <span className="text-xs text-gray-500">SKU: {product.sku}</span>
                                            )}
                                            <span className="text-xs text-gray-500">
                                              {product.price.toLocaleString('tr-TR')} TL
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center text-sm">
                              {mapping.parsedProduct.quantity}
                            </td>
                            <td className="p-3 text-right text-sm">
                              {mapping.parsedProduct.unit_price.toLocaleString('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td className="p-3 text-right text-sm">
                              {mapping.parsedProduct.line_total.toLocaleString('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                            <td className="p-3 text-right text-sm">
                              {mapping.parsedProduct.discount_amount?.toLocaleString('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }) || '0,00'}
                            </td>
                            <td className="p-3 text-right text-sm font-semibold">
                              {mapping.parsedProduct.line_total.toLocaleString('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Toplam Alanı */}
                  <div className="border-t bg-gray-50 p-4">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Brüt Toplam:</span>
                          <span className="font-semibold">
                            {invoice?.totalAmount.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} TRY
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>İndirim:</span>
                          <span>0,00 TRY</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Net Toplam:</span>
                          <span className="font-semibold">
                            {invoice?.totalAmount.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} TRY
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>KDV (%0):</span>
                          <span>0,00 TRY</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold">
                          <span>TOPLAM:</span>
                          <span>
                            {invoice?.totalAmount.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })} TRY
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
} 