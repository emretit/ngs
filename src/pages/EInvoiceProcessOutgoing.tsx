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
import { logger } from '@/utils/logger';
import { Product } from "@/types/product";
import { EInvoiceDetails, EInvoiceItem, ProductMatchingItem } from "./einvoice/types";
import { EInvoiceTableRow } from "./einvoice/components/EInvoiceTableRow";
import { useOutgoingEInvoiceData } from "./einvoice/hooks/useOutgoingEInvoiceData";

interface Customer {
  id: string;
  name: string;
  company?: string;
  tax_number?: string;
  email?: string;
  company_id: string;
}

export default function EInvoiceProcessOutgoing() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateTabTitle } = useTabs();
  const queryClient = useQueryClient();
  
  const [invoice, setInvoice] = useState<EInvoiceDetails | null>(null);
  const [matchingItems, setMatchingItems] = useState<ProductMatchingItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(-1);
  const [customerMatchStatus, setCustomerMatchStatus] = useState<'searching' | 'found' | 'not_found' | null>(null);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [selectedProductForWarehouse, setSelectedProductForWarehouse] = useState<Product | null>(null);
  const [pendingProductIndex, setPendingProductIndex] = useState<number>(-1);
  
  // Form fields for sales invoice
  const [formData, setFormData] = useState({
    invoice_date: '',
    due_date: '',
    payment_terms: '30 gün',
    notes: '',
    project_id: '',
    income_category_id: ''
  });
  
  // Use custom hook for data fetching
  const { 
    products, 
    isLoadingProducts, 
    userCompanyId, 
    customers, 
    isLoadingCustomers, 
    loadInvoiceDetails: loadInvoiceDetailsFromHook 
  } = useOutgoingEInvoiceData(invoiceId);

  // Load invoice details - wrapper that sets state
  // useCallback kullanmıyoruz çünkü loadInvoiceDetailsFromHook her render'da yeni referans alabilir
  // Bunun yerine useEffect içinde direkt çağırıyoruz
  useEffect(() => {
    if (!invoiceId) return;
    
    let isMounted = true;
    
    const loadInvoiceDetails = async () => {
      try {
        const invoiceDetails = await loadInvoiceDetailsFromHook();
        
        if (!isMounted) return;
        
        setInvoice(invoiceDetails);
        
        // Set default form values - tarihi doğru formatta al
        const invoiceDateForForm = invoiceDetails.invoice_date.includes('T') 
          ? invoiceDetails.invoice_date.split('T')[0] 
          : invoiceDetails.invoice_date.substring(0, 10);
        const dueDateForForm = invoiceDetails.due_date 
          ? (invoiceDetails.due_date.includes('T') ? invoiceDetails.due_date.split('T')[0] : invoiceDetails.due_date.substring(0, 10))
          : '';
        setFormData({
          invoice_date: invoiceDateForForm,
          due_date: dueDateForForm,
          payment_terms: '30 gün',
          notes: `E-faturadan aktarılan satış faturası - Orijinal No: ${invoiceDetails.invoice_number}`,
          project_id: '',
          income_category_id: ''
        });
        
        // Giden faturalar için einvoices tablosunda kayıt olup olmadığını kontrol et
        // Eğer yoksa oluştur (foreign key constraint için gerekli)
        let einvoiceId = invoiceId;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: userProfile } = await supabase
              .from('profiles')
              .select('company_id')
              .eq('id', user.id)
              .single();
            
            if (userProfile?.company_id) {
              const { data: existingEinvoice } = await supabase
                .from('einvoices')
                .select('id')
                .eq('id', invoiceId)
                .maybeSingle();
              
              if (!existingEinvoice) {
                // einvoices tablosunda kayıt yok, oluştur
                const { data: newEinvoice, error: createEinvoiceError } = await supabase
                  .from('einvoices')
                  .insert({
                    id: invoiceId,
                    invoice_number: invoiceDetails.invoice_number,
                    supplier_name: (invoiceDetails as any).customer_name || invoiceDetails.supplier_name,
                    supplier_tax_number: (invoiceDetails as any).customer_tax_number || invoiceDetails.supplier_tax_number,
                    invoice_date: invoiceDetails.invoice_date,
                    due_date: invoiceDetails.due_date || null,
                    status: 'pending',
                    total_amount: invoiceDetails.total_amount,
                    paid_amount: 0,
                    remaining_amount: invoiceDetails.total_amount,
                    currency: invoiceDetails.currency,
                    tax_amount: invoiceDetails.tax_total,
                    company_id: userProfile.company_id
                  })
                  .select('id')
                  .single();
                
                if (createEinvoiceError) {
                  console.warn('⚠️ Error creating einvoice record:', createEinvoiceError);
                } else if (newEinvoice) {
                  einvoiceId = newEinvoice.id;
                  console.log('✅ Created einvoice record for outgoing invoice:', einvoiceId);
                }
              }
            }
          }
        } catch (error) {
          console.warn('⚠️ Error checking/creating einvoice record:', error);
        }
        
        // Initialize matching items
        const initialMatching: ProductMatchingItem[] = invoiceDetails.items.map(item => ({
          invoice_item: item
        }));
        
        // Kaydedilmiş eşleştirmeleri yükle (einvoiceId kullan)
        try {
          const { data: savedMatchings, error: matchingError } = await supabase
            .from('e_fatura_stok_eslestirme')
            .select('*')
            .eq('invoice_id', einvoiceId);
          
          if (matchingError) {
            console.warn('⚠️ Error loading saved matchings:', matchingError);
          } else if (savedMatchings && savedMatchings.length > 0) {
            // Kaydedilmiş eşleştirmeleri initialMatching'e ekle
            savedMatchings.forEach(saved => {
              const itemIndex = initialMatching.findIndex(
                item => item.invoice_item.id === saved.invoice_line_id
              );
              if (itemIndex >= 0 && saved.matched_stock_id) {
                initialMatching[itemIndex].matched_product_id = saved.matched_stock_id;
                if (saved.notes) {
                  initialMatching[itemIndex].notes = saved.notes;
                }
              }
            });
            console.log('✅ Loaded saved matchings:', savedMatchings.length);
          }
        } catch (error) {
          console.warn('⚠️ Error loading saved matchings:', error);
        }
        
        if (!isMounted) return;
        
        setMatchingItems(initialMatching);
        console.log('✅ Invoice details loaded:', invoiceDetails);
      } catch (error: any) {
        if (!isMounted) return;
        console.error('❌ Error in loadInvoiceDetails:', error);
        toast.error(error.message || "Fatura detayları yüklenirken bir hata oluştu");
        // Hata durumunda geri dön
        navigate('/e-invoice');
      }
    };
    
    loadInvoiceDetails();
    
    return () => {
      isMounted = false;
    };
  }, [invoiceId, navigate]); // loadInvoiceDetailsFromHook'u dependency'den çıkardık
  
  // Update tab title when invoice is loaded
  useEffect(() => {
    if (invoice?.invoice_number) {
      updateTabTitle(location.pathname, invoice.invoice_number);
    }
  }, [invoice?.invoice_number, location.pathname, updateTabTitle]);

  // Müşteri eşleştirmesi için useEffect
  // customers array'ini JSON.stringify ile serialize ederek referans değişikliğini kontrol ediyoruz
  const customersTaxNumbers = useMemo(() => 
    customers.map(c => c.tax_number).sort().join(','), 
    [customers]
  );
  
  useEffect(() => {
    if (!invoice) return;
    
    // Müşteri listesi yükleniyor mu kontrol et
    if (isLoadingCustomers) return;
    
    // Müşteri listesi boşsa not_found olarak işaretle
    if (customers.length === 0) {
      setCustomerMatchStatus('not_found');
      return;
    }
    
    // Müşteri araması yap
    setCustomerMatchStatus('searching');
    console.log('🔍 Müşteri aranıyor. VKN:', invoice.supplier_tax_number, 'Toplam müşteri:', customers.length);
    
    // Giden faturada customerTaxNumber kullan (eğer mevcutsa)
    const taxNumberToMatch = (invoice as any).customer_tax_number || invoice.supplier_tax_number;
    
    const matchingCustomer = customers.find(c => 
      c.tax_number === taxNumberToMatch
    );
    
    if (matchingCustomer) {
      setSelectedCustomerId(matchingCustomer.id);
      setCustomerMatchStatus('found');
      console.log('✅ Müşteri otomatik eşleştirildi:', matchingCustomer.name, 'VKN:', matchingCustomer.tax_number);
    } else {
      setCustomerMatchStatus('not_found');
      console.log('⚠️ VKN eşleşmedi. Aranan VKN:', taxNumberToMatch);
      console.log('📋 Sistemdeki müşteri VKN\'leri:', customers.map(c => c.tax_number).join(', '));
    }
  }, [invoice?.supplier_tax_number, (invoice as any)?.customer_tax_number, customersTaxNumbers, customers.length, isLoadingCustomers]); // customersTaxNumbers ile referans değişikliğini kontrol ediyoruz
  
  // Loading state'i hesapla
  const isLoading = !invoice || isLoadingProducts || isLoadingCustomers;
  
  const handleManualMatch = useCallback(async (itemIndex: number, productId: string) => {
    if (!invoiceId) return;
    
    let itemToSave: ProductMatchingItem | null = null;
    
    // State'i güncelle ve item'ı kaydet
    setMatchingItems(prev => {
      const updatedMatching = [...prev];
      const item = updatedMatching[itemIndex];
      if (!item) return prev;
      
      itemToSave = {
        ...item,
        matched_product_id: productId
      };
      
      updatedMatching[itemIndex] = itemToSave;
      return updatedMatching;
    });
    
    if (!itemToSave) return;
    
    // Veritabanına kaydet
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!userProfile?.company_id) return;
      
      // Giden faturalar için einvoices tablosunda kayıt olup olmadığını kontrol et
      // Eğer yoksa oluştur (foreign key constraint için gerekli)
      let einvoiceId = invoiceId;
      if (invoice) {
        const { data: existingEinvoice } = await supabase
          .from('einvoices')
          .select('id')
          .eq('id', invoiceId)
          .maybeSingle();
        
        if (!existingEinvoice) {
          // einvoices tablosunda kayıt yok, oluştur
          const { data: newEinvoice, error: createEinvoiceError } = await supabase
            .from('einvoices')
            .insert({
              id: invoiceId,
              invoice_number: invoice.invoice_number,
              supplier_name: (invoice as any).customer_name || invoice.supplier_name,
              supplier_tax_number: (invoice as any).customer_tax_number || invoice.supplier_tax_number,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date || null,
              status: 'pending',
              total_amount: invoice.total_amount,
              paid_amount: 0,
              remaining_amount: invoice.total_amount,
              currency: invoice.currency,
              tax_amount: invoice.tax_total,
              company_id: userProfile.company_id
            })
            .select('id')
            .single();
          
          if (createEinvoiceError) {
            console.error('❌ Error creating einvoice record:', createEinvoiceError);
            toast.error('Fatura kaydı oluşturulurken hata oluştu.');
            return;
          }
          
          if (newEinvoice) {
            einvoiceId = newEinvoice.id;
            console.log('✅ Created einvoice record for outgoing invoice:', einvoiceId);
          }
        }
      }
      
      const matchingRecord = {
        invoice_id: einvoiceId, // einvoices tablosundaki ID'yi kullan
        invoice_line_id: itemToSave.invoice_item.id,
        invoice_product_name: itemToSave.invoice_item.product_name,
        invoice_product_code: itemToSave.invoice_item.product_code || null,
        invoice_quantity: itemToSave.invoice_item.quantity,
        invoice_unit: itemToSave.invoice_item.unit || null,
        invoice_unit_price: itemToSave.invoice_item.unit_price,
        invoice_total_amount: itemToSave.invoice_item.line_total,
        invoice_tax_rate: itemToSave.invoice_item.tax_rate || null,
        matched_stock_id: productId,
        match_type: 'manual',
        match_confidence: 1.0,
        is_confirmed: true,
        notes: itemToSave.notes || null,
        company_id: userProfile.company_id
      };
      
      // Mevcut kaydı kontrol et
      const { data: existing } = await supabase
        .from('e_fatura_stok_eslestirme')
        .select('id')
        .eq('invoice_id', einvoiceId)
        .eq('invoice_line_id', itemToSave.invoice_item.id)
        .maybeSingle();
      
      if (existing) {
        // Güncelle
        const { error: updateError } = await supabase
          .from('e_fatura_stok_eslestirme')
          .update({
            matched_stock_id: productId,
            match_type: 'manual',
            match_confidence: 1.0,
            is_confirmed: true,
            notes: itemToSave.notes || null,
          })
          .eq('invoice_id', einvoiceId)
          .eq('invoice_line_id', itemToSave.invoice_item.id);
        
        if (updateError) {
          console.error('❌ Error updating matching:', updateError);
        } else {
          console.log('✅ Matching updated in database');
        }
      } else {
        // Yeni kayıt ekle
        const { error: insertError } = await supabase
          .from('e_fatura_stok_eslestirme')
          .insert(matchingRecord);
        
        if (insertError) {
          console.error('❌ Error saving matching:', insertError);
        } else {
          console.log('✅ Matching saved to database');
        }
      }
    } catch (error) {
      console.error('❌ Error in handleManualMatch:', error);
    }
  }, [invoiceId, invoice]); // invoice'u dependency'ye ekledik çünkü einvoice kaydı oluştururken kullanıyoruz
  
  const handleProductSelect = useCallback((itemIndex: number, product: Product) => {
    // Ürün seçildiğinde detay dialog'unu aç
    setSelectedProductForWarehouse(product);
    setPendingProductIndex(itemIndex);
    setIsWarehouseDialogOpen(true);
  }, []);

  const handleProductDetailsConfirm = useCallback(async (data: { warehouseId: string; quantity?: number; price?: number; unit?: string; discountRate?: number; taxRate?: number; description?: string }) => {
    if (selectedProductForWarehouse && pendingProductIndex >= 0) {
      // Ürünü eşleştir (async olarak)
      await handleManualMatch(pendingProductIndex, selectedProductForWarehouse.id);
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
      // handleManualMatch fonksiyonunu kullanarak hem state'i hem de veritabanını güncelle
      await handleManualMatch(currentItemIndex, newProduct.id);
    }
    // Reset form state
    setCurrentItemIndex(-1);
    setIsProductFormOpen(false);
    toast.success("Ürün oluşturuldu ve eşleştirildi");
  };
  
  const handleRemoveMatch = useCallback(async (itemIndex: number) => {
    if (!invoiceId || !invoice) return;
    
    let itemToRemove: ProductMatchingItem | null = null;
    let invoiceLineId: string | undefined;
    
    // State'i güncelle ve item'ı kaydet
    setMatchingItems(prev => {
      const updatedMatching = [...prev];
      const item = updatedMatching[itemIndex];
      if (!item) return prev;
      
      itemToRemove = item;
      invoiceLineId = item.invoice_item.id;
      
      updatedMatching[itemIndex] = {
        ...item,
        matched_product_id: undefined
      };
      return updatedMatching;
    });
    
    if (!itemToRemove || !invoiceLineId) return;
    
    // einvoiceId'yi bul (einvoices tablosunda kayıt olmalı)
    let einvoiceId = invoiceId;
    try {
      const { data: existingEinvoice } = await supabase
        .from('einvoices')
        .select('id')
        .eq('id', invoiceId)
        .maybeSingle();
      
      if (!existingEinvoice) {
        console.warn('⚠️ Einvoice record not found, cannot remove matching');
        return;
      }
    } catch (error) {
      console.error('❌ Error checking einvoice record:', error);
      return;
    }
    
    // Veritabanından sil veya güncelle
    try {
      const { data: existing } = await supabase
        .from('e_fatura_stok_eslestirme')
        .select('id')
        .eq('invoice_id', einvoiceId)
        .eq('invoice_line_id', invoiceLineId)
        .maybeSingle();
      
      if (existing) {
        // Eşleştirmeyi kaldır (matched_stock_id'yi null yap)
        const { error: updateError } = await supabase
          .from('e_fatura_stok_eslestirme')
          .update({
            matched_stock_id: null,
            is_confirmed: false
          })
          .eq('invoice_id', einvoiceId)
          .eq('invoice_line_id', invoiceLineId);
        
        if (updateError) {
          console.error('❌ Error removing matching:', updateError);
        } else {
          console.log('✅ Matching removed from database');
        }
      }
    } catch (error) {
      console.error('❌ Error in handleRemoveMatch:', error);
    }
  }, [invoiceId, invoice]);
  
  const handleCreateNewCustomer = async () => {
    if (!invoice) return;
    setIsCreatingCustomer(true);
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
      
      // E-faturadan gelen detaylı bilgilerle yeni müşteri oluştur
      const customerName = (invoice as any).customer_name || invoice.supplier_name;
      const customerTaxNumber = (invoice as any).customer_tax_number || invoice.supplier_tax_number;
      const customerDetails = invoice.supplier_details; // Giden faturada customer_details olabilir
      
      const customerData = {
        name: customerDetails?.company_name || customerName,
        company: customerDetails?.company_name || customerName,
        tax_number: customerDetails?.tax_number || customerTaxNumber,
        email: customerDetails?.email,
        mobile_phone: customerDetails?.phone,
        address: customerDetails?.address ? 
          `${customerDetails.address.street || ''} ${customerDetails.address.district || ''} ${customerDetails.address.city || ''}`.trim() : 
          undefined,
        city: customerDetails?.address?.city,
        district: customerDetails?.address?.district,
        postal_code: customerDetails?.address?.postal_code,
        country: customerDetails?.address?.country || 'Türkiye',
        type: 'kurumsal' as const,
        status: 'aktif' as const,
        balance: 0,
        company_id: userProfile.company_id // RLS için company_id ekle
      };
      
      console.log('🔍 Müşteri kaydedilecek bilgiler:', customerData);
      
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('✅ Müşteri başarıyla oluşturuldu:', newCustomer);
      
      // Müşteri query'sini invalidate et
      await queryClient.invalidateQueries({ queryKey: ["customers-for-einvoice"] });
      
      // Yeni müşteriyi seç
      setSelectedCustomerId(newCustomer.id);
      setCustomerMatchStatus('found');
      toast.success(`Müşteri "${customerData.name}" detaylı bilgilerle oluşturuldu ve seçildi`);
    } catch (error: any) {
      console.error('❌ Error creating customer:', error);
      toast.error(error.message || "Müşteri oluşturulurken hata oluştu");
    } finally {
      setIsCreatingCustomer(false);
    }
  };
  
  const handleCreateSalesInvoice = async () => {
    if (!invoice || matchingItems.length === 0) {
      toast.error("Lütfen ürün eşleştirmelerini tamamlayın");
      return;
    }
    
    // Müşteri yoksa önce oluştur
    if (!selectedCustomerId) {
      toast.error("Lütfen önce müşteri oluşturun veya seçin");
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
      
      // Aynı fatura numarasıyla kayıtlı fatura var mı kontrol et
      const { data: existingSalesInvoice, error: checkInvoiceError } = await supabase
        .from('sales_invoices')
        .select('id, fatura_no')
        .eq('fatura_no', invoice.invoice_number)
        .eq('company_id', userProfile.company_id)
        .maybeSingle();

      if (checkInvoiceError && checkInvoiceError.code !== 'PGRST116') {
        throw checkInvoiceError;
      }

      if (existingSalesInvoice) {
        throw new Error(`Bu fatura numarası (${invoice.invoice_number}) ile daha önce kayıt oluşturulmuş. Lütfen farklı bir fatura seçin veya mevcut faturayı düzenleyin.`);
      }

      // Get only valid items for sales invoice (must have matched_product_id)
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
      
      // Create sales invoice
      const { data: salesInvoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert({
          fatura_no: invoice.invoice_number,
          customer_id: selectedCustomerId,
          odeme_durumu: 'odenmedi',
          para_birimi: invoice.currency,
          ara_toplam: subtotal,
          kdv_tutari: taxTotal,
          toplam_tutar: total,
          odenen_tutar: 0,
          fatura_tarihi: formData.invoice_date,
          vade_tarihi: formData.due_date || formData.invoice_date,
          notlar: formData.notes,
          einvoice_status: 'sent', // E-faturadan geldiği için zaten gönderilmiş
          outgoing_invoice_id: invoiceId, // Giden fatura ile ilişkilendir
          company_id: userProfile.company_id,
          // Veriban durum bilgileri
          elogo_status: invoice.elogo_status || null,
          answer_type: invoice.answer_type || null,
          elogo_code: invoice.elogo_code || null,
          elogo_description: invoice.elogo_description || null,
        })
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;
      
      // Müşteri bakiyesini güncelle (satış faturası = müşteriden alacak = bakiye artar)
      const { data: customerData, error: customerFetchError } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', selectedCustomerId)
        .single();
      
      if (customerFetchError) {
        console.error('❌ Error fetching customer balance:', customerFetchError);
      } else if (customerData) {
        const newCustomerBalance = (customerData.balance || 0) + total;
        const { error: customerUpdateError } = await supabase
          .from('customers')
          .update({ balance: newCustomerBalance })
          .eq('id', selectedCustomerId);
        
        if (customerUpdateError) {
          console.error('❌ Error updating customer balance:', customerUpdateError);
        } else {
          console.log('✅ Customer balance updated:', newCustomerBalance);
        }
      }
      
      // Create sales invoice items
      const salesInvoiceItems = validItems.map(item => ({
        sales_invoice_id: salesInvoice.id,
        product_id: item.matched_product_id,
        urun_adi: item.invoice_item.product_name,
        miktar: item.invoice_item.quantity,
        birim: item.invoice_item.unit,
        birim_fiyat: item.invoice_item.unit_price,
        kdv_orani: item.invoice_item.tax_rate,
        indirim_orani: item.invoice_item.discount_rate || 0,
        satir_toplami: item.invoice_item.line_total,
        company_id: userProfile.company_id
      }));
      
      const { error: itemsError } = await supabase
        .from('sales_invoice_items')
        .insert(salesInvoiceItems);
      
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

      // Stok çıkış hareketi ve stok güncellemesi oluştur
      if (defaultWarehouseId && validItems.length > 0) {
        // Transaction numarası oluştur
        const year = new Date().getFullYear();
        const { data: existingTransactions } = await supabase
          .from('inventory_transactions')
          .select('transaction_number')
          .eq('company_id', userProfile.company_id)
          .like('transaction_number', `STC-${year}-%`)
          .order('transaction_number', { ascending: false })
          .limit(1);

        let nextNum = 1;
        if (existingTransactions && existingTransactions.length > 0) {
          const lastNumber = existingTransactions[0].transaction_number;
          const lastNumStr = lastNumber.replace(`STC-${year}-`, '');
          const lastNum = parseInt(lastNumStr, 10);
          if (!isNaN(lastNum)) {
            nextNum = lastNum + 1;
          }
        }
        const transactionNumber = `STC-${year}-${String(nextNum).padStart(4, '0')}`;
        
        // Stok çıkışı transaction'ı oluştur
        const { data: stockTransaction, error: transactionError } = await supabase
          .from('inventory_transactions')
          .insert({
            company_id: userProfile.company_id,
            transaction_number: transactionNumber,
            transaction_type: 'cikis', // Satış için çıkış
            status: 'approved', // Satış faturasından gelen stok otomatik onaylı
            warehouse_id: defaultWarehouseId,
            transaction_date: formData.invoice_date || new Date().toISOString().split('T')[0],
            reference_number: salesInvoice.fatura_no,
            notes: `Satış faturasından otomatik oluşturuldu - Fatura No: ${salesInvoice.fatura_no}`,
            created_by: user.id,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (transactionError) {
          console.error('❌ Error creating stock transaction:', transactionError);
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
              : item.invoice_item.product_name,
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
            // Stok güncellemesi yap (çıkış olduğu için stok azalt)
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
                  // Mevcut stoku azalt (çıkış)
                  const newQuantity = (existingStock.quantity || 0) - quantity;
                  await supabase
                    .from('warehouse_stock')
                    .update({
                      quantity: newQuantity,
                      last_transaction_date: new Date().toISOString(),
                    })
                    .eq('id', existingStock.id);
                } else {
                  // Stok yoksa negatif stok kaydı oluştur (uyarı verebiliriz)
                  console.warn(`⚠️ Ürün ${item.matched_product_id} için stok bulunamadı, negatif stok oluşturulacak`);
                  await supabase
                    .from('warehouse_stock')
                    .insert({
                      company_id: userProfile.company_id,
                      product_id: item.matched_product_id,
                      warehouse_id: defaultWarehouseId,
                      quantity: -quantity, // Negatif stok
                      reserved_quantity: 0,
                      last_transaction_date: new Date().toISOString(),
                    });
                }
              }
            }
          }
        }
      }
      
      // Cache'leri invalidate et
      await queryClient.invalidateQueries({ queryKey: ['salesInvoices'] });
      await queryClient.invalidateQueries({ queryKey: ['sales-invoices-infinite'] });
      await queryClient.invalidateQueries({ queryKey: ['product-stock-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      await queryClient.invalidateQueries({ queryKey: ['customer', selectedCustomerId] });
      
      toast.success(`Satış faturası başarıyla oluşturuldu.${defaultWarehouseId ? ' Stok hareketi oluşturuldu.' : ''}`);
      navigate('/sales-invoices');
    } catch (error: any) {
      console.error('❌ Error creating sales invoice:', error);
      toast.error(error.message || "Satış faturası oluşturulurken hata oluştu");
    } finally {
      setIsCreating(false);
    }
  };

  const getMatchedProduct = useCallback((productId?: string) => {
    return products.find(p => p.id === productId);
  }, [products]);
  
  // Eşleşen müşteriyi bul
  const matchedCustomer = useMemo(() => {
    if (!selectedCustomerId || !customers.length) return null;
    return customers.find(c => c.id === selectedCustomerId);
  }, [selectedCustomerId, customers]);
  
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
    selectedCustomerId && matchedCount > 0,
    [selectedCustomerId, matchedCount]
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
  
  const customerName = (invoice as any).customer_name || invoice.supplier_name;
  const customerTaxNumber = (invoice as any).customer_tax_number || invoice.supplier_tax_number;
  
  // E-Fatura Durumu badge helper (StateCode bazlı)
  const getEInvoiceStatusBadge = () => {
    if (!invoice) return null;
    
    const stateCode = invoice.elogo_status;
    const answerType = invoice.answer_type;

    if (stateCode !== null && stateCode !== undefined) {
      if (stateCode === 5) {
        if (answerType === 'KABUL') {
          return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">✓ Kabul Edildi</Badge>;
        } else if (answerType === 'RED') {
          return <Badge className="bg-red-50 text-red-700 border-red-200">✗ Reddedildi</Badge>;
        } else if (answerType === 'IADE') {
          return <Badge className="bg-orange-50 text-orange-700 border-orange-200">↩ İade Edildi</Badge>;
        }
        return <Badge className="bg-teal-50 text-teal-700 border-teal-200">✓ Teslim Edildi</Badge>;
      } else if (stateCode === 4) {
        return <Badge className="bg-red-50 text-red-700 border-red-200">✗ Hata</Badge>;
      } else if (stateCode === 3) {
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">→ Gönderim Listesinde</Badge>;
      } else if (stateCode === 2) {
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">⏱ İmza Bekliyor</Badge>;
      } else if (stateCode === 1) {
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">📝 Taslak</Badge>;
      }
    }

    return <Badge className="bg-gray-50 text-gray-700 border-gray-200">-</Badge>;
  };

  // Gönderim Durumu badge helper
  const getSendingStatusBadge = () => {
    if (!invoice || !invoice.status) return null;
    
    switch (invoice.status.toLowerCase()) {
      case 'delivered':
        return <Badge className="bg-teal-50 text-teal-700 border-teal-200">✓ Teslim Edildi</Badge>;
      case 'sent':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">→ Gönderildi</Badge>;
      case 'draft':
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">📝 Taslak</Badge>;
      case 'sending':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">⏱ Gönderiliyor</Badge>;
      case 'error':
      case 'failed':
        return <Badge className="bg-red-50 text-red-700 border-red-200">✗ Hata</Badge>;
      case 'pending':
        return <Badge className="bg-orange-50 text-orange-700 border-orange-200">⏱ Bekliyor</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">⊗ İptal</Badge>;
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">{invoice.status}</Badge>;
    }
  };
  
  return (
    <>
      <div className="space-y-2">
        {/* Enhanced Sticky Header */}
        <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
          <div className="flex items-center justify-between p-3 pl-12">
            <div className="flex items-center gap-3">
              <BackButton 
                onClick={() => navigate("/e-invoice")}
                variant="ghost"
                size="sm"
              >
                E-faturalar
              </BackButton>
              
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="space-y-0.5">
                  <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Giden Fatura İşleme
                  </h1>
                  <p className="text-xs text-muted-foreground/70">
                    {invoice.invoice_number || 'Henüz atanmadı'} • {customerName || 'Müşteri'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2 items-center">
                {getEInvoiceStatusBadge()}
                {getSendingStatusBadge()}
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
            {/* Fatura & Müşteri Bilgileri */}
            <Card className="border-2 border-gray-300 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b-2 border-gray-300 p-3">
                <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Fatura & Müşteri Bilgileri
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

                {/* Müşteri Bilgileri */}
                <div className={`p-2.5 rounded-lg text-xs transition-all ${
                  customerMatchStatus === 'found' ? 'bg-green-50 border border-green-200' : 
                  customerMatchStatus === 'not_found' ? 'bg-orange-50 border border-orange-200' : 
                  'bg-gray-50 border border-gray-200'
                }`}>
                  {/* Faturadan Gelen Müşteri Bilgileri */}
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Building2 className="h-3 w-3 text-green-600" />
                      <span className="text-green-700 font-medium text-xs">Müşteri Bilgileri</span>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm mb-0.5">
                      {customerName || 'Müşteri Adı Bulunamadı'}
                    </div>
                    {customerTaxNumber && (
                      <div className="text-gray-500 text-xs mt-0.5">
                        VKN: {customerTaxNumber || 'Belirtilmemiş'}
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-1.5" />
                  
                  {/* Müşteri Durum ve Seçim Bölümü */}
                  <div className="space-y-1.5">
                    {/* Durum Göstergesi */}
                    {(customerMatchStatus === 'searching' || customerMatchStatus === null || isLoadingCustomers) && (
                      <div className="flex items-center gap-1 p-1.5 bg-blue-50 rounded border border-blue-200">
                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                        <span className="text-blue-700 text-xs">Müşteri aranıyor...</span>
                      </div>
                    )}
                    
                    {/* Müşteri Bulundu */}
                    {customerMatchStatus === 'found' && selectedCustomerId && matchedCustomer && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 p-1.5 bg-green-50 rounded border border-green-200">
                          <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-green-700 font-medium text-xs">VKN ile otomatik eşleşti</div>
                            <div className="text-xs text-gray-600 truncate">
                              {matchedCustomer.name}
                            </div>
                          </div>
                        </div>
                        
                        {/* Farklı müşteri seçme opsiyonu */}
                        <div className="space-y-0.5">
                          <Label htmlFor="change_customer" className="text-xs font-medium text-gray-600">
                            Farklı müşteri seç
                          </Label>
                          <Select
                            value={selectedCustomerId || ''}
                            onValueChange={(value) => {
                              setSelectedCustomerId(value);
                              if (value) {
                                setCustomerMatchStatus('found');
                              }
                            }}
                          >
                            <SelectTrigger id="change_customer" className="h-7 text-xs">
                              <SelectValue placeholder="Müşteri seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id} className="text-xs">
                                  {customer.name} {customer.tax_number ? `(VKN: ${customer.tax_number})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    
                    {/* Müşteri Bulunamadı */}
                    {customerMatchStatus === 'not_found' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1 p-1.5 bg-orange-50 rounded border border-orange-200">
                          <AlertCircle className="h-3 w-3 text-orange-600" />
                          <span className="text-orange-700 text-xs font-medium">
                            Bu VKN sistemde kayıtlı değil
                          </span>
                        </div>
                        
                        {/* Önce manuel seçim opsiyonu sun */}
                        {customers.length > 0 && (
                          <>
                            <div className="space-y-0.5">
                              <Label htmlFor="manual_customer" className="text-xs font-medium">
                                Mevcut müşterilerden seç
                              </Label>
                              <Select
                                value={selectedCustomerId || ''}
                                onValueChange={(value) => {
                                  setSelectedCustomerId(value);
                                  if (value) {
                                    setCustomerMatchStatus('found');
                                  }
                                }}
                              >
                                <SelectTrigger id="manual_customer" className="h-7 text-xs">
                                  <SelectValue placeholder="Müşteri seçin..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id} className="text-xs">
                                      {customer.name} {customer.tax_number ? `(VKN: ${customer.tax_number})` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <Separator className="flex-1" />
                              <span className="text-xs text-gray-500">veya</span>
                              <Separator className="flex-1" />
                            </div>
                          </>
                        )}
                        
                        {/* Yeni Müşteri Ekle Butonu */}
                        <Button
                          onClick={handleCreateNewCustomer}
                          disabled={isCreatingCustomer}
                          size="sm"
                          className="w-full h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {isCreatingCustomer ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Ekleniyor...
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Yeni Müşteri Ekle
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
                          <EInvoiceTableRow
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
                {!selectedCustomerId && (
                  <div className="flex items-center gap-1 text-orange-600 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Müşteri seçilmedi</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleCreateSalesInvoice}
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
                    Satış Faturasını Oluştur
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
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

