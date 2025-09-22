import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProductSelector from '@/components/proposals/form/ProductSelector';
import CompactProductForm from '@/components/einvoice/CompactProductForm';
import CompactSupplierForm from '@/components/einvoice/CompactSupplierForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  FileText, 
  Target,
  Plus,
  Check,
  X,
  Loader2,
  AlertCircle,
  Save,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DefaultLayout from '@/components/layouts/DefaultLayout';

interface EInvoiceItem {
  id: string;
  line_number: number;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate?: number;
  line_total: number;
  tax_amount?: number;
  gtip_code?: string;
  description?: string;
}

interface EInvoiceDetails {
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_tax_number: string;
  invoice_date: string;
  due_date?: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  total_amount: number;
  items: EInvoiceItem[];
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  unit: string;
  tax_rate: number;
  category_type?: string;
}

interface ProductMatchingItem {
  invoice_item: EInvoiceItem;
  matched_product_id?: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  tax_number?: string;
  email?: string;
}

export default function EInvoiceProcess() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [invoice, setInvoice] = useState<EInvoiceDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [matchingItems, setMatchingItems] = useState<ProductMatchingItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [supplierMatchStatus, setSupplierMatchStatus] = useState<'searching' | 'found' | 'not_found' | null>(null);
  
  // Form fields for purchase invoice
  const [formData, setFormData] = useState({
    invoice_date: '',
    due_date: '',
    payment_terms: '30 gün',
    notes: '',
    project_id: '',
    expense_category_id: ''
  });

  useEffect(() => {
    if (invoiceId) {
      loadAllData();
    }
  }, [invoiceId]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadInvoiceDetails(),
        loadProducts(),
        loadSuppliers()
      ]);
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      toast({
        title: "Hata",
        description: error.message || "Veriler yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoiceDetails = async () => {
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

      // Set default form values
      setFormData({
        invoice_date: invoiceDetails.invoice_date.split('T')[0],
        due_date: invoiceDetails.due_date ? invoiceDetails.due_date.split('T')[0] : '',
        payment_terms: '30 gün',
        notes: `E-faturadan aktarılan alış faturası - Orijinal No: ${invoiceDetails.invoice_number}`,
        project_id: '',
        expense_category_id: ''
      });

      // Initialize matching items
      const initialMatching: ProductMatchingItem[] = invoiceDetails.items.map(item => ({
        invoice_item: item
      }));

      setMatchingItems(initialMatching);

      console.log('✅ Invoice details loaded:', invoiceDetails);

    } catch (error: any) {
      throw new Error(error.message || 'Fatura detayları yüklenirken hata oluştu');
    }
  };

  const loadProducts = async () => {
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, price, unit, tax_rate, category_type')
        .eq('is_active', true)
        .order('name');

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error: any) {
      console.error('❌ Error loading products:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      setSupplierMatchStatus('searching');
      
      // Load all customers as potential suppliers since there's no supplier type
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('customers')
        .select('id, name, tax_number, email')
        .eq('type', 'kurumsal') // Use 'kurumsal' instead of 'supplier'
        .order('name');

      if (suppliersError) throw suppliersError;
      setSuppliers(suppliersData || []);

      // Try to find supplier by tax number
      if (invoice) {
        const matchingSupplier = suppliersData?.find(s => 
          s.tax_number === invoice.supplier_tax_number
        );
        if (matchingSupplier) {
          setSelectedSupplierId(matchingSupplier.id);
          setSupplierMatchStatus('found');
        } else {
          setSupplierMatchStatus('not_found');
        }
      }

    } catch (error: any) {
      console.error('❌ Error loading suppliers:', error);
      setSupplierMatchStatus('not_found');
    }
  };


  const handleManualMatch = (itemIndex: number, productId: string) => {
    const updatedMatching = [...matchingItems];
    updatedMatching[itemIndex] = {
      ...updatedMatching[itemIndex],
      matched_product_id: productId
    };
    setMatchingItems(updatedMatching);
  };

  const handleProductSelect = (itemIndex: number, product: Product) => {
    handleManualMatch(itemIndex, product.id);
  };

  const handleCreateNewProduct = (itemIndex: number) => {
    setCurrentItemIndex(itemIndex);
    setIsProductFormOpen(true);
  };

  const handleProductCreated = async (newProduct: Product) => {
    // Add to products list
    setProducts(prev => [...prev, newProduct]);
    
    // Invalidate products query so all dropdowns refresh
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    
    // Match with current item
    if (currentItemIndex >= 0) {
      const updatedMatching = [...matchingItems];
      updatedMatching[currentItemIndex] = {
        ...updatedMatching[currentItemIndex],
        matched_product_id: newProduct.id
      };
      setMatchingItems(updatedMatching);
    }
    
    // Reset form state
    setCurrentItemIndex(-1);
    setIsProductFormOpen(false);
    
    toast({
      title: "Başarılı",
      description: "Ürün oluşturuldu ve eşleştirildi",
    });
  };

  const handleCreateNewSupplier = () => {
    setIsSupplierFormOpen(true);
  };

  const handleSupplierCreated = async (newSupplier: any) => {
    // Add to suppliers list
    setSuppliers(prev => [...prev, newSupplier]);
    
    // Invalidate customers query so dropdowns refresh
    await queryClient.invalidateQueries({ queryKey: ["customers"] });
    
    // Auto-select the new supplier
    setSelectedSupplierId(newSupplier.id);
    setSupplierMatchStatus('found');
    
    // Reset form state
    setIsSupplierFormOpen(false);
    
    toast({
      title: "Başarılı",
      description: "Tedarikçi oluşturuldu ve seçildi",
    });
  };

  const handleRemoveMatch = (itemIndex: number) => {
    const updatedMatching = [...matchingItems];
    updatedMatching[itemIndex] = {
      ...updatedMatching[itemIndex],
      matched_product_id: undefined
    };
    setMatchingItems(updatedMatching);
  };

  const handleCreatePurchaseInvoice = async () => {
    if (!invoice || !selectedSupplierId || matchingItems.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen tüm gerekli alanları doldurun",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      // Save matching results to database first
      const matchingRecords = matchingItems.map(item => ({
        invoice_id: invoice.id,
        invoice_line_id: item.invoice_item.id,
        invoice_product_name: item.invoice_item.product_name,
        invoice_product_code: item.invoice_item.product_code,
        invoice_quantity: item.invoice_item.quantity,
        invoice_unit: item.invoice_item.unit,
        invoice_unit_price: item.invoice_item.unit_price,
        invoice_total_amount: item.invoice_item.line_total,
        invoice_tax_rate: item.invoice_item.tax_rate,
        matched_stock_id: item.matched_product_id,
        match_type: 'manual',
        match_confidence: 1.0,
        is_confirmed: true,
        notes: item.notes
      }));

      const { error: insertError } = await supabase
        .from('e_fatura_stok_eslestirme')
        .insert(matchingRecords);

      if (insertError) throw insertError;

      // Create new products if needed
      const newProductItems = matchingItems.filter(item => !item.matched_product_id);
      
      for (const item of newProductItems) {
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            name: item.invoice_item.product_name,
            sku: item.invoice_item.product_code,
            price: item.invoice_item.unit_price,
            unit: item.invoice_item.unit,
            tax_rate: item.invoice_item.tax_rate,
            currency: invoice.currency,
            category_type: 'product',
            product_type: 'physical',
            status: 'active',
            is_active: true,
            stock_quantity: 0,
            description: `E-faturadan oluşturulan ürün - Fatura No: ${invoice.invoice_number}`
          })
          .select()
          .single();

        if (productError) {
          console.error('❌ Error creating product:', productError);
          continue;
        }

        // Update matching record with new product ID
        await supabase
          .from('e_fatura_stok_eslestirme')
          .update({ matched_stock_id: newProduct.id })
          .eq('invoice_id', invoice.id)
          .eq('invoice_line_id', item.invoice_item.id);
      }

      // Get only valid items for purchase invoice
      const validItems = matchingItems.filter(item => 
        item.matched_product_id
      );

      const subtotal = validItems.reduce((sum, item) => 
        sum + (item.invoice_item.line_total - (item.invoice_item.line_total * item.invoice_item.tax_rate / 100)), 0
      );
      const taxTotal = validItems.reduce((sum, item) => 
        sum + (item.invoice_item.line_total * item.invoice_item.tax_rate / 100), 0
      );
      const total = subtotal + taxTotal;

      // Create purchase invoice
      const { data: purchaseInvoice, error: invoiceError } = await supabase
        .from('purchase_invoices')
        .insert({
          invoice_number: invoice.invoice_number,
          supplier_id: selectedSupplierId,
          status: 'pending',
          currency: invoice.currency,
          subtotal,
          tax_amount: taxTotal,
          total_amount: total,
          paid_amount: 0,
          invoice_date: formData.invoice_date,
          due_date: formData.due_date || formData.invoice_date,
          notes: formData.notes,
          einvoice_id: invoice.id
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create purchase invoice items
      const purchaseInvoiceItems = validItems.map(item => ({
        purchase_invoice_id: purchaseInvoice.id,
        product_id: item.matched_product_id,
        product_name: item.invoice_item.product_name,
        sku: item.invoice_item.product_code,
        quantity: item.invoice_item.quantity,
        unit: item.invoice_item.unit,
        unit_price: item.invoice_item.unit_price,
        tax_rate: item.invoice_item.tax_rate,
        discount_rate: item.invoice_item.discount_rate || 0,
        line_total: item.invoice_item.line_total,
        company_id: purchaseInvoice.company_id
      }));

      const { error: itemsError } = await supabase
        .from('purchase_invoice_items')
        .insert(purchaseInvoiceItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Başarılı",
        description: `Alış faturası başarıyla oluşturuldu. ${newProductItems.length} yeni ürün eklendi.`,
      });

      navigate('/purchase/e-invoice');

    } catch (error: any) {
      console.error('❌ Error creating purchase invoice:', error);
      toast({
        title: "Hata",
        description: error.message || "Alış faturası oluşturulurken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };



  const getMatchedProduct = (productId?: string) => {
    return products.find(p => p.id === productId);
  };

  const matchedCount = matchingItems.filter(item => 
    item.matched_product_id
  ).length;

  const allMatched = matchedCount === matchingItems.length && matchingItems.length > 0;
  const canCreateInvoice = selectedSupplierId && matchedCount > 0;

  if (isLoading) {
    return (
      <DefaultLayout 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        title="E-Fatura İşleme"
        subtitle="Yükleniyor..."
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Fatura detayları yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      </DefaultLayout>
    );
  }

  if (!invoice) {
    return (
      <DefaultLayout 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        title="E-Fatura İşleme"
        subtitle="Hata"
      >
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fatura Yüklenemedi</h3>
              <p className="text-gray-600 mb-4">Fatura detayları yüklenirken hata oluştu</p>
              <Button onClick={() => navigate('/purchase/e-invoice')} variant="outline">
                Geri Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="E-Fatura İşleme"
      subtitle={`Fatura No: ${invoice.invoice_number}`}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/purchase/e-invoice')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            E-faturalar
          </Button>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline">{invoice.invoice_number}</Badge>
            <Badge variant="secondary">{invoice.supplier_name}</Badge>
          </div>
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Invoice Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="bg-blue-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Fatura Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tedarikçi</Label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{invoice.supplier_name}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vergi No</Label>
                  <p className="text-sm font-mono text-gray-900 mt-1">{invoice.supplier_tax_number}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tarih</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {format(new Date(invoice.invoice_date), 'dd MMMM yyyy', { locale: tr })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Toplam</Label>
                  <p className="text-sm font-mono font-semibold text-blue-600 mt-1">
                    {invoice.total_amount.toFixed(2)} {invoice.currency}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Kalem Sayısı</Label>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{invoice.items.length}</p>
                </div>

                {/* Purchase Invoice Form */}
                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Alış Faturası</h4>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="supplier">Tedarikçi *</Label>
                      {supplierMatchStatus === 'searching' && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Aranıyor...
                        </div>
                      )}
                      {supplierMatchStatus === 'found' && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Check className="h-3 w-3" />
                          Eşleşti
                        </div>
                      )}
                      {supplierMatchStatus === 'not_found' && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <X className="h-3 w-3" />
                          Bulunamadı
                        </div>
                      )}
                    </div>
                    
                    {supplierMatchStatus === 'not_found' && invoice && (
                      <Alert className="mb-3">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <div className="space-y-1">
                            <p><strong>VKN:</strong> {invoice.supplier_tax_number}</p>
                            <p><strong>Tedarikçi:</strong> {invoice.supplier_name}</p>
                            <p className="text-xs text-muted-foreground">Bu vergi numarası ile kayıtlı tedarikçi bulunamadı.</p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tedarikçi seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              <div>
                                <p className="font-medium text-xs">{supplier.name}</p>
                                <p className="text-xs text-gray-500">VKN: {supplier.tax_number}</p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {supplierMatchStatus === 'not_found' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCreateNewSupplier}
                          className="w-full flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Yeni Tedarikçi Oluştur
                        </Button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="invoice_date">Fatura Tarihi</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notlar</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Matching */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="bg-green-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Ürün Eşleştirme
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Matching Table */}
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="min-w-48">Fatura Kalemi</TableHead>
                        <TableHead className="w-20 text-right">Miktar</TableHead>
                        <TableHead className="min-w-64">Eşleşen Ürün</TableHead>
                        <TableHead className="w-32">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchingItems.map((item, index) => {
                        const matchedProduct = getMatchedProduct(item.matched_product_id);
                        
                        return (
                          <TableRow key={item.invoice_item.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium text-center">
                              {item.invoice_item.line_number}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-48">
                                <p className="font-medium text-gray-900 truncate text-sm">
                                  {item.invoice_item.product_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {item.invoice_item.product_code && `Kod: ${item.invoice_item.product_code} • `}
                                  {item.invoice_item.unit_price.toFixed(2)} {invoice.currency} / {item.invoice_item.unit}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {item.invoice_item.quantity.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                {matchedProduct ? (
                                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                                    <p className="font-medium text-green-900 text-sm">
                                      {matchedProduct.name}
                                    </p>
                                    <p className="text-xs text-green-600">
                                      SKU: {matchedProduct.sku || '-'} • 
                                      {matchedProduct.price.toFixed(2)} {invoice.currency}
                                    </p>
                                  </div>
                                ) : (
                                   <ProductSelector
                                     value=""
                                     onChange={() => {}}
                                     onProductSelect={(product) => handleProductSelect(index, product)}
                                     onNewProduct={() => handleCreateNewProduct(index)}
                                     placeholder="Ürün ara ve seçin..."
                                     className="text-xs"
                                   />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.matched_product_id && (
                                <Button
                                  onClick={() => handleRemoveMatch(index)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {allMatched ? (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <Check className="h-4 w-4" />
                Tüm ürünler eşleştirildi
              </span>
            ) : (
              <span>
                {matchedCount} / {matchingItems.length} ürün eşleştirildi
                {matchingItems.length - matchedCount > 0 && (
                  <span className="text-orange-600 ml-2">
                    ({matchingItems.length - matchedCount} ürün eksik)
                  </span>
                )}
              </span>
            )}
          </div>
          
          <Button
            onClick={handleCreatePurchaseInvoice}
            disabled={!canCreateInvoice || isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Alış Faturasını Oluştur
          </Button>
        </div>
      </div>

      {/* Compact Product Form Modal */}
      <CompactProductForm
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setCurrentItemIndex(-1);
        }}
        onProductCreated={handleProductCreated}
        initialData={
          currentItemIndex >= 0 ? {
            name: matchingItems[currentItemIndex]?.invoice_item.product_name || "",
            unit: matchingItems[currentItemIndex]?.invoice_item.unit || "Adet",
            price: matchingItems[currentItemIndex]?.invoice_item.unit_price || 0,
            tax_rate: matchingItems[currentItemIndex]?.invoice_item.tax_rate || 18,
            code: matchingItems[currentItemIndex]?.invoice_item.product_code || "",
          } : undefined
        }
      />

      {/* Compact Supplier Form Modal */}
      <CompactSupplierForm
        isOpen={isSupplierFormOpen}
        onClose={() => setIsSupplierFormOpen(false)}
        onSupplierCreated={handleSupplierCreated}
        initialData={
          invoice ? {
            name: invoice.supplier_name,
            tax_number: invoice.supplier_tax_number,
            company: invoice.supplier_name,
          } : undefined
        }
      />
    </DefaultLayout>
  );
}