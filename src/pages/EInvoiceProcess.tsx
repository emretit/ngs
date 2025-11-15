import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
// Lazy load heavy components
const EInvoiceProductSelector = React.lazy(() => import('@/components/einvoice/EInvoiceProductSelector'));
const CompactProductForm = React.lazy(() => import('@/components/einvoice/CompactProductForm'));
const EInvoiceProductDetailsDialog = React.lazy(() => import('@/components/einvoice/EInvoiceProductDetailsDialog'));
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
  Package,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatUnit } from '@/utils/unitConstants';
import { formatCurrency } from '@/utils/formatters';
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
  // Detaylı tedarikçi bilgileri
  supplier_details?: {
    company_name?: string;
    tax_number?: string;
    trade_registry_number?: string;
    mersis_number?: string;
    email?: string;
    phone?: string;
    website?: string;
    fax?: string;
    address?: {
      street?: string;
      district?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    };
    bank_info?: {
      bank_name?: string;
      iban?: string;
      account_number?: string;
    };
  };
}
import { Product } from "@/types/product";
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

// Memoized Table Row Component
const MemoizedTableRow = React.memo(({ 
  item, 
  index, 
  invoice, 
  getMatchedProduct, 
  handleProductSelect, 
  handleCreateNewProduct, 
  handleRemoveMatch,
  formatUnit
}: {
  item: ProductMatchingItem;
  index: number;
  invoice: EInvoiceDetails;
  getMatchedProduct: (productId?: string) => Product | undefined;
  handleProductSelect: (itemIndex: number, product: Product) => void;
  handleCreateNewProduct: (itemIndex: number) => void;
  handleRemoveMatch: (itemIndex: number) => void;
  formatUnit: (unit: string) => string;
}) => {
  const matchedProduct = getMatchedProduct(item.matched_product_id);
  
  return (
    <TableRow className="hover:bg-gray-50/50 transition-colors">
      <TableCell className="font-medium text-center">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
          {item.invoice_item.line_number}
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-48">
          <p className="font-medium text-gray-900 truncate text-sm">
            {item.invoice_item.product_name}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="font-mono text-sm font-semibold text-gray-700">
          {item.invoice_item.quantity.toFixed(2)}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-xs font-medium text-gray-600">
          {formatUnit(item.invoice_item.unit)}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="text-sm font-semibold text-gray-700">
          {formatCurrency(item.invoice_item.unit_price, invoice.currency)}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          {matchedProduct ? (
            <div className="p-3 bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-lg shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <p className="font-semibold text-green-900 text-sm">
                      {matchedProduct.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-green-700 mt-1">
                    {matchedProduct.sku && (
                      <span className="px-2 py-0.5 bg-green-200/50 rounded">SKU: {matchedProduct.sku}</span>
                    )}
                    <span>{formatCurrency(matchedProduct.price, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <React.Suspense fallback={<div className="text-xs text-gray-500 p-2">Yükleniyor...</div>}>
               <EInvoiceProductSelector
                 value=""
                 onChange={() => {}}
                 onProductSelect={(product) => handleProductSelect(index, product)}
                 onNewProduct={() => handleCreateNewProduct(index)}
                 placeholder="Ürün ara ve seçin..."
                 className="text-xs"
               />
             </React.Suspense>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        {item.matched_product_id && (
          <Button
            onClick={() => handleRemoveMatch(index)}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
});
export default function EInvoiceProcess() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [invoice, setInvoice] = useState<EInvoiceDetails | null>(null);
  const [matchingItems, setMatchingItems] = useState<ProductMatchingItem[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [supplierMatchStatus, setSupplierMatchStatus] = useState<'searching' | 'found' | 'not_found' | null>(null);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [selectedProductForWarehouse, setSelectedProductForWarehouse] = useState<Product | null>(null);
  const [pendingProductIndex, setPendingProductIndex] = useState<number>(-1);
  // Form fields for purchase invoice
  const [formData, setFormData] = useState({
    invoice_date: '',
    due_date: '',
    payment_terms: '30 gün',
    notes: '',
    project_id: '',
    expense_category_id: ''
  });
  // React Query ile ürünleri yükle
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-for-einvoice'],
    queryFn: async () => {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, price, unit, tax_rate, category_type')
        .eq('is_active', true)
        .order('name')
        .limit(1000);
      if (productsError) throw productsError;
      return productsData || [];
    },
    staleTime: 10 * 60 * 1000, // 10 dakika cache
    gcTime: 20 * 60 * 1000, // 20 dakika cache'de tut
    refetchOnWindowFocus: false,
  });

  // React Query ile tedarikçileri yükle
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers-for-einvoice'],
    queryFn: async () => {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name, tax_number, email, company_id')
        .eq('status', 'aktif')
        .order('name')
        .limit(500);
      if (suppliersError) throw suppliersError;
      return suppliersData || [];
    },
    staleTime: 10 * 60 * 1000, // 10 dakika cache
    gcTime: 20 * 60 * 1000, // 20 dakika cache'de tut
    refetchOnWindowFocus: false,
  });

  // Load invoice details - MUST be defined before the useEffect that uses it
  const loadInvoiceDetails = useCallback(async () => {
    try {
      console.log('🔄 Loading invoice details from Nilvera API for:', invoiceId);

      // Direkt olarak fatura detaylarını al - liste aramaya gerek yok çünkü UUID'miz var
      const { data: detailsData, error: detailsError } = await supabase.functions.invoke('nilvera-invoice-details', {
        body: {
          invoiceId: invoiceId,
          envelopeUUID: invoiceId // UUID aynı zamanda envelopeUUID olabilir
        }
      });

      if (detailsError) throw detailsError;
      if (!detailsData?.success) {
        throw new Error(detailsData?.error || 'Fatura detayları alınamadı');
      }

      console.log('✅ API Response detailsData:', detailsData);

      // API'den gelen detay verisi
      const apiInvoiceDetails = detailsData.invoiceDetails;

      console.log('🔍 Full invoice details:', apiInvoiceDetails);
      console.log('🔍 Available keys in apiInvoiceDetails:', apiInvoiceDetails ? Object.keys(apiInvoiceDetails) : 'null');

      const items: EInvoiceItem[] = apiInvoiceDetails?.items?.map((item: any, index: number) => ({
        id: `item-${index}`,
        line_number: index + 1,
        product_name: item.description || 'Açıklama yok',
        product_code: item.productCode,
        quantity: item.quantity || 1,
        unit: item.unit || 'adet', // nilvera-invoice-details'te zaten UBL-TR kodundan dropdown değerine çevriliyor
        unit_price: item.unitPrice || 0,
        tax_rate: item.vatRate || item.taxRate || 18,
        discount_rate: item.discountRate || 0,
        line_total: item.totalAmount || 0,
        tax_amount: item.vatAmount || item.taxAmount || 0,
        gtip_code: item.gtipCode,
        description: item.description
      })) || [];

      // Detaylı tedarikçi bilgilerini çıkar - önce supplierInfo'dan, sonra fallback'ler
      const supplierInfo = apiInvoiceDetails?.supplierInfo || {};
      const accountingSupplierParty = apiInvoiceDetails?.AccountingSupplierParty || {};
      
      console.log('🔍 Raw supplierInfo from API:', supplierInfo);
      console.log('🔍 AccountingSupplierParty from API:', accountingSupplierParty);
      console.log('🔍 apiInvoiceDetails keys:', apiInvoiceDetails ? Object.keys(apiInvoiceDetails) : 'null');

      // Tedarikçi adı için önce supplierInfo'dan, sonra fallback'ler
      const supplierName =
        supplierInfo?.companyName ||
        apiInvoiceDetails?.SenderName ||
        apiInvoiceDetails?.supplierName ||
        accountingSupplierParty?.Party?.PartyName?.Name ||
        accountingSupplierParty?.PartyName?.Name ||
        'Tedarikçi';

      // Tedarikçi VKN için önce supplierInfo'dan, sonra fallback'ler
      const supplierTaxNumber =
        supplierInfo?.taxNumber ||
        apiInvoiceDetails?.SenderTaxNumber ||
        apiInvoiceDetails?.supplierTaxNumber ||
        apiInvoiceDetails?.SenderIdentifier ||
        apiInvoiceDetails?.TaxNumber ||
        accountingSupplierParty?.Party?.PartyIdentification?.ID ||
        accountingSupplierParty?.PartyIdentification?.ID ||
        accountingSupplierParty?.Party?.PartyTaxScheme?.TaxScheme?.ID ||
        '';

      console.log('✅ Extracted supplier info:', { supplierName, supplierTaxNumber });

      // Fatura tutar bilgilerini doğru alanlardan çek
      // Edge function'da hesaplanmış değerler kullanılıyor
      const subtotal = parseFloat(apiInvoiceDetails?.TaxExclusiveAmount || apiInvoiceDetails?.taxExclusiveAmount || '0');
      const taxTotal = parseFloat(apiInvoiceDetails?.TaxTotalAmount || apiInvoiceDetails?.taxTotalAmount || '0');
      const totalAmount = parseFloat(apiInvoiceDetails?.PayableAmount || apiInvoiceDetails?.payableAmount || apiInvoiceDetails?.TotalAmount || apiInvoiceDetails?.totalAmount || '0');
      
      console.log('💰 Invoice amounts:', { subtotal, taxTotal, totalAmount });

      const invoiceDetails: EInvoiceDetails = {
        id: invoiceId,
        invoice_number: apiInvoiceDetails?.InvoiceNumber || apiInvoiceDetails?.invoiceNumber || apiInvoiceDetails?.ID || invoiceId,
        supplier_name: supplierName,
        supplier_tax_number: supplierTaxNumber,
        invoice_date: apiInvoiceDetails?.IssueDate || apiInvoiceDetails?.issueDate || apiInvoiceDetails?.InvoiceDate || new Date().toISOString(),
        due_date: apiInvoiceDetails?.dueDate || apiInvoiceDetails?.DueDate || null,
        currency: apiInvoiceDetails?.CurrencyCode || apiInvoiceDetails?.currency || 'TL',
        subtotal: subtotal,
        tax_total: taxTotal,
        total_amount: totalAmount,
        items,
        supplier_details: {
          company_name: supplierName,
          tax_number: supplierTaxNumber,
          trade_registry_number: supplierInfo?.tradeRegistryNumber || null,
          mersis_number: supplierInfo?.mersisNumber || null,
          email: supplierInfo?.email || null,
          phone: supplierInfo?.phone || null,
          website: supplierInfo?.website || null,
          fax: supplierInfo?.fax || null,
          address: {
            street: supplierInfo?.address?.street || null,
            district: supplierInfo?.address?.district || null,
            city: supplierInfo?.address?.city || null,
            postal_code: supplierInfo?.address?.postalCode || supplierInfo?.address?.postal_code || null,
            country: supplierInfo?.address?.country || 'Türkiye'
          },
          bank_info: {
            bank_name: supplierInfo?.bankInfo?.bankName || null,
            iban: supplierInfo?.bankInfo?.iban || null,
            account_number: supplierInfo?.bankInfo?.accountNumber || null
          }
        }
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
      console.error('❌ Error in loadInvoiceDetails:', error);
      // Hata zaten toast ile gösterildi, sadece tekrar fırlat
      throw error;
    }
  }, [invoiceId, toast]);

  useEffect(() => {
    if (invoiceId) {
      loadInvoiceDetails().catch((error) => {
        console.error('❌ Error loading invoice details:', error);
        toast({
          title: "Hata",
          description: error.message || "Fatura detayları yüklenirken bir hata oluştu",
          variant: "destructive",
        });
        // Hata durumunda geri dön
        navigate('/e-invoice');
      });
    }
  }, [invoiceId, loadInvoiceDetails, navigate, toast]);

  // Tedarikçi eşleştirmesi için ayrı fonksiyon - useCallback ile optimize et
  const matchSupplier = useCallback(async () => {
    if (!invoice || !suppliers.length) return;
    setSupplierMatchStatus('searching');
    const matchingSupplier = suppliers.find(s => 
      s.tax_number === invoice.supplier_tax_number
    );
    if (matchingSupplier) {
      setSelectedSupplierId(matchingSupplier.id);
      setSupplierMatchStatus('found');
      console.log('✅ Tedarikçi otomatik eşleştirildi:', matchingSupplier.name);
    } else {
      setSupplierMatchStatus('not_found');
      console.log('⚠️ Tedarikçi bulunamadı:', invoice.supplier_tax_number);
    }
  }, [invoice, suppliers]);

  // Tedarikçi eşleştirmesi için useEffect
  useEffect(() => {
    if (invoice && suppliers.length > 0) {
      matchSupplier();
    }
  }, [invoice, suppliers, matchSupplier]);
  
  // Loading state'i hesapla
  const isLoading = !invoice || isLoadingProducts || isLoadingSuppliers;
  
  // loadInvoiceDetails moved earlier to avoid hoisting issue - it's now defined before the useEffect that uses it
  
  const handleManualMatch = useCallback((itemIndex: number, productId: string) => {
    setMatchingItems(prev => {
      const updatedMatching = [...prev];
      updatedMatching[itemIndex] = {
        ...updatedMatching[itemIndex],
        matched_product_id: productId
      };
      return updatedMatching;
    });
  }, []);
  
  const handleProductSelect = useCallback((itemIndex: number, product: Product) => {
    // Ürün seçildiğinde detay dialog'unu aç
    const invoiceItem = matchingItems[itemIndex]?.invoice_item;
    setSelectedProductForWarehouse(product);
    setPendingProductIndex(itemIndex);
    setIsWarehouseDialogOpen(true);
  }, [matchingItems]);

  const handleProductDetailsConfirm = useCallback((data: { warehouseId: string; quantity?: number; price?: number; unit?: string; discountRate?: number; taxRate?: number; description?: string }) => {
    if (selectedProductForWarehouse && pendingProductIndex >= 0) {
      // Ürünü eşleştir
      handleManualMatch(pendingProductIndex, selectedProductForWarehouse.id);
      // TODO: Depo bilgisini ve miktar/fiyat/birim/indirim/KDV/açıklama bilgilerini kaydetmek için matchingItems'a eklenebilir
    }
    setIsWarehouseDialogOpen(false);
    setSelectedProductForWarehouse(null);
    setPendingProductIndex(-1);
  }, [selectedProductForWarehouse, pendingProductIndex, handleManualMatch]);
  
  const handleCreateNewProduct = useCallback((itemIndex: number) => {
    setCurrentItemIndex(itemIndex);
    setIsProductFormOpen(true);
  }, []);
  const handleProductCreated = async (newProduct: Product) => {
    // Invalidate products query so all dropdowns refresh
    await queryClient.invalidateQueries({ queryKey: ["products-for-einvoice"] });
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
  const handleRemoveMatch = useCallback((itemIndex: number) => {
    setMatchingItems(prev => {
      const updatedMatching = [...prev];
      updatedMatching[itemIndex] = {
        ...updatedMatching[itemIndex],
        matched_product_id: undefined
      };
      return updatedMatching;
    });
  }, []);
  const handleCreateNewSupplier = async () => {
    if (!invoice) return;
    setIsCreatingSupplier(true);
    try {
      // Mevcut kullanıcının company_id'sini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      // Kullanıcının company_id'sini al
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (profileError || !userProfile?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }
      // E-faturadan gelen detaylı bilgilerle yeni tedarikçi oluştur
      const supplierData = {
        name: invoice.supplier_details?.company_name || invoice.supplier_name,
        tax_number: invoice.supplier_details?.tax_number || invoice.supplier_tax_number,
        trade_registry_number: invoice.supplier_details?.trade_registry_number,
        mersis_number: invoice.supplier_details?.mersis_number,
        email: invoice.supplier_details?.email,
        office_phone: invoice.supplier_details?.phone,
        website: invoice.supplier_details?.website,
        fax: invoice.supplier_details?.fax,
        address: invoice.supplier_details?.address ? 
          `${invoice.supplier_details.address.street || ''} ${invoice.supplier_details.address.district || ''} ${invoice.supplier_details.address.city || ''}`.trim() : 
          undefined,
        city: invoice.supplier_details?.address?.city,
        district: invoice.supplier_details?.address?.district,
        postal_code: invoice.supplier_details?.address?.postal_code,
        country: invoice.supplier_details?.address?.country || 'Türkiye',
        bank_name: invoice.supplier_details?.bank_info?.bank_name,
        iban: invoice.supplier_details?.bank_info?.iban,
        account_number: invoice.supplier_details?.bank_info?.account_number,
        type: 'kurumsal',
        status: 'aktif',
        company: invoice.supplier_details?.company_name || invoice.supplier_name,
        balance: 0,
        company_id: userProfile.company_id // RLS için company_id ekle
      };
      console.log('🔍 Tedarikçi kaydedilecek bilgiler:', supplierData);
      console.log('🔍 E-fatura tedarikçi detayları:', invoice.supplier_details);
      const { data: newSupplier, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();
      if (error) throw error;
      console.log('✅ Tedarikçi başarıyla oluşturuldu:', newSupplier);
      // Tedarikçi query'sini invalidate et
      await queryClient.invalidateQueries({ queryKey: ["suppliers-for-einvoice"] });
      // Yeni tedarikçiyi seç
      setSelectedSupplierId(newSupplier.id);
      setSupplierMatchStatus('found');
      toast({
        title: "Başarılı",
        description: `Tedarikçi "${supplierData.name}" detaylı bilgilerle oluşturuldu ve seçildi`,
      });
    } catch (error: any) {
      console.error('❌ Error creating supplier:', error);
      toast({
        title: "Hata",
        description: error.message || "Tedarikçi oluşturulurken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSupplier(false);
    }
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
      // Mevcut kullanıcının company_id'sini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (profileError || !userProfile?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }
      // First, check if invoice exists in einvoices table, if not create it
      let einvoiceId = invoice.id;
      const { data: existingInvoice, error: checkError } = await supabase
        .from('einvoices')
        .select('id')
        .eq('id', invoice.id)
        .single();
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }
      if (!existingInvoice) {
        // Create invoice in einvoices table first
        console.log('🔄 Creating invoice in einvoices table...');
        const { data: newInvoice, error: createInvoiceError } = await supabase
          .from('einvoices')
          .insert({
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            supplier_name: invoice.supplier_name,
            supplier_tax_number: invoice.supplier_tax_number,
            invoice_date: invoice.invoice_date,
            due_date: invoice.due_date,
            status: 'pending',
            total_amount: invoice.total_amount,
            paid_amount: 0,
            remaining_amount: invoice.total_amount,
            currency: invoice.currency,
            tax_amount: invoice.tax_total,
            nilvera_id: invoice.id, // Store original Nilvera ID
            xml_data: {
              supplier_details: invoice.supplier_details,
              original_invoice_data: invoice
            },
            company_id: userProfile.company_id
          })
          .select()
          .single();
        if (createInvoiceError) {
          console.error('❌ Error creating invoice:', createInvoiceError);
          throw createInvoiceError;
        }
        einvoiceId = newInvoice.id;
        console.log('✅ Invoice created in einvoices table:', einvoiceId);
      } else {
        console.log('✅ Invoice already exists in einvoices table:', einvoiceId);
      }
      // Aynı fatura numarasıyla kayıtlı fatura var mı kontrol et
      const { data: existingPurchaseInvoice, error: checkInvoiceError } = await supabase
        .from('purchase_invoices')
        .select('id, invoice_number')
        .eq('invoice_number', invoice.invoice_number)
        .eq('company_id', userProfile.company_id)
        .maybeSingle();

      if (checkInvoiceError && checkInvoiceError.code !== 'PGRST116') {
        throw checkInvoiceError;
      }

      if (existingPurchaseInvoice) {
        throw new Error(`Bu fatura numarası (${invoice.invoice_number}) ile daha önce kayıt oluşturulmuş. Lütfen farklı bir fatura seçin veya mevcut faturayı düzenleyin.`);
      }

      // Save matching results to database
      const matchingRecords = matchingItems.map(item => ({
        invoice_id: einvoiceId,
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
        notes: item.notes,
        company_id: userProfile.company_id // RLS için company_id ekle
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
            description: `E-faturadan oluşturulan ürün - Fatura No: ${invoice.invoice_number}`,
            company_id: userProfile.company_id // RLS için company_id ekle
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
        
        // Update matchingItems array with new product ID
        const itemIndex = matchingItems.findIndex(m => m.invoice_item.id === item.invoice_item.id);
        if (itemIndex !== -1) {
          matchingItems[itemIndex].matched_product_id = newProduct.id;
        }
      }
      // Get only valid items for purchase invoice (includes newly created products)
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
          einvoice_id: invoice.id,
          company_id: userProfile.company_id // RLS için company_id ekle
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
        company_id: userProfile.company_id // RLS için company_id ekle
      }));
      const { error: itemsError } = await supabase
        .from('purchase_invoice_items')
        .insert(purchaseInvoiceItems);
      if (itemsError) throw itemsError;

      // Varsayılan depoyu bul (ana depo veya ilk aktif depo)
      const { data: warehouses } = await supabase
        .from('warehouses')
        .select('id, name, warehouse_type')
        .eq('company_id', userProfile.company_id)
        .eq('is_active', true)
        .order('warehouse_type', { ascending: true }) // 'main' önce gelir
        .order('name', { ascending: true })
        .limit(1);

      const defaultWarehouseId = warehouses && warehouses.length > 0 ? warehouses[0].id : null;

      // Stok hareketi ve stok güncellemesi oluştur
      if (defaultWarehouseId && validItems.length > 0) {
        // Transaction numarası oluştur
        const year = new Date().getFullYear();
        const { data: existingTransactions } = await supabase
          .from('inventory_transactions')
          .select('transaction_number')
          .eq('company_id', userProfile.company_id)
          .like('transaction_number', `STG-${year}-%`)
          .order('transaction_number', { ascending: false })
          .limit(1);

        let nextNum = 1;
        if (existingTransactions && existingTransactions.length > 0) {
          const lastNumber = existingTransactions[0].transaction_number;
          const lastNumStr = lastNumber.replace(`STG-${year}-`, '');
          const lastNum = parseInt(lastNumStr, 10);
          if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
          }
        }
        const transactionNumber = `STG-${year}-${String(nextNum).padStart(4, '0')}`;
        
        // Stok girişi transaction'ı oluştur
        const { data: stockTransaction, error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            company_id: userProfile.company_id,
            transaction_number: transactionNumber,
            transaction_type: 'giris',
            status: 'approved', // Alış faturasından gelen stok otomatik onaylı
            warehouse_id: defaultWarehouseId,
            transaction_date: formData.invoice_date || new Date().toISOString().split('T')[0],
            reference_number: purchaseInvoice.invoice_number,
            notes: `Alış faturasından otomatik oluşturuldu - Fatura No: ${purchaseInvoice.invoice_number}`,
            created_by: user.id,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (transactionError) {
          console.error('❌ Error creating stock transaction:', transactionError);
          // Hata olsa bile devam et, sadece logla
        } else if (stockTransaction) {
          // Ürün adlarını products tablosundan çek
          const productIds = validItems
            .map(item => item.matched_product_id)
            .filter(Boolean) as string[];
          
          let productNamesMap: Record<string, string> = {};
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, name')
              .in('id', productIds);
            
            if (products) {
              products.forEach((p: any) => {
                productNamesMap[p.id] = p.name;
              });
            }
          }

          // Transaction items oluştur
          const transactionItems = validItems.map(item => ({
            transaction_id: stockTransaction.id,
            product_id: item.matched_product_id,
            product_name: item.matched_product_id && productNamesMap[item.matched_product_id] 
              ? productNamesMap[item.matched_product_id] 
              : item.invoice_item.product_name, // Eşleştirme yoksa faturadaki adı kullan
            quantity: item.invoice_item.quantity,
            unit: item.invoice_item.unit || 'adet',
            unit_cost: item.invoice_item.unit_price,
            notes: `Ürün: ${item.invoice_item.product_name}`,
          }));

          const { error: transactionItemsError } = await supabase
            .from('inventory_transaction_items')
            .insert(transactionItems);

          if (transactionItemsError) {
            console.error('❌ Error creating transaction items:', transactionItemsError);
          } else {
            // Stok güncellemesi yap
            for (const item of validItems) {
              if (item.matched_product_id) {
                // Mevcut stok kaydını kontrol et
                const { data: existingStock } = await supabase
                  .from('warehouse_stock')
                  .select('id, quantity')
                  .eq('product_id', item.matched_product_id)
                  .eq('warehouse_id', defaultWarehouseId)
                  .eq('company_id', userProfile.company_id)
                  .maybeSingle();

                const quantity = Number(item.invoice_item.quantity) || 0;

                if (existingStock) {
                  // Mevcut stoku güncelle
                  await supabase
                    .from('warehouse_stock')
                    .update({
                      quantity: (existingStock.quantity || 0) + quantity,
                      last_transaction_date: new Date().toISOString(),
                    })
                    .eq('id', existingStock.id);
                } else {
                  // Yeni stok kaydı oluştur
                  await supabase
                    .from('warehouse_stock')
                    .insert({
                      company_id: userProfile.company_id,
                      product_id: item.matched_product_id,
                      warehouse_id: defaultWarehouseId,
                      quantity: quantity,
                      reserved_quantity: 0,
                      last_transaction_date: new Date().toISOString(),
                    });
                }
              }
            }
          }
        }
      }
      
      // İşlenmiş e-fatura ID'leri query'sini invalidate et
      await queryClient.invalidateQueries({ queryKey: ['processed-einvoice-ids'] });
      // Stok hareketleri query'sini invalidate et
      await queryClient.invalidateQueries({ queryKey: ['product-stock-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] });
      // Alış faturaları tablosunu refresh et
      await queryClient.invalidateQueries({ queryKey: ['purchaseInvoices'] });
      await queryClient.invalidateQueries({ queryKey: ['purchase-invoices-infinite'] });
      
      toast({
        title: "Başarılı",
        description: `Alış faturası başarıyla oluşturuldu. ${newProductItems.length} yeni ürün eklendi.${defaultWarehouseId ? ' Stok hareketi oluşturuldu.' : ''}`,
      });
      navigate('/e-invoice');
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

  const getMatchedProduct = useCallback((productId?: string) => {
    return products.find(p => p.id === productId);
  }, [products]);
  
  // Eşleşen tedarikçiyi bul
  const matchedSupplier = useMemo(() => {
    if (!selectedSupplierId || !suppliers.length) return null;
    return suppliers.find(s => s.id === selectedSupplierId);
  }, [selectedSupplierId, suppliers]);
  
  // Memoize hesaplamaları
  const matchedCount = useMemo(() => 
    matchingItems.filter(item => item.matched_product_id).length,
    [matchingItems]
  );
  
  const allMatched = useMemo(() => 
    matchedCount === matchingItems.length && matchingItems.length > 0,
    [matchedCount, matchingItems.length]
  );
  
  const canCreateInvoice = useMemo(() => 
    selectedSupplierId && matchedCount > 0,
    [selectedSupplierId, matchedCount]
  );
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Fatura detayları yükleniyor...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (!invoice) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fatura Yüklenemedi</h3>
              <p className="text-gray-600 mb-4">Fatura detayları yüklenirken hata oluştu</p>
              <Button onClick={() => navigate('/e-invoice')} variant="outline">
                Geri Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <>
      <div className="space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white rounded-lg border border-gray-200 shadow-sm mb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
            {/* Sol taraf - Başlık */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/e-invoice')}
                className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">E-faturalar</span>
              </Button>
              
              <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
                <FileText className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Fatura İşleme
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {invoice.invoice_number} • {invoice.supplier_name}
                </p>
              </div>
            </div>
            
            {/* Sağ taraf - İstatistikler */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline" className="px-3 py-1">
                <Package className="h-3 w-3 mr-1" />
                {invoice.items.length} Kalem
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <DollarSign className="h-3 w-3 mr-1" />
                {formatCurrency(invoice.total_amount, invoice.currency)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Invoice Info */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-gray-300 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b-2 border-gray-300 p-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Fatura & Tedarikçi Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Fatura Bilgileri */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Fatura No:</span>
                    <span className="font-semibold text-xs">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Tarih:</span>
                    <span className="text-xs">{format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: tr })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Kalem:</span>
                    <span className="font-medium text-xs">{invoice.items.length}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">Ara Toplam:</span>
                    <span className="font-medium text-xs">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-xs">KDV:</span>
                    <span className="font-medium text-xs">{formatCurrency(invoice.tax_total, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-gray-700 font-medium text-xs">Toplam:</span>
                    <span className="text-base font-bold text-primary">
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Tedarikçi Bilgileri */}
                <div className={`p-2.5 rounded-lg text-xs transition-all ${
                  supplierMatchStatus === 'found' ? 'bg-green-50 border border-green-200' : 
                  supplierMatchStatus === 'not_found' ? 'bg-orange-50 border border-orange-200' : 
                  'bg-gray-50 border border-gray-200'
                }`}>
                  {/* Faturadan Gelen Tedarikçi Bilgileri */}
                  <div className="mb-2">
                    <div className="font-semibold text-gray-900 text-sm mb-0.5">
                      {invoice?.supplier_name || invoice?.supplier_details?.company_name || 'Tedarikçi Adı Bulunamadı'}
                    </div>
                    <div className="text-gray-600 text-xs">
                      VKN: {invoice?.supplier_tax_number || invoice?.supplier_details?.tax_number || 'Belirtilmemiş'}
                    </div>
                    {invoice.supplier_details?.email && (
                      <div className="text-gray-500 text-xs mt-0.5">📧 {invoice.supplier_details.email}</div>
                    )}
                    {invoice.supplier_details?.phone && (
                      <div className="text-gray-500 text-xs mt-0.5">📞 {invoice.supplier_details.phone}</div>
                    )}
                    {invoice.supplier_details?.address && (
                      <div className="text-gray-500 text-xs mt-0.5">
                        📍 {[
                          invoice.supplier_details.address.street,
                          invoice.supplier_details.address.district,
                          invoice.supplier_details.address.city
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-2" />
                  <div>
                    {supplierMatchStatus === 'searching' && (
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        <span className="text-blue-700 text-xs">Aranıyor...</span>
                      </div>
                    )}
                    {supplierMatchStatus === 'found' && selectedSupplierId && matchedSupplier && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="text-green-700 font-medium text-xs">Sistemde kayıtlı</span>
                        </div>
                        <div className="text-xs text-gray-600 pl-4.5">
                          Eşleşen: {matchedSupplier.name} (VKN: {matchedSupplier.tax_number})
                        </div>
                      </div>
                    )}
                    {supplierMatchStatus === 'not_found' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3 text-orange-600" />
                          <span className="text-orange-700 text-xs font-medium">Kayıtlı değil</span>
                        </div>
                        <Button
                          onClick={handleCreateNewSupplier}
                          disabled={isCreatingSupplier}
                          size="sm"
                          className="w-full h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {isCreatingSupplier ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Ekleniyor...
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Tedarikçi Ekle
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Ek Bilgiler */}
                <div className="space-y-2.5">
                  <div>
                    <Label htmlFor="invoice_date" className="text-xs font-medium mb-1 block">Fatura Tarihi</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-xs font-medium mb-1 block">Notlar</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      placeholder="Fatura ile ilgili notlar..."
                      className="text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Matching */}
          <div className="lg:col-span-3">
            <Card className="border-2 border-gray-300 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 border-b-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    Ürün Eşleştirme
                  </CardTitle>
                  <Badge variant="outline" className="px-3 py-1">
                    {matchedCount} / {matchingItems.length} eşleşti
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Matching Table */}
                <div className="overflow-x-auto">
                  <div className="max-h-[65vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow>
                          <TableHead className="w-12 font-semibold">#</TableHead>
                          <TableHead className="min-w-48 font-semibold">Fatura Kalemi</TableHead>
                          <TableHead className="w-24 text-right font-semibold">Miktar</TableHead>
                          <TableHead className="w-20 text-center font-semibold">Birim</TableHead>
                          <TableHead className="w-28 text-right font-semibold">Birim Fiyat</TableHead>
                          <TableHead className="min-w-64 font-semibold">Eşleşen Ürün</TableHead>
                          <TableHead className="w-32 text-center font-semibold">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matchingItems.map((item, index) => (
                          <MemoizedTableRow
                            key={item.invoice_item.id}
                            item={item}
                            index={index}
                            invoice={invoice}
                            getMatchedProduct={getMatchedProduct}
                            handleProductSelect={handleProductSelect}
                            handleCreateNewProduct={handleCreateNewProduct}
                            handleRemoveMatch={handleRemoveMatch}
                            formatUnit={formatUnit}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Action Buttons */}
        <Card className="border-2 border-gray-300 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                {allMatched ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Tüm ürünler eşleştirildi</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{matchedCount} / {matchingItems.length}</span> ürün eşleştirildi
                    </div>
                    {matchingItems.length - matchedCount > 0 && (
                      <div className="flex items-center gap-1 text-orange-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{matchingItems.length - matchedCount} ürün eksik</span>
                      </div>
                    )}
                  </div>
                )}
                {!selectedSupplierId && (
                  <div className="flex items-center gap-1 text-orange-600 text-sm mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Tedarikçi seçilmedi</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleCreatePurchaseInvoice}
                disabled={!canCreateInvoice || isCreating}
                size="lg"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Alış Faturasını Oluştur
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Compact Product Form Modal */}
      {/* Ürün Detay Dialog */}
      <React.Suspense fallback={<div>Dialog yükleniyor...</div>}>
        {selectedProductForWarehouse && pendingProductIndex >= 0 && (
          <EInvoiceProductDetailsDialog
            open={isWarehouseDialogOpen}
            onOpenChange={setIsWarehouseDialogOpen}
            selectedProduct={selectedProductForWarehouse}
            invoiceItem={matchingItems[pendingProductIndex]?.invoice_item}
            invoiceQuantity={matchingItems[pendingProductIndex]?.invoice_item.quantity}
            invoicePrice={matchingItems[pendingProductIndex]?.invoice_item.unit_price}
            invoiceUnit={matchingItems[pendingProductIndex]?.invoice_item.unit}
            onConfirm={handleProductDetailsConfirm}
          />
        )}
      </React.Suspense>

      <React.Suspense fallback={<div>Modal yükleniyor...</div>}>
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
              unit: matchingItems[currentItemIndex]?.invoice_item.unit || "adet",
              price: matchingItems[currentItemIndex]?.invoice_item.unit_price || 0,
              tax_rate: matchingItems[currentItemIndex]?.invoice_item.tax_rate || 18,
              code: matchingItems[currentItemIndex]?.invoice_item.product_code || "",
            } : undefined
          }
        />
      </React.Suspense>
    </>
  );
}