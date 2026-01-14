import React, { useState, useEffect, useMemo, useCallback } from "react";
import { logger } from '@/utils/logger';
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { FileText, Eye, MoreHorizontal, Save, Send, Printer, ShoppingCart, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";
import InvoiceHeaderCard from "@/components/invoices/cards/InvoiceHeaderCard";
import TermsConditionsCard from "@/components/proposals/cards/TermsConditionsCard";
import { EInvoiceResendConfirmDialog } from "@/components/sales/EInvoiceResendConfirmDialog";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEInvoice } from "@/hooks/useEInvoice";
import { useVeribanInvoice } from "@/hooks/useVeribanInvoice";
import { IntegratorService } from "@/services/integratorService";
import { useNilveraCompanyInfo } from "@/hooks/useNilveraCompanyInfo";

// Constants
const DEFAULT_VAT_PERCENTAGE = 18;
const DEFAULT_CURRENCY = "TRY";
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT = "adet";

interface LineItem {
  id: string;
  row_number: number;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  total_price: number;
  currency?: string;
}

interface CustomerData {
  contact_name: string;
  customer_id: string;
}

interface InvoiceData {
  invoice_date: Date;
  invoice_number: string;
  issue_time: string;
  due_date: Date | null;
  invoice_type: string;
  invoice_profile: string;
  send_type: string;
  sales_platform: string;
  is_despatch: boolean;
  description: string;
  notes: string;
  banka_bilgileri: string;
}

interface FinancialData {
  currency: string;
  exchange_rate: number;
  vat_percentage: number;
}

interface EInvoiceData {
  internet_info: any;
  return_invoice_info: any;
}

