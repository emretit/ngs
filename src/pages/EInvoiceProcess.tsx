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
// Lazy load heavy components
const ProductSelector = React.lazy(() => import('@/components/proposals/form/ProductSelector'));
const CompactProductForm = React.lazy(() => import('@/components/einvoice/CompactProductForm'));
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

// Memoized Table Row Component
const MemoizedTableRow = React.memo(({ 
  item, 
  index, 
  invoice, 
  getMatchedProduct, 
  handleProductSelect, 
  handleCreateNewProduct, 
  handleRemoveMatch 
}: {
  item: ProductMatchingItem;
  index: number;
  invoice: EInvoiceDetails;
  getMatchedProduct: (productId?: string) => Product | undefined;
  handleProductSelect: (itemIndex: number, product: Product) => void;
  handleCreateNewProduct: (itemIndex: number) => void;
  handleRemoveMatch: (itemIndex: number) => void;
}) => {
  const matchedProduct = getMatchedProduct(item.matched_product_id);
  
  return (
    <TableRow className="hover:bg-gray-50">
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
             <React.Suspense fallback={<div className="text-xs text-gray-500">Yükleniyor...</div>}>
               <ProductSelector
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

  // Loading state'i hesapla
  const isLoading = !invoice || isLoadingProducts || isLoadingSuppliers;
  
  // Fatura detaylarını yükle - useCallback ile optimize et
  const loadInvoiceDetails = useCallback(async () => {
    try {
      console.log('🔄 Loading invoice details for:', invoiceId);
      
      // Şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      // Önce veritabanından kontrol et (veriban_incoming_invoices tablosu)
      const { data: dbInvoice, error: dbError } = await supabase
        .from('veriban_incoming_invoices')
        .select('*')
        .eq('invoice_uuid', invoiceId)
        .eq('company_id', profile.company_id)
        .maybeSingle();
      
      // Veritabanında fatura bulunduysa
      if (dbInvoice && !dbError) {
        console.log('✅ Fatura veritabanından bulundu:', dbInvoice.invoice_number);
        // Veritabanından bulunan fatura için detayları al
        const { data: detailsData, error: detailsError } = await supabase.functions.invoke('nilvera-invoice-details', {
          body: {
            invoiceId: dbInvoice.invoice_uuid,
            envelopeUUID: dbInvoice.invoice_uuid
          }
        });
        
        if (detailsError) throw detailsError;
        if (!detailsData?.success) {
          throw new Error(detailsData?.error || 'Fatura detayları alınamadı');
        }
        
        // Veritabanındaki faturayı kullan
        const invoiceData = {
          id: dbInvoice.invoice_uuid,
          invoiceNumber: dbInvoice.invoice_number,
          supplierName: dbInvoice.customer_title,
          supplierTaxNumber: dbInvoice.customer_register_number,
          invoiceDate: dbInvoice.issue_time || new Date().toISOString(),
          dueDate: null,
          totalAmount: dbInvoice.payable_amount || 0,
          taxAmount: dbInvoice.tax_total_amount || 0,
          currency: dbInvoice.currency_code || 'TRY',
          envelopeUUID: dbInvoice.invoice_uuid
        };
        
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
        
        const supplierDetails = detailsData.invoiceDetails?.supplierInfo || detailsData.invoiceDetails?.companyInfo || {};
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
          items,
          supplier_details: {
            company_name: supplierDetails.companyName || supplierDetails.name || invoiceData.supplierName,
            tax_number: supplierDetails.taxNumber || supplierDetails.vkn || invoiceData.supplierTaxNumber,
            trade_registry_number: supplierDetails.tradeRegistryNumber || supplierDetails.ticaretSicilNo,
            mersis_number: supplierDetails.mersisNumber || supplierDetails.mersisNo,
            email: supplierDetails.email || supplierDetails.eMail,
            phone: supplierDetails.phone || supplierDetails.telefon || supplierDetails.phoneNumber,
            website: supplierDetails.website || supplierDetails.webSite,
            fax: supplierDetails.fax || supplierDetails.faks,
            address: {
              street: supplierDetails.address?.street || supplierDetails.adres?.sokak || supplierDetails.addressLine,
              district: supplierDetails.address?.district || supplierDetails.adres?.ilce || supplierDetails.district,
              city: supplierDetails.address?.city || supplierDetails.adres?.il || supplierDetails.city,
              postal_code: supplierDetails.address?.postal_code || supplierDetails.adres?.postaKodu || supplierDetails.postalCode,
              country: supplierDetails.address?.country || supplierDetails.adres?.ulke || supplierDetails.country || 'Türkiye'
            },
            bank_info: {
              bank_name: supplierDetails.bankInfo?.bankName || supplierDetails.banka?.bankaAdi,
              iban: supplierDetails.bankInfo?.iban || supplierDetails.banka?.iban,
              account_number: supplierDetails.bankInfo?.accountNumber || supplierDetails.banka?.hesapNo
            }
          }
        };
        
        setInvoice(invoiceDetails);
        setFormData({
          invoice_date: invoiceDetails.invoice_date.split('T')[0],
          due_date: invoiceDetails.due_date ? invoiceDetails.due_date.split('T')[0] : '',
          payment_terms: '30 gün',
          notes: `E-faturadan aktarılan alış faturası - Orijinal No: ${invoiceDetails.invoice_number}`,
          project_id: '',
          expense_category_id: ''
        });
        const initialMatching: ProductMatchingItem[] = invoiceDetails.items.map(item => ({
          invoice_item: item
        }));
        setMatchingItems(initialMatching);
        console.log('✅ Invoice details loaded from database:', invoiceDetails);
        return;
      }
      
      // Veritabanında bulunamazsa, API'den dinamik tarih aralığı ile ara
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      console.log('🔍 Searching in API with date range:', sixMonthsAgo.toISOString(), 'to', endDate.toISOString());
      
      const { data: invoicesData, error: invoicesError } = await supabase.functions.invoke('nilvera-incoming-invoices', {
        body: { 
          filters: {
            startDate: sixMonthsAgo.toISOString(),
            endDate: endDate.toISOString()
          }
        }
      });
      if (invoicesError) throw invoicesError;
      const invoiceData = invoicesData?.invoices?.find((inv: any) => inv.id === invoiceId || inv.invoice_uuid === invoiceId);
      if (!invoiceData) {
        toast({
          title: "Fatura Bulunamadı",
          description: `Fatura ID: ${invoiceId} ile eşleşen fatura bulunamadı. Lütfen faturanın son 6 ay içinde olduğundan emin olun.`,
          variant: "destructive",
        });
        throw new Error(`Fatura bulunamadı (ID: ${invoiceId}). Son 6 ay içindeki faturalarda arama yapıldı.`);
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
      // Detaylı tedarikçi bilgilerini çıkar
      const supplierDetails = detailsData.invoiceDetails?.supplierInfo || detailsData.invoiceDetails?.companyInfo || {};
      console.log('🔍 Raw supplier details from API:', supplierDetails);
      console.log('🔍 Full invoice details:', detailsData.invoiceDetails);
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
        items,
        supplier_details: {
          company_name: supplierDetails.companyName || supplierDetails.name || invoiceData.supplierName,
          tax_number: supplierDetails.taxNumber || supplierDetails.vkn || invoiceData.supplierTaxNumber,
          trade_registry_number: supplierDetails.tradeRegistryNumber || supplierDetails.ticaretSicilNo,
          mersis_number: supplierDetails.mersisNumber || supplierDetails.mersisNo,
          email: supplierDetails.email || supplierDetails.eMail,
          phone: supplierDetails.phone || supplierDetails.telefon || supplierDetails.phoneNumber,
          website: supplierDetails.website || supplierDetails.webSite,
          fax: supplierDetails.fax || supplierDetails.faks,
          address: {
            street: supplierDetails.address?.street || supplierDetails.adres?.sokak || supplierDetails.addressLine,
            district: supplierDetails.address?.district || supplierDetails.adres?.ilce || supplierDetails.district,
            city: supplierDetails.address?.city || supplierDetails.adres?.il || supplierDetails.city,
            postal_code: supplierDetails.address?.postal_code || supplierDetails.adres?.postaKodu || supplierDetails.postalCode,
            country: supplierDetails.address?.country || supplierDetails.adres?.ulke || supplierDetails.country || 'Türkiye'
          },
          bank_info: {
            bank_name: supplierDetails.bankInfo?.bankName || supplierDetails.banka?.bankaAdi,
            iban: supplierDetails.bankInfo?.iban || supplierDetails.banka?.iban,
            account_number: supplierDetails.bankInfo?.accountNumber || supplierDetails.banka?.hesapNo
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

  // Fatura detaylarını yükle - useEffect
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
        navigate('/purchasing/invoices');
      });
    }
  }, [invoiceId, loadInvoiceDetails, navigate, toast]);

  // Tedarikçi eşleştirmesi için useEffect
  useEffect(() => {
    if (invoice && suppliers.length > 0) {
      matchSupplier();
    }
  }, [invoice, suppliers, matchSupplier]);

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
    handleManualMatch(itemIndex, product.id);
  }, [handleManualMatch]);
  
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
  const getMatchedProduct = useCallback((productId?: string) => {
    return products.find(p => p.id === productId);
  }, [products]);
  
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
  if (!invoice) {
    return (
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
  );
  }
  return (
    <>
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
              <CardContent className="p-4">
                {/* Kompakt Fatura Bilgileri */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Fatura No:</span>
                    <span className="font-semibold text-sm">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Tarih:</span>
                    <span className="text-sm">
                      {format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: tr })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Kalem:</span>
                    <span className="text-sm font-medium">{invoice.items.length}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-500">Toplam:</span>
                    <span className="text-lg font-bold text-primary">
                      {invoice.total_amount.toFixed(2)} {invoice.currency}
                    </span>
                  </div>
                </div>
                {/* Tedarikçi Bilgileri ve Durumu */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tedarikçi</Label>
                    <div className={`mt-1 p-3 rounded text-sm ${
                      supplierMatchStatus === 'found' ? 'bg-green-50 border border-green-200' : 
                      supplierMatchStatus === 'not_found' ? 'bg-orange-50 border border-orange-200' : 
                      'bg-gray-50 border border-gray-200'
                    }`}>
                      {/* Tedarikçi Bilgileri */}
                      <div className="mb-3">
                        <div className="font-medium text-gray-900">{invoice.supplier_name}</div>
                        <div className="text-gray-600 text-xs mt-1">VKN: {invoice.supplier_tax_number}</div>
                        {invoice.supplier_details?.email && (
                          <div className="text-gray-500 text-xs mt-1">📧 {invoice.supplier_details.email}</div>
                        )}
                        {invoice.supplier_details?.phone && (
                          <div className="text-gray-500 text-xs mt-1">📞 {invoice.supplier_details.phone}</div>
                        )}
                      </div>
                      {/* Durum ve İşlemler */}
                      <div className="pt-2 border-t border-gray-200">
                        {supplierMatchStatus === 'searching' && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-blue-700 text-sm">Tedarikçi aranıyor...</span>
                          </div>
                        )}
                        {supplierMatchStatus === 'found' && selectedSupplierId && (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-700 font-medium text-sm">✅ Sistemimizde kayıtlı</span>
                          </div>
                        )}
                        {supplierMatchStatus === 'not_found' && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-orange-700 text-sm font-medium">⚠️ Sistemimizde kayıtlı değil</span>
                            </div>
                            <Button
                              onClick={handleCreateNewSupplier}
                              disabled={isCreatingSupplier}
                              size="sm"
                              className="bg-orange-600 hover:bg-orange-700 text-white text-xs"
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
                  </div>
                </div>
                {/* Fatura Tarihi ve Notlar */}
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <Label htmlFor="invoice_date" className="text-sm font-medium">Fatura Tarihi</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-sm font-medium">Notlar</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      placeholder="Fatura ile ilgili notlar..."
                      className="mt-1 text-sm"
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
                        />
                      ))}
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
              unit: matchingItems[currentItemIndex]?.invoice_item.unit || "Adet",
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