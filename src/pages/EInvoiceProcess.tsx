import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTabs } from '@/components/tabs/TabContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/ui/back-button';
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
import { toast } from 'sonner';
import { formatUnit } from '@/utils/unitConstants';
import { formatCurrency } from '@/utils/formatters';
import { ModernCategorySelect } from '@/components/budget/ModernCategorySelect';
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
import { IntegratorService } from "@/services/integratorService";
import { VeribanService } from "@/services/veribanService";

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
    <TableRow className="hover:bg-gray-50/50 transition-colors border-gray-100">
      <TableCell className="font-medium text-[10px] px-2 py-2">
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-600">
          {item.invoice_item.line_number}
        </div>
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="min-w-80 max-w-none">
          <p className="font-medium text-gray-900 text-xs mb-1 break-words">
            {item.invoice_item.product_name}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-right px-2 py-2">
        <div className="font-mono text-xs font-semibold text-gray-700">
          {item.invoice_item.quantity.toFixed(2)}
        </div>
      </TableCell>
      <TableCell className="text-center px-2 py-2">
        <div className="text-[10px] font-medium text-gray-600">
          {formatUnit(item.invoice_item.unit)}
        </div>
      </TableCell>
      <TableCell className="text-right text-xs font-medium px-2 py-2">
        {formatCurrency(item.invoice_item.unit_price, invoice.currency)}
      </TableCell>
      <TableCell className="px-3 py-2">
        <div className="space-y-1">
          {matchedProduct ? (
            <div className="p-1.5 bg-gradient-to-r from-green-50 to-green-100/50 border border-green-200 rounded-md shadow-sm">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <p className="font-semibold text-green-900 text-xs truncate">
                      {matchedProduct.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px] text-green-700">
                    {matchedProduct.sku && (
                      <span className="px-1.5 py-0.5 bg-green-200/50 rounded text-[10px]">SKU: {matchedProduct.sku}</span>
                    )}
                    <span>{formatCurrency(matchedProduct.price, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <React.Suspense fallback={<div className="text-[10px] text-gray-500 p-1">Yükleniyor...</div>}>
               <EInvoiceProductSelector
                 value=""
                 onChange={() => {}}
                 onProductSelect={(product) => handleProductSelect(index, product)}
                 onNewProduct={() => handleCreateNewProduct(index)}
                 placeholder="Ürün ara..."
                 className="text-xs"
               />
             </React.Suspense>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center px-2 py-2">
        {item.matched_product_id && (
          <Button
            onClick={() => handleRemoveMatch(index)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
});
export default function EInvoiceProcess() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateTabTitle } = useTabs();
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

  // Kullanıcının company_id'sini al
  const { data: userCompanyId } = useQuery({
    queryKey: ['user-company-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return profile?.company_id;
    },
    staleTime: Infinity, // Company ID değişmez
  });

  // React Query ile tedarikçileri yükle - company_id filtresi ile
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers-for-einvoice', userCompanyId],
    queryFn: async () => {
      if (!userCompanyId) return [];
      
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name, tax_number, email, company_id')
        .eq('status', 'aktif')
        .eq('company_id', userCompanyId) // Sadece kullanıcının şirketinin tedarikçileri
        .order('name')
        .limit(500);
      if (suppliersError) throw suppliersError;
      return suppliersData || [];
    },
    enabled: !!userCompanyId, // company_id yoksa sorguyu çalıştırma
    staleTime: 10 * 60 * 1000, // 10 dakika cache
    gcTime: 20 * 60 * 1000, // 20 dakika cache'de tut
    refetchOnWindowFocus: false,
  });

  // Load invoice details - MUST be defined before the useEffect that uses it
  const loadInvoiceDetails = useCallback(async () => {
    try {
      // Önce integrator'ü kontrol et
      const integrator = await IntegratorService.getSelectedIntegrator();
      console.log('🔄 Loading invoice details from', integrator, 'API for:', invoiceId);

      let apiInvoiceDetails: any;

      if (integrator === 'veriban') {
        // Veriban API çağrısı
        const result = await VeribanService.getInvoiceDetails({
          invoiceUUID: invoiceId!
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Veriban fatura detayları alınamadı');
        }

        console.log('✅ Veriban API Response:', result.data);
        apiInvoiceDetails = result.data;
      } else {
        // Nilvera API çağrısı (varsayılan)
        const { data: detailsData, error: detailsError } = await supabase.functions.invoke('nilvera-invoice-details', {
          body: {
            invoiceId: invoiceId,
            envelopeUUID: invoiceId
          }
        });

        if (detailsError) throw detailsError;
        if (!detailsData?.success) {
          throw new Error(detailsData?.error || 'Nilvera fatura detayları alınamadı');
        }

        console.log('✅ Nilvera API Response detailsData:', detailsData);
        apiInvoiceDetails = detailsData.invoiceDetails;
      }

      // ========================================
      // 🔍 FULL API RESPONSE DEBUG
      // ========================================
      console.log('\n' + '='.repeat(80));
      console.log('🔍 FULL API RESPONSE FROM VERIBAN');
      console.log('='.repeat(80));
      console.log('🔍 Full invoice details:', apiInvoiceDetails);
      console.log('🔍 Available keys:', apiInvoiceDetails ? Object.keys(apiInvoiceDetails) : 'null');
      console.log('='.repeat(80) + '\n');
      
      // ========================================
      // 📄 RAW XML (İLK 2000 KARAKTER)
      // ========================================
      if (apiInvoiceDetails?.rawXml) {
        console.log('\n' + '📄'.repeat(40));
        console.log('📄 RAW XML CONTENT (First 2000 chars):');
        console.log('📄'.repeat(40));
        console.log(apiInvoiceDetails.rawXml.substring(0, 2000));
        console.log('...');
        console.log('📄'.repeat(40) + '\n');
      }
      
      // ========================================
      // 📦 ITEMS KONTROLÜ
      // ========================================
      console.log('\n' + '📦'.repeat(40));
      console.log('📦 ITEMS FROM API:');
      console.log('📦'.repeat(40));
      console.log('📦 Raw items from API:', apiInvoiceDetails?.items);
      console.log('📦 Items count:', apiInvoiceDetails?.items?.length || 0);
      if (apiInvoiceDetails?.items && apiInvoiceDetails.items.length > 0) {
        console.log('📦 First raw item:', apiInvoiceDetails.items[0]);
        console.log('📦 All items:');
        apiInvoiceDetails.items.forEach((item: any, idx: number) => {
          console.log(`  📦 Item ${idx + 1}:`, item);
        });
      } else {
        console.warn('⚠️ NO ITEMS FOUND IN API RESPONSE!');
      }
      console.log('📦'.repeat(40) + '\n');

      // ========================================
      // 🔄 MAPPING ITEMS
      // ========================================
      console.log('\n' + '🔄'.repeat(40));
      console.log('🔄 MAPPING ITEMS TO FRONTEND FORMAT:');
      console.log('🔄'.repeat(40));
      
      const items: EInvoiceItem[] = apiInvoiceDetails?.items?.map((item: any, index: number) => {
        console.log(`\n🔄 Mapping item ${index + 1}/${apiInvoiceDetails.items.length}:`);
        console.log('  📥 Raw item:', item);
        
        const mappedItem = {
          id: item.id || `item-${index}`,
          line_number: item.lineNumber || item.line_number || index + 1,
          product_name: item.description || item.product_name || 'Açıklama yok',
          product_code: item.productCode || item.product_code,
          quantity: item.quantity || 1,
          unit: item.unit || 'adet',
          unit_price: item.unitPrice || item.unit_price || 0,
          tax_rate: item.vatRate || item.taxRate || item.tax_rate || 18,
          discount_rate: item.discountRate || item.discount_rate || 0,
          line_total: item.totalAmount || item.line_total || 0,
          tax_amount: item.vatAmount || item.taxAmount || item.tax_amount || 0,
          gtip_code: item.gtipCode || item.gtip_code,
          description: item.description
        };
        
        console.log('  📤 Mapped item:', mappedItem);
        console.log('  ✅ Mapping complete!\n');
        
        return mappedItem;
      }) || [];
      
      console.log('🔄'.repeat(40));
      console.log('✅ Final items array:', items);
      console.log('✅ Final items count:', items.length);
      console.log('🔄'.repeat(40) + '\n');

      // Detaylı tedarikçi bilgilerini çıkar - önce supplierInfo'dan, sonra fallback'ler
      const supplierInfo = apiInvoiceDetails?.supplierInfo || {};
      const accountingSupplierParty = apiInvoiceDetails?.AccountingSupplierParty || {};
      
      console.log('🔍 Raw supplierInfo from API:', supplierInfo);
      console.log('🔍 AccountingSupplierParty from API:', accountingSupplierParty);
      console.log('🔍 apiInvoiceDetails keys:', apiInvoiceDetails ? Object.keys(apiInvoiceDetails) : 'null');

      // Tedarikçi adı için önce supplierInfo'dan, sonra fallback'ler
      const supplierName =
        supplierInfo?.companyName ||
        apiInvoiceDetails?.supplierName || // Veriban
        apiInvoiceDetails?.SenderName ||
        accountingSupplierParty?.Party?.PartyName?.Name ||
        accountingSupplierParty?.PartyName?.Name ||
        'Tedarikçi';

      // Tedarikçi VKN için önce supplierInfo'dan, sonra fallback'ler
      const supplierTaxNumber =
        supplierInfo?.taxNumber ||
        apiInvoiceDetails?.supplierTaxNumber || // Veriban
        apiInvoiceDetails?.SenderTaxNumber ||
        apiInvoiceDetails?.SenderIdentifier ||
        apiInvoiceDetails?.TaxNumber ||
        accountingSupplierParty?.Party?.PartyIdentification?.ID ||
        accountingSupplierParty?.PartyIdentification?.ID ||
        accountingSupplierParty?.Party?.PartyTaxScheme?.TaxScheme?.ID ||
        '';

      console.log('✅ Extracted supplier info:', { supplierName, supplierTaxNumber });

      // Fatura tutar bilgilerini doğru alanlardan çek
      // Edge function'da hesaplanmış değerler kullanılıyor
      const subtotal = parseFloat(
        apiInvoiceDetails?.lineExtensionTotal || // Veriban yeni field
        apiInvoiceDetails?.TaxExclusiveAmount || 
        apiInvoiceDetails?.taxExclusiveAmount || 
        '0'
      );
      const taxTotal = parseFloat(
        apiInvoiceDetails?.taxTotalAmount || // Veriban yeni field
        apiInvoiceDetails?.TaxTotalAmount || 
        '0'
      );
      const totalAmount = parseFloat(
        apiInvoiceDetails?.payableAmount || // Veriban yeni field
        apiInvoiceDetails?.PayableAmount || 
        apiInvoiceDetails?.TotalAmount || 
        apiInvoiceDetails?.totalAmount || 
        '0'
      );
      
      console.log('💰 Invoice amounts:', { subtotal, taxTotal, totalAmount });

      // Fatura tarihini doğru şekilde parse et
      // Veriban'dan gelen tarih invoiceDate olarak gelir, Nilvera'dan IssueDate olarak gelir
      // Integrator'a göre öncelik ver
      let rawInvoiceDate: string | null = null;
      if (integrator === 'veriban') {
        // Veriban için önce invoiceDate kontrol et
        rawInvoiceDate = apiInvoiceDetails?.invoiceDate || 
                        apiInvoiceDetails?.InvoiceDate || 
                        null;
        console.log('📅 Veriban invoiceDate:', rawInvoiceDate);
      } else {
        // Nilvera için IssueDate kontrol et
        rawInvoiceDate = apiInvoiceDetails?.IssueDate || 
                        apiInvoiceDetails?.issueDate || 
                        apiInvoiceDetails?.InvoiceDate || 
                        null;
        console.log('📅 Nilvera IssueDate:', rawInvoiceDate);
      }
      
      // Fallback: Eğer integrator'a göre bulunamadıysa, tüm alanları kontrol et
      if (!rawInvoiceDate) {
        rawInvoiceDate = apiInvoiceDetails?.invoiceDate || 
                        apiInvoiceDetails?.InvoiceDate || 
                        apiInvoiceDetails?.IssueDate || 
                        apiInvoiceDetails?.issueDate || 
                        null;
        console.log('📅 Fallback invoiceDate:', rawInvoiceDate);
      }
      
      // Tarih formatını normalize et
      let normalizedInvoiceDate: string;
      if (rawInvoiceDate) {
        console.log('📅 Raw invoice date value:', rawInvoiceDate, 'Type:', typeof rawInvoiceDate);
        // Eğer tarih zaten ISO formatındaysa (örn: "2024-01-15T00:00:00Z")
        if (rawInvoiceDate.includes('T')) {
          normalizedInvoiceDate = rawInvoiceDate;
          console.log('📅 Date is ISO format, using as-is');
        } 
        // Eğer tarih sadece tarih formatındaysa (örn: "2024-01-15")
        else if (/^\d{4}-\d{2}-\d{2}$/.test(rawInvoiceDate)) {
          normalizedInvoiceDate = `${rawInvoiceDate}T00:00:00Z`;
          console.log('📅 Date is YYYY-MM-DD format, converting to ISO');
        }
        // Diğer formatlar için Date objesi kullan
        else {
          const parsedDate = new Date(rawInvoiceDate);
          if (!isNaN(parsedDate.getTime())) {
            normalizedInvoiceDate = parsedDate.toISOString();
            console.log('📅 Date parsed successfully:', normalizedInvoiceDate);
          } else {
            console.warn('⚠️ Invalid date format, using current date as fallback');
            normalizedInvoiceDate = new Date().toISOString();
          }
        }
        console.log('✅ Normalized invoice date:', normalizedInvoiceDate);
      } else {
        console.warn('⚠️ No invoice date found in API response! Available keys:', Object.keys(apiInvoiceDetails || {}));
        console.warn('⚠️ Using current date as fallback');
        normalizedInvoiceDate = new Date().toISOString();
      }

      // Vade tarihini de aynı şekilde parse et
      let rawDueDate: string | null = null;
      if (integrator === 'veriban') {
        rawDueDate = apiInvoiceDetails?.dueDate || 
                    apiInvoiceDetails?.DueDate || 
                    null;
      } else {
        rawDueDate = apiInvoiceDetails?.DueDate || 
                    apiInvoiceDetails?.dueDate || 
                    null;
      }
      
      let normalizedDueDate: string | null = null;
      if (rawDueDate) {
        console.log('📅 Raw due date value:', rawDueDate);
        if (rawDueDate.includes('T')) {
          normalizedDueDate = rawDueDate;
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDueDate)) {
          normalizedDueDate = `${rawDueDate}T00:00:00Z`;
        } else {
          const parsedDate = new Date(rawDueDate);
          if (!isNaN(parsedDate.getTime())) {
            normalizedDueDate = parsedDate.toISOString();
          }
        }
        console.log('✅ Normalized due date:', normalizedDueDate);
      } else {
        console.log('ℹ️ No due date found in API response');
      }

      const invoiceDetails: EInvoiceDetails = {
        id: invoiceId,
        invoice_number: apiInvoiceDetails?.InvoiceNumber || apiInvoiceDetails?.invoiceNumber || apiInvoiceDetails?.ID || invoiceId,
        supplier_name: supplierName,
        supplier_tax_number: supplierTaxNumber,
        invoice_date: normalizedInvoiceDate,
        due_date: normalizedDueDate,
        currency: apiInvoiceDetails?.CurrencyCode || apiInvoiceDetails?.currency || 'TRY',
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
      // Set default form values - tarihi doğru formatta al
      const invoiceDateForForm = normalizedInvoiceDate.includes('T') 
        ? normalizedInvoiceDate.split('T')[0] 
        : normalizedInvoiceDate.substring(0, 10);
      const dueDateForForm = normalizedDueDate 
        ? (normalizedDueDate.includes('T') ? normalizedDueDate.split('T')[0] : normalizedDueDate.substring(0, 10))
        : '';
      setFormData({
        invoice_date: invoiceDateForForm,
        due_date: dueDateForForm,
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
        toast.error(error.message || "Fatura detayları yüklenirken bir hata oluştu");
        // Hata durumunda geri dön
        navigate('/e-invoice');
      });
    }
  }, [invoiceId, loadInvoiceDetails, navigate, toast]);
  
  // Update tab title when invoice is loaded
  useEffect(() => {
    if (invoice?.invoice_number) {
      updateTabTitle(location.pathname, invoice.invoice_number);
    }
  }, [invoice?.invoice_number, location.pathname, updateTabTitle]);

  // Tedarikçi eşleştirmesi için ayrı fonksiyon - useCallback ile optimize et
  const matchSupplier = useCallback(async () => {
    if (!invoice) {
      console.log('⚠️ Invoice yok, tedarikçi araması yapılamıyor');
      return;
    }
    
    if (!suppliers.length) {
      console.log('⚠️ Tedarikçi listesi boş, not_found olarak işaretleniyor');
      setSupplierMatchStatus('not_found');
      return;
    }
    
    setSupplierMatchStatus('searching');
    console.log('🔍 Tedarikçi aranıyor. VKN:', invoice.supplier_tax_number, 'Toplam tedarikçi:', suppliers.length);
    
    const matchingSupplier = suppliers.find(s => 
      s.tax_number === invoice.supplier_tax_number
    );
    
    if (matchingSupplier) {
      setSelectedSupplierId(matchingSupplier.id);
      setSupplierMatchStatus('found');
      console.log('✅ Tedarikçi otomatik eşleştirildi:', matchingSupplier.name, 'VKN:', matchingSupplier.tax_number);
    } else {
      setSupplierMatchStatus('not_found');
      console.log('⚠️ VKN eşleşmedi. Aranan VKN:', invoice.supplier_tax_number);
      console.log('📋 Sistemdeki tedarikçi VKN\'leri:', suppliers.map(s => s.tax_number).join(', '));
    }
  }, [invoice, suppliers]);

  // Tedarikçi eşleştirmesi için useEffect
  useEffect(() => {
    if (invoice && suppliers.length > 0) {
      matchSupplier();
    } else if (invoice && !isLoadingSuppliers && suppliers.length === 0) {
      // Tedarikçi listesi yüklendi ama boş - not_found olarak işaretle
      console.log('⚠️ Tedarikçi listesi boş, not_found durumu');
      setSupplierMatchStatus('not_found');
    }
  }, [invoice, suppliers, matchSupplier, isLoadingSuppliers]);
  
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
    toast.success("Ürün oluşturuldu ve eşleştirildi");
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
      toast.success(`Tedarikçi "${supplierData.name}" detaylı bilgilerle oluşturuldu ve seçildi`);
    } catch (error: any) {
      console.error('❌ Error creating supplier:', error);
      toast.error(error.message || "Tedarikçi oluşturulurken hata oluştu");
    } finally {
      setIsCreatingSupplier(false);
    }
  };
  const handleCreatePurchaseInvoice = async () => {
    if (!invoice || matchingItems.length === 0) {
      toast.error("Lütfen ürün eşleştirmelerini tamamlayın");
      return;
    }
    
    // Tedarikçi yoksa önce oluştur
    if (!selectedSupplierId) {
      toast.error("Lütfen önce tedarikçi oluşturun veya seçin");
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
      // Önce mevcut kayıtları kontrol et ve güncelle/ekle
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
      
      // Her bir kayıt için UPSERT yap (composite unique key için)
      for (const record of matchingRecords) {
        // Önce mevcut kaydı kontrol et
        const { data: existing } = await supabase
          .from('e_fatura_stok_eslestirme')
          .select('id')
          .eq('invoice_id', record.invoice_id)
          .eq('invoice_line_id', record.invoice_line_id)
          .maybeSingle(); // .single() yerine .maybeSingle() kullan (kayıt olmayabilir)
        
        if (existing) {
          // Kayıt varsa güncelle
          const { error: updateError } = await supabase
            .from('e_fatura_stok_eslestirme')
            .update({
              invoice_product_name: record.invoice_product_name,
              invoice_product_code: record.invoice_product_code,
              invoice_quantity: record.invoice_quantity,
              invoice_unit: record.invoice_unit,
              invoice_unit_price: record.invoice_unit_price,
              invoice_total_amount: record.invoice_total_amount,
              invoice_tax_rate: record.invoice_tax_rate,
              matched_stock_id: record.matched_stock_id,
              match_type: record.match_type,
              match_confidence: record.match_confidence,
              is_confirmed: record.is_confirmed,
              notes: record.notes,
            })
            .eq('invoice_id', record.invoice_id)
            .eq('invoice_line_id', record.invoice_line_id);
          
          if (updateError) throw updateError;
        } else {
          // Kayıt yoksa ekle
          const { error: insertError } = await supabase
            .from('e_fatura_stok_eslestirme')
            .insert(record);
          
          if (insertError) throw insertError;
        }
      }
      
      // Get only valid items for purchase invoice (must have matched_product_id)
      // Kullanıcı satırda zaten ürün eşleştirmesi yapıyor, burada tekrar ürün oluşturmaya gerek yok
      const validItems = matchingItems.filter(item => 
        item.matched_product_id
      );
      
      // Eğer eşleşmemiş item'lar varsa uyarı ver
      const unmatchedItems = matchingItems.filter(item => !item.matched_product_id);
      if (unmatchedItems.length > 0) {
        const unmatchedNames = unmatchedItems.map(item => item.invoice_item.product_name).join(', ');
        toast.warning(`${unmatchedItems.length} kalem için ürün eşleştirmesi yapılmamış. Bu kalemler faturaya eklenmeyecek: ${unmatchedNames}`);
      }
      
      if (validItems.length === 0) {
        throw new Error('Faturaya eklenecek ürün bulunamadı. Lütfen en az bir kalem için ürün eşleştirmesi yapın.');
      }
      const subtotal = validItems.reduce((sum, item) => 
        sum + (item.invoice_item.line_total - (item.invoice_item.line_total * item.invoice_item.tax_rate / 100)), 0
      );
      const taxTotal = validItems.reduce((sum, item) => 
        sum + (item.invoice_item.line_total * item.invoice_item.tax_rate / 100), 0
      );
      const total = subtotal + taxTotal;
      
      // Category ID: Artık hem kategori hem alt kategori ID'sini direkt kabul ediyor
      // Migration ile database constraint'i güncellendi
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
          category_id: formData.expense_category_id || null, // Alt kategori ID'si direkt kullanılıyor
          einvoice_id: invoice.id,
          company_id: userProfile.company_id // RLS için company_id ekle
        })
        .select()
        .single();
      if (invoiceError) throw invoiceError;
      
      // Tedarikçi bakiyesini güncelle (alış faturası = tedarikçiye borçlanma = bakiye azalır/negatif yönde artar)
      // Pozitif bakiye = alacak, Negatif bakiye = borç
      const { data: supplierData, error: supplierFetchError } = await supabase
        .from('suppliers')
        .select('balance')
        .eq('id', selectedSupplierId)
        .single();
      
      if (supplierFetchError) {
        console.error('❌ Error fetching supplier balance:', supplierFetchError);
        // Hata olsa bile devam et, sadece logla
      } else if (supplierData) {
        const newSupplierBalance = (supplierData.balance || 0) - total;
        const { error: supplierUpdateError } = await supabase
          .from('suppliers')
          .update({ balance: newSupplierBalance })
          .eq('id', selectedSupplierId);
        
        if (supplierUpdateError) {
          console.error('❌ Error updating supplier balance:', supplierUpdateError);
          // Hata olsa bile devam et, sadece logla
        } else {
          console.log('✅ Supplier balance updated:', newSupplierBalance);
        }
      }
      
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
      // Tedarikçi cache'ini invalidate et (bakiye güncellendiği için)
      await queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      await queryClient.invalidateQueries({ queryKey: ['supplier', selectedSupplierId] });
      await queryClient.invalidateQueries({ queryKey: ['supplier_statistics'] });
      
      toast.success(`Alış faturası başarıyla oluşturuldu.${defaultWarehouseId ? ' Stok hareketi oluşturuldu.' : ''}`);
      navigate('/e-invoice');
    } catch (error: any) {
      console.error('❌ Error creating purchase invoice:', error);
      toast.error(error.message || "Alış faturası oluşturulurken hata oluştu");
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
      <div className="space-y-2">
        {/* Enhanced Sticky Header */}
        <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
          <div className="flex items-center justify-between p-3 pl-12">
            <div className="flex items-center gap-3">
              {/* Simple Back Button */}
              <BackButton 
                onClick={() => navigate("/e-invoice")}
                variant="ghost"
                size="sm"
              >
                E-faturalar
              </BackButton>
              
              {/* Simple Title Section with Icon */}
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Fatura İşleme
                  </h1>
                  <p className="text-xs text-muted-foreground/70">
                    {invoice.invoice_number || 'Henüz atanmadı'} • {invoice.supplier_name || 'Tedarikçi'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
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
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Invoice Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Fatura & Tedarikçi Bilgileri */}
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
                    <span className={`font-semibold text-xs ${invoice.invoice_number ? 'text-blue-600' : 'text-gray-400'}`}>
                      {invoice.invoice_number || 'Henüz atanmadı'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Tarih:</span>
                    <span className="text-xs">{format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale: tr })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Kalem:</span>
                    <span className="font-medium text-xs">{invoice.items.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Para Birimi:</span>
                    <span className="text-xs font-medium">{invoice.currency === 'TL' ? 'TRY' : (invoice.currency || 'TRY')}</span>
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

                <Separator className="my-2" />

                <Separator />

                {/* Tedarikçi Bilgileri */}
                <div className={`p-2.5 rounded-lg text-xs transition-all ${
                  supplierMatchStatus === 'found' ? 'bg-green-50 border border-green-200' : 
                  supplierMatchStatus === 'not_found' ? 'bg-orange-50 border border-orange-200' : 
                  'bg-gray-50 border border-gray-200'
                }`}>
                  {/* Faturadan Gelen Tedarikçi Bilgileri */}
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 className="h-3 w-3 text-green-600" />
                      <span className="text-green-700 font-medium text-xs">Tedarikçi Bilgileri</span>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm mb-0.5">
                      {invoice?.supplier_name || invoice?.supplier_details?.company_name || 'Tedarikçi Adı Bulunamadı'}
                    </div>
                    {invoice?.supplier_tax_number && (
                      <div className="text-gray-500 text-xs mt-0.5">
                        VKN: {invoice.supplier_tax_number || invoice?.supplier_details?.tax_number || 'Belirtilmemiş'}
                      </div>
                    )}
                    {(invoice.supplier_details?.email || invoice.supplier_details?.phone || invoice.supplier_details?.address) && (
                      <details className="mt-1">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Detaylar</summary>
                        <div className="mt-1 space-y-0.5 pl-2">
                          {invoice.supplier_details?.email && (
                            <div className="text-gray-500 text-xs">📧 {invoice.supplier_details.email}</div>
                          )}
                          {invoice.supplier_details?.phone && (
                            <div className="text-gray-500 text-xs">📞 {invoice.supplier_details.phone}</div>
                          )}
                          {invoice.supplier_details?.address && (
                            <div className="text-gray-500 text-xs">
                              📍 {[
                                invoice.supplier_details.address.street,
                                invoice.supplier_details.address.district,
                                invoice.supplier_details.address.city
                              ].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                  
                  <Separator className="my-1.5" />
                  
                  {/* Tedarikçi Durum ve Seçim Bölümü */}
                  <div className="space-y-1.5">
                    {/* Durum Göstergesi */}
                    {(supplierMatchStatus === 'searching' || supplierMatchStatus === null || isLoadingSuppliers) && (
                      <div className="flex items-center gap-1 p-1.5 bg-blue-50 rounded border border-blue-200">
                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        <span className="text-blue-700 text-xs">Tedarikçi aranıyor...</span>
                      </div>
                    )}
                    
                    {/* Tedarikçi Bulundu */}
                    {supplierMatchStatus === 'found' && selectedSupplierId && matchedSupplier && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 p-1.5 bg-green-50 rounded border border-green-200">
                          <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-green-700 font-medium text-xs">VKN ile otomatik eşleşti</div>
                            <div className="text-xs text-gray-600 truncate">
                              {matchedSupplier.name}
                            </div>
                          </div>
                        </div>
                        
                        {/* Farklı tedarikçi seçme opsiyonu */}
                        <div className="space-y-0.5">
                          <Label htmlFor="change_supplier" className="text-xs font-medium text-gray-600">
                            Farklı tedarikçi seç
                          </Label>
                          <Select
                            value={selectedSupplierId || ''}
                            onValueChange={(value) => {
                              setSelectedSupplierId(value);
                              if (value) {
                                setSupplierMatchStatus('found');
                              }
                            }}
                          >
                            <SelectTrigger id="change_supplier" className="h-7 text-xs">
                              <SelectValue placeholder="Tedarikçi seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map((supplier) => (
                                <SelectItem key={supplier.id} value={supplier.id} className="text-xs">
                                  {supplier.name} {supplier.tax_number ? `(VKN: ${supplier.tax_number})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    
                    {/* Tedarikçi Bulunamadı - VKN ile eşleşmedi */}
                    {supplierMatchStatus === 'not_found' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 p-1.5 bg-orange-50 rounded border border-orange-200">
                          <AlertCircle className="h-3 w-3 text-orange-600" />
                          <span className="text-orange-700 text-xs font-medium">
                            Bu VKN sistemde kayıtlı değil
                          </span>
                        </div>
                        
                        {/* Önce manuel seçim opsiyonu sun */}
                        {suppliers.length > 0 && (
                          <>
                            <div className="space-y-0.5">
                              <Label htmlFor="manual_supplier" className="text-xs font-medium">
                                Mevcut tedarikçilerden seç
                              </Label>
                              <Select
                                value={selectedSupplierId || ''}
                                onValueChange={(value) => {
                                  setSelectedSupplierId(value);
                                  if (value) {
                                    setSupplierMatchStatus('found');
                                  }
                                }}
                              >
                                <SelectTrigger id="manual_supplier" className="h-7 text-xs">
                                  <SelectValue placeholder="Tedarikçi seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id} className="text-xs">
                                      {supplier.name} {supplier.tax_number ? `(VKN: ${supplier.tax_number})` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Ayraç */}
                            <div className="flex items-center gap-1.5">
                              <Separator className="flex-1" />
                              <span className="text-xs text-gray-500">veya</span>
                              <Separator className="flex-1" />
                            </div>
                          </>
                        )}
                        
                        {/* Yeni Tedarikçi Ekle Butonu */}
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
                              Yeni Tedarikçi Ekle
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Ek Bilgiler */}
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="invoice_date" className="text-xs font-medium mb-0.5 block">Fatura Tarihi</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice_date: e.target.value }))}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expense_category_id" className="text-xs font-medium mb-0.5 block">Gider Kategorisi</Label>
                    <ModernCategorySelect
                      value={formData.expense_category_id}
                      onChange={(value) => setFormData(prev => ({ ...prev, expense_category_id: value || '' }))}
                      placeholder="Kategori seçiniz"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-xs font-medium mb-0.5 block">Notlar</Label>
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
          <div className="lg:col-span-3 space-y-4">
            {/* Ürün Eşleştirme */}
            <Card className="border-2 border-gray-300 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 border-b-2 border-gray-300 p-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-600" />
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
                  <div className="max-h-[50vh] overflow-y-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-50 z-10">
                        <TableRow className="border-gray-200">
                          <TableHead className="w-10 font-semibold text-[10px] px-2">#</TableHead>
                          <TableHead className="min-w-80 font-semibold text-[10px] px-3">Fatura Kalemi</TableHead>
                          <TableHead className="text-right font-semibold text-[10px] px-2 w-20">Miktar</TableHead>
                          <TableHead className="text-center font-semibold text-[10px] px-2 w-16">Birim</TableHead>
                          <TableHead className="text-right font-semibold text-[10px] px-2 w-24">Birim Fiyat</TableHead>
                          <TableHead className="min-w-56 font-semibold text-[10px] px-3">Eşleşen Ürün</TableHead>
                          <TableHead className="w-24 text-center font-semibold text-[10px] px-2">İşlemler</TableHead>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5">
                {allMatched ? (
                  <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Tüm ürünler eşleştirildi</span>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">{matchedCount} / {matchingItems.length}</span> ürün eşleştirildi
                    </div>
                    {matchingItems.length - matchedCount > 0 && (
                      <div className="flex items-center gap-1 text-orange-600 text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>{matchingItems.length - matchedCount} ürün eksik</span>
                      </div>
                    )}
                  </div>
                )}
                {!selectedSupplierId && (
                  <div className="flex items-center gap-1 text-orange-600 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Tedarikçi seçilmedi</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleCreatePurchaseInvoice}
                disabled={!canCreateInvoice || isCreating}
                size="default"
                className="w-full sm:w-auto h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-sm hover:shadow transition-all"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5 mr-1.5" />
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