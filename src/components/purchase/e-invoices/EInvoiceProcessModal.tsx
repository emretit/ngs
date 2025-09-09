import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  Search, 
  Plus, 
  Loader2, 
  AlertTriangle, 
  CheckCircle,
  Building,
  Calendar,
  DollarSign,
  FileText,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InvoiceItem {
  id: string;
  description: string;
  productCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  discountRate?: number;
  discountAmount?: number;
  matchedProductId?: string;
  matchedProductName?: string;
  isMatched: boolean;
}

interface EInvoiceProcessModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
  onProcessComplete: () => void;
}

export default function EInvoiceProcessModal({ 
  invoice, 
  isOpen, 
  onClose, 
  onProcessComplete 
}: EInvoiceProcessModalProps) {
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Load invoice details and products when modal opens
  useEffect(() => {
    if (isOpen && invoice) {
      loadInvoiceDetails();
      loadProducts();
    }
  }, [isOpen, invoice]);

  const loadInvoiceDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('nilvera-invoices', {
        body: { 
          action: 'get_invoice_details',
          invoice: { invoiceId: invoice.id }
        }
      });

      if (data?.success && data.invoiceDetails?.items) {
        const items: InvoiceItem[] = data.invoiceDetails.items.map((item: any, index: number) => ({
          id: `item-${index}`,
          description: item.description || '',
          productCode: item.productCode || '',
          quantity: item.quantity || 0,
          unit: item.unit || 'Adet',
          unitPrice: item.unitPrice || 0,
          vatRate: item.vatRate || 18,
          vatAmount: item.vatAmount || 0,
          totalAmount: item.totalAmount || 0,
          discountRate: item.discountRate || 0,
          discountAmount: item.discountAmount || 0,
          isMatched: false
        }));
        setInvoiceItems(items);
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Fatura detayları yüklenirken hata oluştu",
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

  const matchItemToProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setInvoiceItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            matchedProductId: productId,
            matchedProductName: product.name,
            isMatched: true 
          }
        : item
    ));
  };

  const unmatchItem = (itemId: string) => {
    setInvoiceItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            matchedProductId: undefined,
            matchedProductName: undefined,
            isMatched: false 
          }
        : item
    ));
  };

  const createNewProduct = async (item: InvoiceItem) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: item.description,
          sku: item.productCode || null,
          description: `E-fatura'dan oluşturuldu: ${invoice.invoiceNumber}`,
          price: item.unitPrice,
          currency: invoice.currency,
          tax_rate: item.vatRate,
          stock_quantity: 0,
          min_stock_level: 0,
          stock_threshold: 0,
          unit: item.unit,
          category_id: null, // Will need to be set later
          category_type: 'diğer',
          product_type: 'fiziksel',
          status: 'aktif',
          is_active: true
        }])
        .select()
        .single();

      if (data && !error) {
        setProducts(prev => [...prev, data]);
        matchItemToProduct(item.id, data.id);
        toast({
          title: "Ürün Oluşturuldu",
          description: `${data.name} ürünü başarıyla oluşturuldu ve eşleştirildi`
        });
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: "Ürün oluşturulurken hata oluştu",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allItemsMatched = invoiceItems.length > 0 && invoiceItems.every(item => item.isMatched);
  const matchedCount = invoiceItems.filter(item => item.isMatched).length;

  const handleSaveAndSendAnswer = async () => {
    if (!allItemsMatched) {
      toast({
        title: "Eksik Eşleştirme",
        description: "Tüm kalemler eşleştirilmeden 'ALINDI' yanıtı gönderilemez",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // First, save the invoice to purchase_invoices
      await saveInvoiceToPurchaseSystem();
      
      // Then send ALINDI response
      await sendAlindiResponse();
      
      toast({
        title: "İşlem Tamamlandı",
        description: "Fatura işlendi ve 'ALINDI' yanıtı gönderildi"
      });
      
      onProcessComplete();
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "İşlem sırasında hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveInvoiceToPurchaseSystem = async () => {
    // Save to purchase_invoices table
    const { data: supplierData } = await supabase
      .from('suppliers')
      .select('id')
      .eq('tax_number', invoice.supplierTaxNumber)
      .maybeSingle();
    
    let supplierId = supplierData?.id;
    
    if (!supplierId) {
      // Create supplier if doesn't exist
      const { data: newSupplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert([{
          name: invoice.supplierName,
          tax_number: invoice.supplierTaxNumber,
          type: 'kurumsal',
          status: 'aktif'
        }])
        .select('id')
        .single();
      
      if (newSupplier && !supplierError) {
        supplierId = newSupplier.id;
      }
    }

    if (!supplierId) {
      throw new Error('Tedarikçi bulunamadı veya oluşturulamadı');
    }

    const { error } = await supabase
      .from('purchase_invoices')
      .insert([{
        invoice_number: invoice.invoiceNumber,
        supplier_id: supplierId,
        invoice_date: invoice.invoiceDate,
        due_date: invoice.dueDate || invoice.invoiceDate,
        total_amount: invoice.totalAmount,
        paid_amount: invoice.paidAmount || 0,
        currency: invoice.currency || 'TRY',
        tax_amount: invoice.taxAmount || 0,
        status: 'pending',
        subtotal: invoice.totalAmount - (invoice.taxAmount || 0),
        notes: `E-fatura'dan işlendi - Nilvera ID: ${invoice.id}`
      }]);

    if (error) throw error;
  };

  const sendAlindiResponse = async () => {
    // TODO: Implement actual ALINDI response sending via Nilvera API
    // For now, this is a placeholder
    console.log('Sending ALINDI response for invoice:', invoice.id);
    
    // This would be the actual API call:
    const { data, error } = await supabase.functions.invoke('nilvera-invoices', {
      body: { 
        action: 'send_response',
        invoice: { 
          invoiceId: invoice.id,
          response: 'ALINDI',
          responseNote: 'Fatura işlendi ve sisteme aktarıldı'
        }
      }
    });

    if (error || !data?.success) {
      throw new Error(data?.error || 'ALINDI yanıtı gönderilemedi');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-orange-600">
            E-Fatura İşleme - {invoice?.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Header Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Fatura Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tedarikçi</p>
                  <p className="font-medium">{invoice?.supplierName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fatura Tarihi</p>
                  <p className="font-medium">
                    {invoice?.invoiceDate && format(new Date(invoice.invoiceDate), 'dd.MM.yyyy', { locale: tr })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Toplam Tutar</p>
                  <p className="font-medium text-lg">
                    {invoice?.totalAmount?.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {invoice?.currency}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matching Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                <span className="font-medium">Eşleştirme Durumu</span>
              </div>
              <Badge variant={allItemsMatched ? "default" : "secondary"} className={
                allItemsMatched ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
              }>
                {matchedCount} / {invoiceItems.length} Eşleştirildi
              </Badge>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${invoiceItems.length > 0 ? (matchedCount / invoiceItems.length) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ürün ara (isim, SKU, barkod)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2">Fatura kalemleri yükleniyor...</span>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fatura Kalemleri</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Durum</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Ürün Kodu</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead>Birim Fiyat</TableHead>
                    <TableHead>KDV %</TableHead>
                    <TableHead>Toplam</TableHead>
                    <TableHead>Ürün Eşleştirme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.isMatched ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={item.description}>
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.productCode || '-'}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        {item.unitPrice.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </TableCell>
                      <TableCell>{item.vatRate}%</TableCell>
                      <TableCell className="font-semibold">
                        {item.totalAmount.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </TableCell>
                      <TableCell>
                        {item.isMatched ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {item.matchedProductName}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => unmatchItem(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Select onValueChange={(value) => matchItemToProduct(item.id, value)}>
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Ürün seçin..." />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredProducts.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div>
                                      <div className="font-medium">{product.name}</div>
                                      {product.sku && (
                                        <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => createNewProduct(item)}
                              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Yeni
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6">
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          
          <div className="flex items-center gap-4">
            {!allItemsMatched && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Tüm kalemler eşleştirilmelidir</span>
              </div>
            )}
            
            <Button
              onClick={handleSaveAndSendAnswer}
              disabled={!allItemsMatched || isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  İşleniyor...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Kaydet & ALINDI Gönder
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}