const CreateSalesInvoice = () => {

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const proposalId = searchParams.get("proposalId");

  // Log URL params only when they change
  useEffect(() => {
    if (orderId || proposalId) {
      logger.debug("🔵 [CreateSalesInvoice] URL Params:", { orderId, proposalId });
    }
  }, [orderId, proposalId]);

  // Form setup
  const form = useForm({ 
    defaultValues: { 
      customer_id: "", 
      supplier_id: "" 
    },
    mode: "onChange"
  });
  const watchCustomerId = form.watch("customer_id");
  
  // Hooks
  const { customers } = useCustomerSelect();
  const { userData } = useCurrentUser();
  const { sendInvoice: sendNilveraInvoice, isSending: isSendingNilvera } = useEInvoice();
  const { 
    sendInvoice: sendVeribanInvoice, 
    isSending: isSendingVeriban,
    confirmDialog,
    handleConfirmResend,
    handleCancelResend,
  } = useVeribanInvoice();
  const { searchMukellef, mukellefInfo } = useNilveraCompanyInfo();
  
  // Integrator status
  const [integratorStatus, setIntegratorStatus] = useState<{
    nilvera: boolean;
    elogo: boolean;
    veriban: boolean;
    selected: 'nilvera' | 'elogo' | 'veriban';
  } | null>(null);
  
  useEffect(() => {
    const loadIntegratorStatus = async () => {
      try {
        const status = await IntegratorService.checkIntegratorStatus();
        setIntegratorStatus(status);
        logger.debug('📊 [CreateSalesInvoice] Integrator status:', status);
      } catch (error) {
        logger.error('Error loading integrator status:', error);
      }
    };
    loadIntegratorStatus();
  }, []);
  
  // Determine which integrator to use and get sending state
  const isSending = useMemo(() => {
    if (!integratorStatus) return false;
    if (integratorStatus.selected === 'veriban') return isSendingVeriban;
    if (integratorStatus.selected === 'nilvera') return isSendingNilvera;
    return false;
  }, [integratorStatus, isSendingVeriban, isSendingNilvera]);
  
  // Send invoice based on selected integrator
  const sendInvoiceToIntegrator = useCallback((invoiceId: string) => {
    if (!integratorStatus) {
      logger.warn('⚠️ [CreateSalesInvoice] Integrator status not loaded yet');
      return;
    }
    
    logger.debug('📤 [CreateSalesInvoice] Sending invoice to integrator:', integratorStatus.selected);
    
    if (integratorStatus.selected === 'veriban' && integratorStatus.veriban) {
      logger.debug('📤 [CreateSalesInvoice] Sending to Veriban...');
      sendVeribanInvoice({ salesInvoiceId: invoiceId, forceResend: false });
    } else if (integratorStatus.selected === 'nilvera' && integratorStatus.nilvera) {
      logger.debug('📤 [CreateSalesInvoice] Sending to Nilvera...');
      sendNilveraInvoice(invoiceId);
    } else if (integratorStatus.selected === 'elogo' && integratorStatus.elogo) {
      logger.debug('⚠️ [CreateSalesInvoice] e-Logo entegrasyonu henüz desteklenmiyor');
      toast.info('e-Logo entegrasyonu yakında eklenecek');
    } else {
      logger.warn('⚠️ [CreateSalesInvoice] Selected integrator is not active');
      toast.warning('Seçili entegratör aktif değil. Lütfen ayarlar sayfasından kontrol edin.');
    }
  }, [integratorStatus, sendVeribanInvoice, sendNilveraInvoice]);

  // State
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  // Source tracking
  const [sourceData, setSourceData] = useState<{
    type: 'proposal' | 'order' | null;
    data: any;
  }>({ type: null, data: null });
  
  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Customer data state
  const [customerData, setCustomerData] = useState<CustomerData>({
    contact_name: "",
    customer_id: "",
  });

  // Invoice data state - issue_time sadece mount'ta bir kere set edilsin
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return {
      invoice_date: new Date(),
      invoice_number: "",
      issue_time: currentTime,
      due_date: null,
      invoice_type: "SATIS",
      invoice_profile: "TEMELFATURA",
      send_type: "ELEKTRONIK",
      sales_platform: "NORMAL",
      is_despatch: false,
      description: "",
      notes: "",
      banka_bilgileri: "",
    };
  });

  // Financial data state
  const [financialData, setFinancialData] = useState<FinancialData>({
    currency: DEFAULT_CURRENCY,
    exchange_rate: 1,
    vat_percentage: DEFAULT_VAT_PERCENTAGE,
  });

  // E-invoice data state
  const [eInvoiceData, setEInvoiceData] = useState<EInvoiceData>({
    internet_info: {},
    return_invoice_info: {},
  });

  // Terms and conditions state
  const [termsData, setTermsData] = useState({
    payment_terms: "",
    delivery_terms: "",
    warranty_terms: "",
    price_terms: "",
    other_terms: "",
  });

  // Selected terms IDs state
  const [selectedTerms, setSelectedTerms] = useState({
    selectedPaymentTerms: [] as string[],
    selectedDeliveryTerms: [] as string[],
    selectedWarrantyTerms: [] as string[],
    selectedPricingTerms: [] as string[],
    selectedOtherTerms: [] as string[],
  });

  // handleFieldChange - State'lerden sonra tanımlanmalı
  const handleFieldChange = useCallback((field: string, value: any) => {
    // Update the appropriate state based on field
    if (['contact_name', 'customer_id'].includes(field)) {
      setCustomerData(prev => ({ ...prev, [field]: value }));
    } else if (['invoice_date', 'invoice_number', 'issue_time', 'due_date', 'invoice_type', 'invoice_profile', 'send_type', 'sales_platform', 'is_despatch', 'description', 'notes', 'banka_bilgileri'].includes(field)) {
      setInvoiceData(prev => ({ ...prev, [field]: value }));
    } else if (['currency', 'exchange_rate', 'vat_percentage'].includes(field)) {
      setFinancialData(prev => ({ ...prev, [field]: value }));
    } else if (['internet_info', 'return_invoice_info'].includes(field)) {
      setEInvoiceData(prev => ({ ...prev, [field]: value }));
    } else if (['payment_terms', 'delivery_terms', 'warranty_terms', 'price_terms', 'other_terms'].includes(field)) {
      setTermsData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  // Handle terms input change
  const handleTermsInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTermsData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle selected terms change
  const handleSelectedTermsChange = useCallback((category: string, termIds: string[]) => {
    setSelectedTerms(prev => ({ ...prev, [category]: termIds }));
  }, []);

  // Müşteri verilerini yükle - Sadece watchCustomerId değiştiğinde çalışır
  useEffect(() => {
    let isMounted = true;
    
    const loadCustomerData = async () => {
      if (!watchCustomerId || !watchCustomerId.trim()) {
        if (isMounted) {
          setSelectedCustomer(null);
          setCustomerData(prev => ({ ...prev, customer_id: "", contact_name: "" }));
        }
        return;
      }
      
      // Önce mevcut customers listesinde ara
      let selected = customers?.find(c => c.id === watchCustomerId);
      
      // Bulunamadıysa Supabase'den çek
      if (!selected) {
        try {
          const { data, error } = await supabase
            .from("customers")
            .select("*")
            .eq("id", watchCustomerId)
            .single();
          
          if (!error && data) {
            selected = data;
            logger.debug("✅ [CreateSalesInvoice] Customer loaded:", { id: selected.id, name: selected.name });
          } else if (error) {
            logger.error("❌ [CreateSalesInvoice] Error fetching customer:", error);
          }
        } catch (error) {
          logger.error("❌ [CreateSalesInvoice] Error fetching customer:", error);
        }
      } else {
        logger.debug("✅ [CreateSalesInvoice] Customer selected:", { id: selected.id, name: selected.name });
      }
      
      if (isMounted && selected) {
        setSelectedCustomer(selected);
        setCustomerData(prev => ({
          ...prev,
          customer_id: watchCustomerId,
          contact_name: selected.name || ""
        }));

        // Debug: Müşteri verilerini logla
        logger.debug("🔍 [CreateSalesInvoice] Seçilen müşteri verileri:", {
          id: selected.id,
          name: selected.name,
          einvoice_document_type: selected.einvoice_document_type,
          tax_number: selected.tax_number,
          is_einvoice_mukellef: selected.is_einvoice_mukellef
        });

        // Müşteri seçildiğinde documentType'a göre invoice_profile'ı otomatik doldur
        // 🆕 İYİLEŞTİRİLMİŞ: is_einvoice_mukellef alanını da kontrol et
        
        let autoSelectedProfile = "";
        
        // 1. ÖNCE: is_einvoice_mukellef alanını kontrol et (daha güvenilir)
        if (selected.is_einvoice_mukellef !== undefined && selected.is_einvoice_mukellef !== null) {
          if (selected.is_einvoice_mukellef === true) {
            // Müşteri e-fatura mükellefi
            autoSelectedProfile = "TEMELFATURA";
            logger.debug("✅ [CreateSalesInvoice] Müşteri E-FATURA MÜKELLEFİ -> TEMELFATURA seçildi");
          } else {
            // Müşteri e-fatura mükellefi DEĞİL -> E-Arşiv
            autoSelectedProfile = "EARSIVFATURA";
            logger.debug("✅ [CreateSalesInvoice] Müşteri E-FATURA MÜKELLEFİ DEĞİL -> EARSIVFATURA seçildi");
          }
          
          setInvoiceData(prev => ({
            ...prev,
            invoice_profile: autoSelectedProfile
          }));
          
          // Kullanıcıya bilgi ver
          const message = selected.is_einvoice_mukellef
            ? `✅ Müşteri e-fatura mükellefi - E-Fatura (${autoSelectedProfile}) otomatik seçildi`
            : `ℹ️ Müşteri e-fatura mükellefi değil - E-Arşiv Fatura (${autoSelectedProfile}) otomatik seçildi`;
          logger.debug(message);
          
          // Toast ile kullanıcıya bilgi ver
          if (selected.is_einvoice_mukellef === true) {
            toast.success('E-Fatura mükellefi müşteri seçildi', {
              description: 'Fatura, e-fatura olarak gönderilecektir.'
            });
          } else {
            toast.info('E-Arşiv fatura seçildi', {
              description: 'Müşteri e-fatura mükellefi değil. Fatura e-arşiv olarak gönderilecektir.'
            });
          }
        }
        // 2. SONRA: einvoice_document_type alanını kontrol et (yedek)
        else if (selected.einvoice_document_type) {
          const documentType = selected.einvoice_document_type;
          logger.debug("✅ [CreateSalesInvoice] DocumentType veritabanından bulundu:", documentType);
          
          // DocumentType'a göre invoice_profile'ı otomatik doldur
          let invoiceProfile = "TEMELFATURA"; // Varsayılan
          
          if (documentType === "Invoice" || documentType === "EINVOICE") {
            // E-Fatura mükellefi
            invoiceProfile = "TEMELFATURA";
            logger.debug("📋 [CreateSalesInvoice] E-Fatura mükellefi tespit edildi, invoice_profile: TEMELFATURA");
          } else if (documentType === "ArchiveInvoice" || documentType === "EARCHIVE" || documentType === "EARCHIVETYPE2") {
            // E-Arşiv mükellefi
            invoiceProfile = "EARSIVFATURA";
            logger.debug("📋 [CreateSalesInvoice] E-Arşiv mükellefi tespit edildi, invoice_profile: EARSIVFATURA");
          } else if (documentType === "Waybill" || documentType === "DESPATCHADVICE") {
            // E-İrsaliye
            invoiceProfile = "EARSIVIRSLIYE";
            logger.debug("📋 [CreateSalesInvoice] E-İrsaliye mükellefi tespit edildi, invoice_profile: EARSIVIRSLIYE");
          } else {
            logger.warn("⚠️ [CreateSalesInvoice] Bilinmeyen documentType:", documentType, "- Varsayılan TEMELFATURA kullanılıyor");
          }
          
          logger.debug("📋 [CreateSalesInvoice] Invoice profile otomatik dolduruldu (veritabanından):", invoiceProfile);
          setInvoiceData(prev => ({
            ...prev,
            invoice_profile: invoiceProfile
          }));
        } else if (selected.tax_number && selected.tax_number.length >= 10) {
          // Eğer veritabanında documentType yoksa, API'den sorgula
          logger.debug("🔍 [CreateSalesInvoice] DocumentType veritabanında yok, mükellef bilgisi sorgulanıyor...", selected.tax_number);
          searchMukellef(selected.tax_number).then((result) => {
            if (result.success && result.data?.documentType) {
              const documentType = result.data.documentType;
              logger.debug("✅ [CreateSalesInvoice] DocumentType API'den bulundu:", documentType);
              
              // DocumentType'a göre invoice_profile'ı otomatik doldur
              let invoiceProfile = "TEMELFATURA"; // Varsayılan
              
              if (documentType === "Invoice" || documentType === "EINVOICE") {
                // E-Fatura mükellefi
                invoiceProfile = "TEMELFATURA";
              } else if (documentType === "ArchiveInvoice" || documentType === "EARCHIVE" || documentType === "EARCHIVETYPE2") {
                // E-Arşiv mükellefi
                invoiceProfile = "EARSIVFATURA";
              } else if (documentType === "Waybill" || documentType === "DESPATCHADVICE") {
                // E-İrsaliye
                invoiceProfile = "EARSIVIRSLIYE";
              }
              
              logger.debug("📋 [CreateSalesInvoice] Invoice profile otomatik dolduruldu (API'den):", invoiceProfile);
              setInvoiceData(prev => ({
                ...prev,
                invoice_profile: invoiceProfile
              }));
            }
          }).catch((error) => {
            logger.error("❌ [CreateSalesInvoice] Mükellef sorgulama hatası:", error);
          });
        }
      }
    };
    
    loadCustomerData();
    
    return () => {
      isMounted = false;
    };
  }, [watchCustomerId, customers]);

  // Combined form data for components
  const formData = useMemo(() => {
    return {
      ...customerData,
      ...invoiceData,
      ...financialData,
      // Mapping for InvoiceHeaderCard
      fatura_tarihi: invoiceData.invoice_date,
      fatura_no: invoiceData.invoice_number,
      vade_tarihi: invoiceData.due_date,
      aciklama: invoiceData.description,
      notlar: invoiceData.notes,
      para_birimi: financialData.currency,
      banka_bilgileri: invoiceData.banka_bilgileri || "",
      ...eInvoiceData,
    };
  }, [customerData, invoiceData, financialData, eInvoiceData]);

  // Line items state
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "1",
      row_number: 1,
      name: "",
      description: "",
      quantity: DEFAULT_QUANTITY,
      unit: DEFAULT_UNIT,
      unit_price: 0,
      tax_rate: DEFAULT_VAT_PERCENTAGE,
      discount_rate: 0,
      total_price: 0,
      currency: DEFAULT_CURRENCY
    }
  ]);

  // Load order or proposal data
  const loadOrderData = useCallback(async (id: string) => {
    logger.debug("🔵 [CreateSalesInvoice] Loading order data...", { orderId: id });
    try {
      setLoadingData(true);
      const { data: order, error } = await supabase
        .from("orders")
        .select(`*, customer:customers(*), items:order_items(*)`)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (order) {
        // Store source data
        setSourceData({ type: 'order', data: order });

        // Set customer
        if (order.customer_id) {
          form.setValue("customer_id", order.customer_id);
          setSelectedCustomer(order.customer);
        }

        // Set invoice data
        const orderCurrency = order.currency === 'TRY' ? 'TRY' : (order.currency || "TRY");
        setInvoiceData(prev => ({
          ...prev,
          invoice_date: order.order_date ? new Date(order.order_date) : new Date(),
          due_date: order.expected_delivery_date ? new Date(order.expected_delivery_date) : null,
          description: [order.order_number && `Sipariş No: ${order.order_number}`, order.title, order.description].filter(Boolean).join(' - '),
          notes: order.notes || "",
          banka_bilgileri: "",
        }));

        setFinancialData(prev => ({
          ...prev,
          currency: orderCurrency,
          exchange_rate: order.exchange_rate || 1,
        }));

        // Load terms from order if available
        if (order.payment_terms || order.delivery_terms || order.warranty_terms || order.price_terms || order.other_terms) {
          setTermsData({
            payment_terms: order.payment_terms || "",
            delivery_terms: order.delivery_terms || "",
            warranty_terms: order.warranty_terms || "",
            price_terms: order.price_terms || "",
            other_terms: order.other_terms || "",
          });
        }

        // Convert items
        if (order.items && order.items.length > 0) {
          const invoiceItems = order.items.map((item: any, index: number) => ({
            id: (index + 1).toString(),
            row_number: index + 1,
            name: item.name,
            description: item.description || "",
            quantity: parseFloat(item.quantity),
            unit: item.unit || "adet",
            unit_price: parseFloat(item.unit_price),
            tax_rate: parseFloat(item.tax_rate) || DEFAULT_VAT_PERCENTAGE,
            discount_rate: parseFloat(item.discount_rate) || 0,
            total_price: parseFloat(item.total_price),
            currency: orderCurrency
          }));
          setItems(invoiceItems);
        }
        logger.debug("✅ [CreateSalesInvoice] Order data loaded successfully", { 
          orderNumber: order.order_number,
          itemsCount: order.items?.length || 0 
        });
      }
    } catch (error) {
      logger.error("❌ [CreateSalesInvoice] Error loading order:", error);
      toast.error("Sipariş verileri yüklenirken hata oluştu");
    } finally {
      setLoadingData(false);
    }
  }, [form]);

  const loadProposalData = useCallback(async (id: string) => {
    logger.debug("🔵 [CreateSalesInvoice] Loading proposal data...", { proposalId: id });
    try {
      setLoadingData(true);
      const { data: proposal, error } = await supabase
        .from("proposals")
        .select(`*, customer:customers(*)`)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (proposal) {
        // Store source data
        setSourceData({ type: 'proposal', data: proposal });

        // Set customer
        if (proposal.customer_id) {
          form.setValue("customer_id", proposal.customer_id);
          setSelectedCustomer(proposal.customer);
        }

        // Set invoice data
        const proposalCurrency = proposal.currency === 'TRY' ? 'TRY' : (proposal.currency || "TRY");
        setInvoiceData(prev => ({
          ...prev,
          invoice_date: proposal.offer_date ? new Date(proposal.offer_date) : new Date(),
          due_date: proposal.valid_until ? new Date(proposal.valid_until) : null,
          description: [proposal.number && `Teklif No: ${proposal.number}`, proposal.title, proposal.subject, proposal.description].filter(Boolean).join(' - '),
          notes: proposal.notes || "",
        }));

        setFinancialData(prev => ({
          ...prev,
          currency: proposalCurrency,
          exchange_rate: proposal.exchange_rate || 1,
        }));

        // Load terms from proposal if available
        if (proposal.payment_terms || proposal.delivery_terms || proposal.warranty_terms || proposal.price_terms || proposal.other_terms) {
          setTermsData({
            payment_terms: proposal.payment_terms || "",
            delivery_terms: proposal.delivery_terms || "",
            warranty_terms: proposal.warranty_terms || "",
            price_terms: proposal.price_terms || "",
            other_terms: proposal.other_terms || "",
          });
        }

        // Parse items
        let parsedItems: any[] = [];
        if (proposal.items) {
          if (typeof proposal.items === 'string') {
            parsedItems = JSON.parse(proposal.items);
          } else if (Array.isArray(proposal.items)) {
            parsedItems = proposal.items;
          }
        }

        if (parsedItems.length > 0) {
          const invoiceItems = parsedItems.map((item: any, index: number) => ({
            id: (index + 1).toString(),
            row_number: index + 1,
            name: item.name || item.urun_adi || "",
            description: item.description || item.aciklama || "",
            quantity: parseFloat(item.quantity || item.miktar) || 1,
            unit: item.unit || item.birim || "adet",
            unit_price: parseFloat(item.unit_price || item.birim_fiyat) || 0,
            tax_rate: parseFloat(item.tax_rate || item.kdv_orani) || DEFAULT_VAT_PERCENTAGE,
            discount_rate: parseFloat(item.discount_rate || item.indirim_orani) || 0,
            total_price: parseFloat(item.total_price || item.satir_toplami) || 0,
            currency: proposalCurrency
          }));
          setItems(invoiceItems);
        }
        logger.debug("✅ [CreateSalesInvoice] Proposal data loaded successfully", { 
          proposalNumber: proposal.number,
          itemsCount: parsedItems.length 
        });
      }
    } catch (error) {
      logger.error("❌ [CreateSalesInvoice] Error loading proposal:", error);
      toast.error("Teklif verileri yüklenirken hata oluştu");
    } finally {
      logger.debug("  → loadProposalData completed, setting loadingData to false");
      setLoadingData(false);
    }
  }, [form]);

  // Load data on mount
  useEffect(() => {
    logger.debug("🟣 [CreateSalesInvoice] useEffect - loadData on mount triggered", {
      orderId,
      proposalId,
      timestamp: new Date().toISOString()
    });

    if (orderId) {
      logger.debug("  → Loading order data...");
      loadOrderData(orderId);
    } else if (proposalId) {
      logger.debug("  → Loading proposal data...");
      loadProposalData(proposalId);
    } else {
      logger.debug("  → No orderId or proposalId, skipping data load");
    }
  }, [orderId, proposalId, loadOrderData, loadProposalData]);

  // Calculate totals by currency
  const calculationsByCurrency = useMemo(() => {
    const totals: Record<string, { gross: number; discount: number; net: number; vat: number; grand: number }> = {};
    
    const usedCurrencies = new Set<string>();
    items.forEach(item => {
      const currency = item.currency || financialData.currency;
      usedCurrencies.add(currency);
    });
    
    usedCurrencies.forEach(currency => {
      totals[currency] = { gross: 0, discount: 0, net: 0, vat: 0, grand: 0 };
    });
    
    items.forEach(item => {
      const currency = item.currency || financialData.currency;
      const subtotal = item.quantity * item.unit_price;
      const discountAmount = (subtotal * (item.discount_rate || 0)) / 100;
      const discountedSubtotal = subtotal - discountAmount;
      const vatAmount = (discountedSubtotal * (item.tax_rate || DEFAULT_VAT_PERCENTAGE)) / 100;
      
      totals[currency].gross += subtotal;
      totals[currency].discount += discountAmount;
      totals[currency].net += discountedSubtotal;
      totals[currency].vat += vatAmount;
      totals[currency].grand += discountedSubtotal + vatAmount;
    });

    // Apply global discount
    const totalGross = Object.values(totals).reduce((sum, total) => sum + total.gross, 0);
    Object.keys(totals).forEach(currency => {
      if (globalDiscountValue > 0 && totalGross > 0) {
        const currencyProportion = totals[currency].gross / totalGross;
        let globalDiscount = 0;
        if (globalDiscountType === 'percentage') {
          globalDiscount = (totals[currency].net * globalDiscountValue) / 100;
        } else {
          globalDiscount = globalDiscountValue * currencyProportion;
        }
        totals[currency].discount += globalDiscount;
        totals[currency].net -= globalDiscount;
        totals[currency].grand = totals[currency].net + totals[currency].vat;
      }
    });
    
    return totals;
  }, [items, financialData.currency, globalDiscountValue, globalDiscountType]);

  // Item handlers
  const handleItemChange = useCallback((index: number, field: keyof LineItem, value: any) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        total_price: field === 'quantity' || field === 'unit_price' 
          ? (field === 'quantity' ? value : updatedItems[index].quantity) * 
            (field === 'unit_price' ? value : updatedItems[index].unit_price)
          : updatedItems[index].total_price
      };
      return updatedItems;
    });
  }, []);

  const addItem = useCallback(() => {
    setItems(prevItems => {
      const newItem: LineItem = {
        id: Date.now().toString(),
        row_number: prevItems.length + 1,
        name: "",
        description: "",
        quantity: DEFAULT_QUANTITY,
        unit: DEFAULT_UNIT,
        unit_price: 0,
        tax_rate: DEFAULT_VAT_PERCENTAGE,
        discount_rate: 0,
        total_price: 0,
        currency: financialData.currency
      };
      return [...prevItems, newItem];
    });
  }, [financialData.currency]);

  const removeItem = useCallback((index: number) => {
    setItems(prevItems => {
      if (prevItems.length > 1) {
        const updatedItems = prevItems.filter((_, i) => i !== index);
        return updatedItems.map((item, i) => ({ ...item, row_number: i + 1 }));
      }
      return prevItems;
    });
  }, []);

  const moveItemUp = useCallback((index: number) => {
    setItems(prevItems => {
      if (index > 0) {
        const updatedItems = [...prevItems];
        [updatedItems[index - 1], updatedItems[index]] = [updatedItems[index], updatedItems[index - 1]];
        return updatedItems.map((item, i) => ({ ...item, row_number: i + 1 }));
      }
      return prevItems;
    });
  }, []);

  const moveItemDown = useCallback((index: number) => {
    setItems(prevItems => {
      if (index < prevItems.length - 1) {
        const updatedItems = [...prevItems];
        [updatedItems[index], updatedItems[index + 1]] = [updatedItems[index + 1], updatedItems[index]];
        return updatedItems.map((item, i) => ({ ...item, row_number: i + 1 }));
      }
      return prevItems;
    });
  }, []);

  const handleProductModalSelect = (product: any, itemIndex?: number) => {
    setSelectedProduct(product);
    setEditingItemIndex(itemIndex);
    setProductModalOpen(true);
  };

  const handleAddProductToInvoice = (productData: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate || DEFAULT_VAT_PERCENTAGE,
        discount_rate: productData.discount_rate || 0,
        total_price: productData.total_price,
        currency: productData.currency || financialData.currency,
      };
      setItems(updatedItems);
    } else {
      const newItem: LineItem = {
        id: Date.now().toString(),
        row_number: items.length + 1,
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate || DEFAULT_VAT_PERCENTAGE,
        discount_rate: productData.discount_rate || 0,
        total_price: productData.total_price,
        currency: productData.currency || financialData.currency,
      };
      setItems([...items, newItem]);
    }
    
    setProductModalOpen(false);
    setEditingItemIndex(undefined);
    setSelectedProduct(null);
  };

  // Handle new product creation
  const handleNewProduct = useCallback((searchTerm?: string) => {
    logger.debug('🆕 [CreateSalesInvoice] Opening new product modal', { searchTerm });
    // Yeni ürün oluşturma modalını aç
    // ProductDetailsModal zaten yeni ürün oluşturma desteği var
    setSelectedProduct(null);
    setEditingItemData(searchTerm ? { name: searchTerm } : null);
    setProductModalOpen(true);
  }, []);

  // Form handler for InvoiceHeaderCard
  const handleFormDataChange = useCallback((field: string, value: any) => {
    // Map InvoiceHeaderCard fields to our state
    const fieldMapping: Record<string, string> = {
      'fatura_tarihi': 'invoice_date',
      'fatura_no': 'invoice_number',
      'vade_tarihi': 'due_date',
      'aciklama': 'description',
      'notlar': 'notes',
      'para_birimi': 'currency',
    };
    
    const mappedField = fieldMapping[field] || field;
    handleFieldChange(mappedField, value);
  }, [handleFieldChange]);

  // Save invoice
  const handleSave = async () => {
    logger.debug("💾 [CreateSalesInvoice] Saving invoice...");
    try {
      // Validation
      const customerId = watchCustomerId || customerData.customer_id;
      
      if (!customerId) {
        logger.debug("  ❌ Validation failed: No customer selected");
        toast.error("Müşteri seçilmelidir");
        return;
      }

      const validItems = items.filter(item => item.name.trim());
      logger.debug("  → Items validation:", { totalItems: items.length, validItems: validItems.length });
      
      if (validItems.length === 0) {
        logger.debug("  ❌ Validation failed: No valid items");
        toast.error("En az bir fatura kalemi eklenmelidir");
        return;
      }

      logger.debug("  → Validation passed, starting save...");
      setSaving(true);

      // Calculate totals
      const primaryCurrency = financialData.currency;
      const totals = calculationsByCurrency[primaryCurrency] || { gross: 0, discount: 0, net: 0, vat: 0, grand: 0 };

      // Clean JSONB fields
      const cleanedInternetInfo = Object.keys(eInvoiceData.internet_info || {}).length > 0 ? eInvoiceData.internet_info : null;
      const cleanedReturnInvoiceInfo = Object.keys(eInvoiceData.return_invoice_info || {}).length > 0 ? eInvoiceData.return_invoice_info : null;

      // Fatura numarası - manuel girilmiş ise kullan, yoksa null bırak
      // Numara e-fatura/e-arşiv gönderildiğinde backend tarafından otomatik üretilecek
      let finalInvoiceNumber = invoiceData.invoice_number || null;
      
      logger.debug('📝 [CreateSalesInvoice] Fatura kaydediliyor, numara:', finalInvoiceNumber || 'yok (gönderildiğinde backend tarafından atanacak)');

      // Determine fatura_tipi2 based on invoice_profile
      // E-fatura mükellefi olmayan müşterilere e-arşiv faturası kesilir
      const faturaTipi2 = invoiceData.invoice_profile === 'EARSIVFATURA' ? 'e-arşiv' : 'e-fatura';

      // Prepare invoice data
      const invoicePayload = {
        customer_id: customerId,
        company_id: userData?.company_id,
        fatura_no: finalInvoiceNumber || null,
        fatura_tarihi: format(invoiceData.invoice_date, 'yyyy-MM-dd'),
        issue_time: invoiceData.issue_time,
        vade_tarihi: invoiceData.due_date ? format(invoiceData.due_date, 'yyyy-MM-dd') : null,
        invoice_type: invoiceData.invoice_type,
        invoice_profile: invoiceData.invoice_profile,
        fatura_tipi2: faturaTipi2,
        send_type: invoiceData.send_type,
        sales_platform: invoiceData.sales_platform,
        is_despatch: invoiceData.is_despatch,
        internet_info: cleanedInternetInfo,
        return_invoice_info: cleanedReturnInvoiceInfo,
        aciklama: invoiceData.description,
        notlar: invoiceData.notes,
        para_birimi: primaryCurrency,
        exchange_rate: financialData.exchange_rate,
        ara_toplam: totals.gross,
        indirim_tutari: totals.discount,
        kdv_tutari: totals.vat,
        toplam_tutar: totals.grand,
        durum: 'taslak', // Fatura oluşturulduğunda her zaman taslak, gönderildiğinde 'gonderildi' olacak
        payment_terms: termsData.payment_terms || null,
        delivery_terms: termsData.delivery_terms || null,
        warranty_terms: termsData.warranty_terms || null,
        price_terms: termsData.price_terms || null,
        other_terms: termsData.other_terms || null,
        banka_bilgileri: invoiceData.banka_bilgileri || null,
        // Source tracking
        order_id: sourceData.type === 'order' ? orderId : null,
        proposal_id: sourceData.type === 'proposal' ? proposalId : null,
      };

      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert(invoicePayload)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Insert items
      const invoiceItems = validItems.map(item => ({
        sales_invoice_id: invoice.id,
        company_id: userData?.company_id, // RLS policy için gerekli
        urun_adi: item.name,
        aciklama: item.description,
        miktar: item.quantity,
        birim: item.unit,
        birim_fiyat: item.unit_price,
        kdv_orani: item.tax_rate || DEFAULT_VAT_PERCENTAGE,
        indirim_orani: item.discount_rate || 0,
        satir_toplami: item.quantity * item.unit_price * (1 - (item.discount_rate || 0) / 100),
        kdv_tutari: (item.quantity * item.unit_price * (1 - (item.discount_rate || 0) / 100)) * ((item.tax_rate || DEFAULT_VAT_PERCENTAGE) / 100),
      }));

      const { error: itemsError } = await supabase
        .from('sales_invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Müşteri bakiyesini güncelle (satış faturası = müşteriye borç = bakiye artar/pozitif yönde artar)
      // Pozitif bakiye = müşteri bize borçlu, Negatif bakiye = biz müşteriye borçluyuz
      if (customerId && totals.grand) {
        const { data: customerData, error: customerFetchError } = await supabase
          .from('customers')
          .select('balance')
          .eq('id', customerId)
          .single();
        
        if (customerFetchError) {
          logger.error('❌ Error fetching customer balance:', customerFetchError);
          // Hata olsa bile devam et, sadece logla
        } else if (customerData) {
          const newCustomerBalance = (customerData.balance || 0) + totals.grand;
          const { error: customerUpdateError } = await supabase
            .from('customers')
            .update({ balance: newCustomerBalance })
            .eq('id', customerId);
          
          if (customerUpdateError) {
            logger.error('❌ Error updating customer balance:', customerUpdateError);
            // Hata olsa bile devam et, sadece logla
          } else {
            logger.debug('✅ Customer balance updated:', newCustomerBalance);
          }
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }

      logger.debug("✅ [CreateSalesInvoice] Invoice saved successfully", { invoiceId: invoice.id });
      
      // Show success message with invoice type info
      const invoiceTypeText = faturaTipi2 === 'e-arşiv' ? 'E-Arşiv' : 'E-Fatura';
      
      if (finalInvoiceNumber) {
        toast.success(`${invoiceTypeText} faturası başarıyla kaydedildi (${finalInvoiceNumber})`);
      } else {
        toast.success(`${invoiceTypeText} faturası kaydedildi`, {
          description: `${invoiceTypeText} göndermek için '${invoiceTypeText} Gönder' butonuna tıklayın.`
        });
      }
      
      navigate(`/sales-invoices/${invoice.id}`);

    } catch (error) {
      logger.error('❌ [CreateSalesInvoice] Error saving invoice:', error);
      toast.error("Fatura kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  // Smart save - artık kullanmıyoruz, doğrudan handleSave çağrılacak
  const handleSmartSave = () => {
    handleSave();
  };

  // Loading state
  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header - NewProposalCreate ile aynı */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Simple Back Button */}
            <BackButton 
              fallbackPath="/sales-invoices"
              variant="ghost"
              size="sm"
            >
              Faturalar
            </BackButton>
            
            {/* Simple Title Section with Icon */}
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Yeni Satış Faturası
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Hızlı ve kolay fatura oluşturma
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSmartSave}
              disabled={saving || isSending}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{saving || isSending ? "İşleniyor..." : "Kaydet"}</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="font-medium">İşlemler</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Kaydetme</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleSave()} className="gap-2 cursor-pointer">
                  <Save className="h-4 w-4 text-slate-500" />
                  <span>Kaydet</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Diğer</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
                  <Eye className="h-4 w-4 text-slate-500" />
                  <span>Önizle</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
                  <Printer className="h-4 w-4 text-blue-500" />
                  <span>Yazdır</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" disabled>
                  <Send className="h-4 w-4 text-purple-500" />
                  <span>E-posta Gönder</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content - Her kart bağımsız Card komponenti */}
      <div className="space-y-4">
        {/* Source Info Banner */}
        {sourceData.type && sourceData.data && (
          <Alert className={sourceData.type === 'proposal' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'}>
            <div className="flex items-center gap-3">
              {sourceData.type === 'proposal' ? (
                <FileCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
              ) : (
                <ShoppingCart className="h-5 w-5 text-purple-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <AlertTitle className={sourceData.type === 'proposal' ? 'text-blue-900' : 'text-purple-900'}>
                  {sourceData.type === 'proposal' ? 'Tekliften Fatura Oluşturuluyor' : 'Siparişten Fatura Oluşturuluyor'}
                </AlertTitle>
                <AlertDescription className={sourceData.type === 'proposal' ? 'text-blue-700' : 'text-purple-700'}>
                  {sourceData.type === 'proposal' ? (
                    <>
                      <span className="font-medium">{sourceData.data.number}</span>
                      {sourceData.data.title && <span> - {sourceData.data.title}</span>}
                      {sourceData.data.subject && <span className="text-sm"> ({sourceData.data.subject})</span>}
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{sourceData.data.order_number}</span>
                      {sourceData.data.title && <span> - {sourceData.data.title}</span>}
                    </>
                  )}
                </AlertDescription>
              </div>
              {sourceData.data.total_amount && (
                <Badge
                  variant="outline"
                  className={sourceData.type === 'proposal'
                    ? 'bg-white text-blue-700 border-blue-200'
                    : 'bg-white text-purple-700 border-purple-200'
                  }
                >
                  {formatCurrency(sourceData.data.total_amount, sourceData.data.currency || 'TRY')}
                </Badge>
              )}
            </div>
          </Alert>
        )}

        {/* Invoice Details - Full Width */}
        <InvoiceHeaderCard
          formData={formData}
          onFieldChange={handleFormDataChange}
          selectedCustomer={selectedCustomer}
          form={form}
          assignedInvoiceNumber={null}
        />

        {/* Products/Services Table - Full Width */}
        <ProductServiceCard
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onMoveItemUp={moveItemUp}
          onMoveItemDown={moveItemDown}
          onItemChange={handleItemChange}
          onProductModalSelect={(product, itemIndex) => {
            if (itemIndex !== undefined) {
              setSelectedProduct(product);
              setEditingItemIndex(itemIndex);
              setEditingItemData(product);
              setProductModalOpen(true);
            } else {
              handleProductModalSelect(product, itemIndex);
            }
          }}
          onNewProduct={handleNewProduct}
          showMoveButtons={true}
          inputHeight="h-10"
        />

        {/* Financial Summary - Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {/* Terms and Conditions Card */}
            <TermsConditionsCard
              paymentTerms={termsData.payment_terms}
              deliveryTerms={termsData.delivery_terms}
              warrantyTerms={termsData.warranty_terms}
              priceTerms={termsData.price_terms}
              otherTerms={termsData.other_terms}
              onInputChange={handleTermsInputChange}
              selectedPaymentTerms={selectedTerms.selectedPaymentTerms}
              selectedDeliveryTerms={selectedTerms.selectedDeliveryTerms}
              selectedWarrantyTerms={selectedTerms.selectedWarrantyTerms}
              selectedPricingTerms={selectedTerms.selectedPricingTerms}
              selectedOtherTerms={selectedTerms.selectedOtherTerms}
              onSelectedTermsChange={handleSelectedTermsChange}
              invoiceMode={true}
              aciklama={invoiceData.description}
              notlar={invoiceData.notes}
              banka_bilgileri={invoiceData.banka_bilgileri}
              onFieldChange={(field, value) => {
                // Map field names
                const fieldMapping: Record<string, string> = {
                  'aciklama': 'description',
                  'notlar': 'notes',
                  'banka_bilgileri': 'banka_bilgileri',
                };
                const mappedField = fieldMapping[field] || field;
                handleFieldChange(mappedField, value);
              }}
            />
          </div>
          
          {/* Financial Summary */}
          <FinancialSummaryCard
            calculationsByCurrency={calculationsByCurrency}
            globalDiscountType={globalDiscountType}
            globalDiscountValue={globalDiscountValue}
            onGlobalDiscountTypeChange={setGlobalDiscountType}
            onGlobalDiscountValueChange={setGlobalDiscountValue}
            showVatControl={false}
            inputHeight="h-8"
            selectedCurrency={financialData.currency}
          />
        </div>

        {/* Product Details Modal */}
        <ProductDetailsModal
          open={productModalOpen}
          onOpenChange={(open) => {
            setProductModalOpen(open);
            if (!open) {
              setEditingItemIndex(undefined);
              setSelectedProduct(null);
              setEditingItemData(null);
            }
          }}
          product={selectedProduct}
          onAddToProposal={(productData) => handleAddProductToInvoice(productData, editingItemIndex)}
          currency={financialData.currency}
          existingData={editingItemData}
        />
        
        {/* E-Fatura Tekrar Gönderme Onay Dialog'u */}
        <EInvoiceResendConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) handleCancelResend();
          }}
          currentStatus={confirmDialog.currentStatus}
          onConfirm={handleConfirmResend}
          onCancel={handleCancelResend}
        />
      </div>
    </div>
  );
};

export default CreateSalesInvoice;
