import React, { useState, useEffect, useMemo, useCallback } from "react";
import { logger } from '@/utils/logger';
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Plus, Trash, FileText, Eye, MoreHorizontal, Save, FileDown, Send, ShoppingCart, Printer, Receipt } from "lucide-react";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { ProposalStatus } from "@/types/proposal";
import { formatDateToLocalString } from "@/utils/dateUtils";
import { useProposalCreation } from "@/hooks/proposals/useProposalCreation";
import { ProposalItem } from "@/types/proposal";
import { supabase } from "@/integrations/supabase/client";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import ProposalPreviewModal from "@/components/proposals/form/ProposalPreviewModal";
import CompactProductForm from "@/components/einvoice/CompactProductForm";
import CustomerInfoCard from "@/components/proposals/cards/CustomerInfoCard";
import ProposalDetailsCard from "@/components/proposals/cards/ProposalDetailsCard";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import TermsConditionsCard from "@/components/proposals/cards/TermsConditionsCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { useNumberGenerator } from "@/hooks/useNumberGenerator";

// Constants
const DEFAULT_VAT_PERCENTAGE = 20;
const DEFAULT_CURRENCY = "TRY";
const DEFAULT_EXCHANGE_RATE = 1;
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT = "adet";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface CustomerData {
  contact_name: string;
  customer_id: string;
}

interface ProposalData {
  subject: string;
  offer_date: Date;
  offer_number: string;
  revision_number: number; // Revizyon numarası - yeni teklif için 0
  validity_date: Date | undefined;
  prepared_by: string;
  employee_id: string;
  notes: string;
  status: ProposalStatus;
}

interface FinancialData {
  currency: string;
  exchange_rate: number;
  vat_percentage: number;
}

interface TermsData {
  payment_terms: string;
  delivery_terms: string;
  warranty_terms: string;
  price_terms: string;
  other_terms: string;
}

interface SelectedTermsData {
  selected_payment_terms: string[];
  selected_delivery_terms: string[];
  selected_warranty_terms: string[];
  selected_pricing_terms: string[];
  selected_other_terms: string[];
}

interface NewProposalCreateProps {
  // Props removed as they were not being used
}

const NewProposalCreate = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const form = useForm({
    defaultValues: {
      customer_id: "",
      supplier_id: ""
    },
    mode: "onChange" // Form değişikliklerini anında yakala
  });
  const watchCustomerId = form.watch("customer_id");
  const { customers } = useCustomerSelect();
  const { userData } = useCurrentUser();
  const navigate = useNavigate();
  const { createProposal } = useProposalCreation();
  const { generateProposalNumber, loading: numberLoading } = useNumberGenerator();
  const { companyId, isLoading: companyLoading } = useCurrentCompany();

  // Revizyon bilgilerini location.state'ten al
  const revisionData = location.state?.revisionData;
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);
  const [isNewProductFormOpen, setIsNewProductFormOpen] = useState(false);
  const [newProductSearchTerm, setNewProductSearchTerm] = useState<string>("");
  
  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // PDF templates state
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Form state - Split into logical sections for better performance
  const [customerData, setCustomerData] = useState<CustomerData>({
    contact_name: "",
    customer_id: "",
  });

  const [proposalData, setProposalData] = useState<ProposalData>({
    subject: "",
    offer_date: new Date(),
    offer_number: "", // Component mount olduğunda otomatik oluşturulacak
    revision_number: 0, // Yeni teklif R0 olarak başlar
    validity_date: undefined,
    prepared_by: "",
    employee_id: "",
    notes: "",
    status: "draft"
  });

  const [financialData, setFinancialData] = useState<FinancialData>({
    currency: DEFAULT_CURRENCY,
    exchange_rate: DEFAULT_EXCHANGE_RATE,
    vat_percentage: DEFAULT_VAT_PERCENTAGE,
  });

  const [termsData, setTermsData] = useState<TermsData>({
    payment_terms: "Siparişle birlikte %50 avans, teslimde kalan tutar ödenecektir.",
    delivery_terms: "Teslimat süresi: Sipariş tarihinden itibaren 15-20 iş günü",
    warranty_terms: "Ürünlerimiz 2 yıl garantilidir.",
    price_terms: "",
    other_terms: "",
  });

  // Seçili şart ID'leri için state
  const [selectedTermsData, setSelectedTermsData] = useState<SelectedTermsData>({
    selected_payment_terms: [],
    selected_delivery_terms: [],
    selected_warranty_terms: [],
    selected_pricing_terms: [],
    selected_other_terms: [],
  });

  // Load templates when component mounts
  useEffect(() => {
    loadTemplates();
  }, []);

  // Revizyon bilgilerini form state'lerine aktar
  useEffect(() => {
    if (revisionData) {
      logger.debug('📋 Revizyon bilgileri yükleniyor:', revisionData);

      // Customer bilgilerini doldur
      if (revisionData.customer_id) {
        setCustomerData(prev => ({
          ...prev,
          customer_id: revisionData.customer_id,
          contact_name: revisionData.contact_name || ""
        }));

        // Form context'i de güncelle
        form.setValue('customer_id', revisionData.customer_id);
      }

      // Proposal bilgilerini doldur
      setProposalData(prev => ({
        ...prev,
        subject: revisionData.subject || "",
        offer_date: revisionData.offer_date ? new Date(revisionData.offer_date) : new Date(),
        offer_number: "", // Yeni numara oluşturulacak
        revision_number: revisionData.revision_number || 0,
        validity_date: undefined, // Yeni geçerlilik tarihi girilecek
        prepared_by: revisionData.employee_id || "",
        employee_id: revisionData.employee_id || "",
        notes: revisionData.notes || "",
        status: "draft"
      }));

      // Financial bilgilerini doldur
      setFinancialData(prev => ({
        ...prev,
        currency: revisionData.currency || "TRY",
        exchange_rate: revisionData.exchange_rate || 1,
        vat_percentage: DEFAULT_VAT_PERCENTAGE
      }));

      // Terms bilgilerini doldur
      setTermsData(prev => ({
        ...prev,
        payment_terms: revisionData.payment_terms || prev.payment_terms,
        delivery_terms: revisionData.delivery_terms || prev.delivery_terms,
        warranty_terms: revisionData.warranty_terms || prev.warranty_terms,
        price_terms: revisionData.price_terms || "",
        other_terms: revisionData.other_terms || ""
      }));

      // Items'ları doldur
      if (revisionData.items && revisionData.items.length > 0) {
        const revisionItems = revisionData.items.map((item: any, index: number) => ({
          ...item,
          id: Date.now().toString() + index, // Yeni ID oluştur
          row_number: index + 1
        }));
        setItems(revisionItems);
      }

      toast.success(`Revizyon R${revisionData.revision_number} hazırlandı. Formu doldurun ve kaydedin.`);
    }
  }, [revisionData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate proposal number when component mounts and companyId is ready
  useEffect(() => {
    // companyId yüklenene kadar bekle
    if (companyLoading || !companyId) {
      return;
    }

    // Eğer numara zaten varsa, tekrar üretme
    if (proposalData.offer_number && proposalData.offer_number !== '' && proposalData.offer_number !== 'TKF') {
      return;
    }

    const loadProposalNumber = async () => {
      try {
        const number = await generateProposalNumber();
        if (number && number !== 'TKF') {
          setProposalData(prev => ({ ...prev, offer_number: number }));
        } else {
          // Fallback to timestamp-based number if generation fails or returns invalid value
          setProposalData(prev => ({
            ...prev,
            offer_number: `TKF-${Date.now().toString().slice(-6)}`
          }));
        }
      } catch (error) {
        logger.error('Error generating proposal number:', error);
        // Fallback to timestamp-based number if generation fails
        setProposalData(prev => ({
          ...prev,
          offer_number: `TKF-${Date.now().toString().slice(-6)}`
        }));
      }
    };

    loadProposalNumber();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, companyLoading]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const data = await PdfExportService.getTemplates(undefined, 'quote');
      setTemplates(data);
    } catch (error) {
      logger.error('Error loading templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // handleFieldChange - State'lerden sonra tanımlanmalı
  const handleFieldChange = useCallback((field: string, value: any) => {
    logger.debug('🔍 handleFieldChange:', { field, value }); // Debug
    
    // Update the appropriate state based on field
    if (['contact_name', 'customer_id'].includes(field)) {
      setCustomerData(prev => ({ ...prev, [field]: value }));
    } else if (['subject', 'offer_date', 'offer_number', 'validity_date', 'prepared_by', 'employee_id', 'notes', 'status'].includes(field)) {
      setProposalData(prev => ({ ...prev, [field]: value }));
    } else if (['currency', 'exchange_rate', 'vat_percentage'].includes(field)) {
      setFinancialData(prev => ({ ...prev, [field]: value }));
    } else if (['payment_terms', 'delivery_terms', 'warranty_terms', 'price_terms', 'other_terms'].includes(field)) {
      logger.debug('🔍 Updating termsData:', { field, value }); // Debug
      setTermsData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  // Form değerlerini senkronize et - watchCustomerId değiştiğinde customerData'yı güncelle
  useEffect(() => {
    if (watchCustomerId && watchCustomerId.trim() && watchCustomerId !== customerData.customer_id) {
      handleFieldChange('customer_id', watchCustomerId);
    }
  }, [watchCustomerId, customerData.customer_id, handleFieldChange]);

  // Müşteri verilerini yükle
  useEffect(() => {
    const loadCustomerData = async () => {
      // watchCustomerId boş string olabilir, kontrol et
      if (watchCustomerId && watchCustomerId.trim()) {
        // Önce customers listesinde ara
        let selected = customers?.find(c => c.id === watchCustomerId);
        
        // Eğer listede bulunamazsa, veritabanından çek
        if (!selected) {
          try {
            const { data, error } = await supabase
              .from("customers")
              .select("id, name, company, email, mobile_phone, office_phone, address, representative")
              .eq("id", watchCustomerId)
              .single();
            
            if (!error && data) {
              selected = data;
            }
          } catch (error) {
            logger.error("Error fetching customer:", error);
          }
        }
        
        if (selected) {
          handleFieldChange('customer_id', watchCustomerId);
          
          // İletişim kişisi adı - name varsa kullan
          if (selected.name) {
            handleFieldChange('contact_name', selected.name);
          }
        }
      } else {
        // Müşteri seçimi kaldırıldıysa, ilgili alanları temizle
        // watchCustomerId boş olduğunda contact_name'i temizle
        handleFieldChange('contact_name', "");
      }
    };
    
    loadCustomerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCustomerId, customers, handleFieldChange]);

  // Combined form data for backward compatibility
  const formData = useMemo(() => ({
    ...customerData,
    ...proposalData,
    ...financialData,
    ...termsData,
    title: "",
    description: "",
  }), [customerData, proposalData, financialData, termsData]);

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
      total_price: 0,
      currency: DEFAULT_CURRENCY
    }
  ]);

  // Calculate totals by currency - Memoized for performance
  const calculationsByCurrency = useMemo(() => {
    const totals: Record<string, { gross: number; discount: number; net: number; vat: number; grand: number }> = {};
    
    // First, collect all currencies used in items (even if values are 0)
    const usedCurrencies = new Set<string>();
    items.forEach(item => {
      const currency = item.currency || 'TRY';
      usedCurrencies.add(currency);
    });
    
    // Initialize totals for all used currencies
    usedCurrencies.forEach(currency => {
      totals[currency] = { gross: 0, discount: 0, net: 0, vat: 0, grand: 0 };
    });
    
    // Calculate gross totals
    items.forEach(item => {
      const currency = item.currency || 'TRY';
      totals[currency].gross += item.quantity * item.unit_price;
    });
    
    // Calculate total gross across all currencies for global discount
    const totalGross = Object.values(totals).reduce((sum, total) => sum + total.gross, 0);
    
    // Apply global discount and VAT calculations for each currency
    Object.keys(totals).forEach(currency => {
      const gross = totals[currency].gross;
      
      // Calculate global discount proportionally for this currency
      let globalDiscount = 0;
      if (globalDiscountValue > 0 && totalGross > 0) {
        const currencyProportion = gross / totalGross;
        if (globalDiscountType === 'percentage') {
          globalDiscount = (gross * globalDiscountValue) / 100;
        } else {
          // Amount discount distributed proportionally
          globalDiscount = globalDiscountValue * currencyProportion;
        }
      }
      
      const net = gross - globalDiscount;
      const vat = (net * formData.vat_percentage) / 100;
      const grand = net + vat;
      
      totals[currency] = {
        gross,
        discount: globalDiscount,
        net,
        vat,
        grand
      };
    });
    
    return totals;
  }, [items, formData.currency, formData.vat_percentage, globalDiscountValue, globalDiscountType]);
  
  // Legacy calculations for backward compatibility (using primary currency)
  const primaryCurrency = formData.currency;
  const primaryTotals = calculationsByCurrency[primaryCurrency] || {
    gross: 0,
    discount: 0,
    net: 0,
    vat: 0,
    grand: 0
  };
  
  const calculations = {
    gross_total: primaryTotals.gross,
    discount_amount: primaryTotals.discount,
    net_total: primaryTotals.net,
    vat_amount: primaryTotals.vat,
    grand_total: primaryTotals.grand
  };

  // Item calculations are handled in handleItemChange

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
        total_price: 0,
        currency: formData.currency
      };
      return [...prevItems, newItem];
    });
  }, [formData.currency]);

  const removeItem = useCallback((index: number) => {
    setItems(prevItems => {
      if (prevItems.length > 1) {
        const updatedItems = prevItems.filter((_, i) => i !== index);
        // Renumber items
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
  }, []);

  const moveItemUp = useCallback((index: number) => {
    setItems(prevItems => {
      if (index > 0) {
        const updatedItems = [...prevItems];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(index - 1, 0, movedItem);
        
        // Renumber items
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
  }, []);

  const moveItemDown = useCallback((index: number) => {
    setItems(prevItems => {
      if (index < prevItems.length - 1) {
        const updatedItems = [...prevItems];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(index + 1, 0, movedItem);
        
        // Renumber items
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prevItems;
    });
  }, []);

  const handleProductModalSelect = (product: any, itemIndex?: number) => {
    setSelectedProduct(product);
    setEditingItemIndex(itemIndex);
    // Eğer product'ta existingData varsa (aynı ürün tekrar seçildiğinde), onu kullan
    if (product?.existingData) {
      setEditingItemData(product.existingData);
    } else {
      // Yeni ürün seçildiğinde veya existingData yoksa null yap
      setEditingItemData(null);
    }
    setProductModalOpen(true);
  };

  const handleNewProduct = (searchTerm?: string) => {
    setNewProductSearchTerm(searchTerm || "");
    setIsNewProductFormOpen(true);
  };

  const handleProductCreated = async (newProduct: any) => {
    // Invalidate products query so dropdown refreshes
    await queryClient.invalidateQueries({ queryKey: ["products-infinite"] });
    
    // Yeni oluşturulan ürünü seçili hale getir ve modal'ı aç
    handleProductModalSelect(newProduct);
    
    setIsNewProductFormOpen(false);
    setNewProductSearchTerm("");
    toast.success("Ürün başarıyla oluşturuldu");
  };

  const handleAddProductToProposal = (productData: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        product_id: productData.id, // Required: product_id for fetching image from products table
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate,
        discount_rate: productData.discount_rate,
        total_price: productData.total_price,
        currency: productData.currency || formData.currency,
        // image_url removed: Always fetch from products table using product_id
      };
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: LineItem = {
        id: Date.now().toString(),
        product_id: productData.id, // Required: product_id for fetching image from products table
        row_number: items.length + 1,
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate,
        discount_rate: productData.discount_rate,
        total_price: productData.total_price,
        currency: productData.currency || formData.currency,
        // image_url removed: Always fetch from products table using product_id
      };
      setItems([...items, newItem]);
    }
    
    setProductModalOpen(false);
    setEditingItemIndex(undefined);
    setSelectedProduct(null);
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    // Müşteri bilgileri validasyonu - hem formData hem de React Hook Form state'ini kontrol et
    // Önce watchCustomerId'yi kontrol et (React Hook Form'dan gelir, daha güncel)
    const customerIdFromForm = watchCustomerId && typeof watchCustomerId === 'string' ? watchCustomerId.trim() : '';
    const customerIdFromData = formData.customer_id && typeof formData.customer_id === 'string' ? formData.customer_id.trim() : '';
    const customerId = customerIdFromForm || customerIdFromData;
    
    if (!customerId) {
      errors.push("Müşteri bilgisi seçilmelidir");
      return errors; // Erken çıkış, diğer validasyonlara gerek yok
    }
    
      // Eğer customer_id React Hook Form'da var ama formData'da yoksa, senkronize et
    // Not: Bu state güncellemesi asenkron olabilir ama validasyon için watchCustomerId yeterli
      if (watchCustomerId && !formData.customer_id) {
        handleFieldChange('customer_id', watchCustomerId);
      }
      
      // İletişim kişisi kontrolü - eğer customer_id varsa ama contact_name yoksa, müşteriden al
    const finalCustomerId = watchCustomerId || formData.customer_id;
      if (finalCustomerId && !formData.contact_name?.trim()) {
        const selected = customers?.find(c => c.id === finalCustomerId);
        if (selected && selected.name) {
          // Müşteri bilgilerini doldur
          handleFieldChange('contact_name', selected.name);
      }
    }
    
    // Tarih validasyonu
    if (!formData.validity_date) {
      errors.push("Geçerlilik tarihi gereklidir");
    } else if (formData.validity_date < new Date()) {
      errors.push("Geçerlilik tarihi bugünden sonra olmalıdır");
    }
    
    // Teklif konusu validasyonu
    if (!formData.subject.trim()) {
      errors.push("Teklif konusu gereklidir");
    }
    
    // Ürün/hizmet validasyonu
    const validItems = items.filter(item => 
      item.name.trim() || item.description.trim()
    );
    
    if (validItems.length === 0) {
      errors.push("En az bir teklif kalemi eklenmelidir");
    }
    
    // Ürün/hizmet detay validasyonu
    validItems.forEach((item, index) => {
      if (!item.name.trim() && !item.description.trim()) {
        errors.push(`${index + 1}. satırda ürün/hizmet adı gereklidir`);
      }
      if (item.quantity <= 0) {
        errors.push(`${index + 1}. satırda miktar 0'dan büyük olmalıdır`);
      }
      if (item.unit_price < 0) {
        errors.push(`${index + 1}. satırda birim fiyat negatif olamaz`);
      }
    });
    
    return errors;
  };

  const handleSave = async (status: ProposalStatus = formData.status) => {
    try {
      // Form validasyonu
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }
      
      const validItems = items.filter(item => 
        item.name.trim() || item.description.trim()
      );

      setSaving(true);
      // Auto-detect primary currency from items (use the currency with highest total) - Same logic as ProposalEdit
      const currencyTotals = Object.entries(calculationsByCurrency);
      const [detectedCurrency] = currencyTotals.length > 0 
        ? currencyTotals.reduce((max, current) => current[1].grand > max[1].grand ? current : max)
        : ['TRY', { grand: 0 }];
      
      // Use detected currency or fallback to form currency
      const primaryCurrency = detectedCurrency || formData.currency;
      const primaryTotals = calculationsByCurrency[primaryCurrency] || {
        gross: 0,
        discount: 0,
        net: 0,
        vat: 0,
        grand: 0
      };

      // Müşteri bilgilerini tekrar kontrol et
      // Önce React Hook Form'dan customer_id'yi al (daha güncel), yoksa formData'dan
      const finalCustomerIdFromForm = watchCustomerId && typeof watchCustomerId === 'string' ? watchCustomerId.trim() : '';
      const finalCustomerIdFromData = formData.customer_id && typeof formData.customer_id === 'string' ? formData.customer_id.trim() : '';
      const finalCustomerId = finalCustomerIdFromForm || finalCustomerIdFromData;
      
      if (!finalCustomerId) {
        toast.error("Müşteri bilgisi seçilmelidir");
        setSaving(false);
        return;
      }
      
      // Eğer formData'da customer_id yoksa, senkronize et
      if (!formData.customer_id && finalCustomerId) {
        handleFieldChange('customer_id', finalCustomerId);
      }
      
      // Müşteri bilgisinden şirket adını al (customer_company alanı yok, direkt müşteriden al)
      let customerCompanyName = "Müşteri";
      if (finalCustomerId) {
        const selected = customers?.find(c => c.id === finalCustomerId);
        if (selected) {
          customerCompanyName = selected.company || selected.name || "Müşteri";
        } else {
          // Veritabanından çek
          try {
            const { data } = await supabase
              .from("customers")
              .select("company, name")
              .eq("id", finalCustomerId)
              .single();
            if (data) {
              customerCompanyName = data.company || data.name || "Müşteri";
            }
          } catch (error) {
            logger.error("Error fetching customer for title:", error);
            customerCompanyName = "Müşteri";
          }
        }
      }
      
      // Prepare data for backend
      // customer_id boş olamaz, eğer boşsa hata ver
      if (!finalCustomerId) {
        toast.error("Müşteri bilgisi seçilmelidir");
        setSaving(false);
        return;
      }

      // company_id kontrolü - eğer userData'da yoksa hata ver
      if (!userData?.company_id) {
        toast.error("Şirket bilgisi bulunamadı. Lütfen tekrar giriş yapın.");
        setSaving(false);
        return;
      }

      // offer_date kontrolü - eğer Date objesi ise formatla, yoksa null
      // Eğer offer_date yoksa veya null ise, bugünün tarihini kullan
      let offerDateValue: string | null = null;
      if (formData.offer_date) {
        if (formData.offer_date instanceof Date) {
          offerDateValue = formatDateToLocalString(formData.offer_date);
        } else if (typeof formData.offer_date === 'string') {
          offerDateValue = formData.offer_date;
        }
      }
      
      // Eğer hala null ise, bugünün tarihini kullan
      if (!offerDateValue) {
        offerDateValue = formatDateToLocalString(new Date());
        logger.debug('⚠️ offer_date was null/undefined, using today\'s date:', offerDateValue);
      }

      logger.debug('💾 Saving proposal with offer_date:', offerDateValue, 'from formData.offer_date:', formData.offer_date);

      const proposalData = {
        title: `${customerCompanyName} - Teklif`,
        subject: formData.subject, // Teklif konusu
        description: formData.notes,
        number: formData.offer_number,
        customer_id: finalCustomerId, // Boş olamaz, yukarıda kontrol edildi
        employee_id: formData.prepared_by || null,
        company_id: userData.company_id, // Kullanıcının company_id'si (artık null olamaz)
        offer_date: offerDateValue, // Teklif tarihi (yerel timezone)
        valid_until: formData.validity_date ? formatDateToLocalString(formData.validity_date) : "",
        terms: `${termsData.payment_terms}\n\n${termsData.delivery_terms}\n\nGaranti: ${termsData.warranty_terms}`,
        payment_terms: termsData.payment_terms,
        delivery_terms: termsData.delivery_terms,
        warranty_terms: termsData.warranty_terms,
        price_terms: termsData.price_terms,
        other_terms: termsData.other_terms,
        // Seçili şart ID'leri
        selected_payment_terms: selectedTermsData.selected_payment_terms,
        selected_delivery_terms: selectedTermsData.selected_delivery_terms,
        selected_warranty_terms: selectedTermsData.selected_warranty_terms,
        selected_pricing_terms: selectedTermsData.selected_pricing_terms,
        selected_other_terms: selectedTermsData.selected_other_terms,
        notes: formData.notes,
        status: status,
        total_amount: primaryTotals.grand,
        currency: primaryCurrency,
        exchange_rate: formData.exchange_rate, // Döviz kuru
        // Override hook's calculation with our computed total
        computed_total_amount: primaryTotals.grand,
        // Revizyon bilgileri (eğer revizyon ise)
        parent_proposal_id: revisionData?.parent_proposal_id || null,
        revision_number: revisionData?.revision_number || 0,
        items: validItems.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price
        }))
      };

      const result = await createProposal(proposalData);
      if (result) {
        // Invalidate all proposal queries to refresh the table
        queryClient.invalidateQueries({ queryKey: ['proposals'] });
        queryClient.invalidateQueries({ queryKey: ['proposals-infinite'] });
        // Hemen refetch yap - tablo otomatik yenilensin
        await queryClient.refetchQueries({ queryKey: ['proposals-infinite'] });
        
        toast.success(status === 'draft' ? "Teklif taslak olarak kaydedildi" : "Teklif başarıyla oluşturuldu");
        
        // Yeni oluşturulan teklifi düzenleme sayfasına yönlendir
        if (result.data?.id) {
          navigate(`/proposal/${result.data.id}`);
        } else if ((result as any).id) {
          navigate(`/proposal/${(result as any).id}`);
        } else {
          // Eğer ID bulunamazsa, teklifler sayfasına dön
        navigate("/proposals");
        }
      }
    } catch (error) {
      logger.error('Error saving proposal:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Teklif kaydedilirken bir hata oluştu";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Smart save function - determines save type based on form completion
  const handleSmartSave = () => {
    // Check if form is complete enough to be sent as proposal
    // watchCustomerId'yi de kontrol et (React Hook Form'dan gelir, daha güncel)
    // Boş string kontrolü de yap (watchCustomerId boş string olabilir)
    const customerId = (watchCustomerId && watchCustomerId.trim()) || (formData.customer_id && formData.customer_id.trim());
    const isFormComplete = 
      customerId && 
      formData.contact_name && 
      formData.subject && 
      formData.validity_date &&
      items.length > 0 &&
      items.every(item => item.name && item.quantity && item.unit_price > 0);

    if (isFormComplete) {
      // Form is complete, save as sent proposal
      handleSave('sent');
    } else {
      // Form is incomplete, save as draft
      handleSave('draft');
    }
  };

  // Preview functions
  const handlePreview = () => {
    setPreviewModalOpen(true);
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export functionality
    toast.info("PDF export özelliği yakında eklenecek");
  };

  const handleSendEmail = () => {
    // TODO: Implement email sending functionality
    toast.info("E-posta gönderimi özelliği yakında eklenecek");
  };

  // Workflow functions
  const handleConvertToOrder = () => {
    // TODO: Implement convert to order functionality
    toast.info("Teklif siparişe çevrildi! Sipariş sayfasına yönlendiriliyorsunuz...");
    // navigate("/orders/create", { state: { proposalData: formData, items } });
  };

  const handleConvertToInvoice = () => {
    // TODO: Implement convert to invoice functionality
    toast.info("Fatura oluşturma özelliği yakında eklenecek");
    // navigate("/sales-invoices/create", { state: { proposalData: formData, items } });
  };

  const handlePdfPrint = async (templateId?: string) => {
    // Önce teklifi kaydet
    toast.info("PDF oluşturmak için önce teklifi kaydedin");
  };


  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header with Progress */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Simple Back Button */}
            <BackButton 
              onClick={() => navigate("/proposals")}
              variant="ghost"
              size="sm"
            >
              Teklifler
            </BackButton>
            
            {/* Simple Title Section with Icon */}
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {revisionData ? 'Yeni Revizyon Oluştur' : 'Yeni Teklif Oluştur'}
                  </h1>
                  {revisionData && revisionData.revision_number && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-700"
                    >
                      R{revisionData.revision_number}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/70">
                  {revisionData ? 'Revizyon bilgilerini düzenleyin ve kaydedin' : 'Hızlı ve kolay teklif oluşturma'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSmartSave}
              disabled={saving}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Kaydediliyor..." : "Kaydet"}</span>
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
                {/* Yazdırma İşlemleri */}
                <DropdownMenuLabel>Yazdırma</DropdownMenuLabel>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <Printer className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Yazdır</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {templates && templates.length > 0 ? (
                      templates.map((template) => (
                        <DropdownMenuItem
                          key={template.id}
                          onClick={() => handlePdfPrint(template.id)}
                          className="cursor-pointer"
                        >
                          <Printer className="h-4 w-4 mr-2 text-blue-500" />
                          <span>{template.name || 'PDF Yazdır'}</span>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Şablon bulunamadı
                      </div>
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={handlePreview} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4 text-slate-500" />
                  <span>Önizle</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendEmail} className="gap-2 cursor-pointer">
                  <Send className="h-4 w-4 text-slate-500" />
                  <span>E-posta Gönder</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Dönüştürme İşlemleri */}
                <DropdownMenuLabel>Dönüştür</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleConvertToOrder} className="gap-2 cursor-pointer">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                  <span>Siparişe Çevir</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleConvertToInvoice} className="gap-2 cursor-pointer">
                  <Receipt className="h-4 w-4 text-purple-500" />
                  <span>Faturaya Çevir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content - Her kart bağımsız Card komponenti */}
      <div className="space-y-4">
        {/* Top Row - Customer & Proposal Details Combined */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Customer Information */}
          <CustomerInfoCard
            formData={formData}
            handleFieldChange={handleFieldChange}
            errors={{}}
            form={form} // Ana form'u prop olarak geçir
          />

          {/* Offer Details */}
          <ProposalDetailsCard
            formData={formData}
            handleFieldChange={handleFieldChange}
            errors={{}}
          />
        </div>

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
              
              // Eğer product'ta existingData varsa edit modunda aç (edit butonundan geldi)
              // Yoksa yeni ekleme modunda aç (ProductSelector'dan geldi)
              if (product?.existingData) {
                // Edit butonundan geldi - edit modunda aç
                setEditingItemData(product.existingData);
              } else {
                // ProductSelector'dan geldi - yeni ekleme modunda aç
                setEditingItemData(null);
              }
              setProductModalOpen(true);
            } else {
              // Adding new item
              handleProductModalSelect(product, itemIndex);
            }
          }}
          onNewProduct={handleNewProduct}
          showMoveButtons={true}
          inputHeight="h-8"
        />

        {/* Terms and Financial Summary - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Terms & Conditions */}
          <TermsConditionsCard
            paymentTerms={formData.payment_terms}
            deliveryTerms={formData.delivery_terms}
            warrantyTerms={formData.warranty_terms}
            priceTerms={formData.price_terms}
            otherTerms={formData.other_terms}
            onInputChange={(e) => handleFieldChange(e.target.name, e.target.value)}
            selectedPaymentTerms={selectedTermsData.selected_payment_terms}
            selectedDeliveryTerms={selectedTermsData.selected_delivery_terms}
            selectedWarrantyTerms={selectedTermsData.selected_warranty_terms}
            selectedPricingTerms={selectedTermsData.selected_pricing_terms}
            selectedOtherTerms={selectedTermsData.selected_other_terms}
            onSelectedTermsChange={(category, termIds) => {
              setSelectedTermsData(prev => ({
                ...prev,
                [category]: termIds
              }));
            }}
          />

          {/* Financial Summary */}
          <FinancialSummaryCard
            calculationsByCurrency={calculationsByCurrency}
            globalDiscountType={globalDiscountType}
            globalDiscountValue={globalDiscountValue}
            onGlobalDiscountTypeChange={setGlobalDiscountType}
            onGlobalDiscountValueChange={setGlobalDiscountValue}
            showVatControl={false}
            inputHeight="h-8"
            selectedCurrency={formData.currency}
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
          onAddToProposal={(productData) => handleAddProductToProposal(productData, editingItemIndex)}
          currency={formData.currency}
          existingData={editingItemData}
        />

        {/* Compact Product Form - Yeni Ürün Oluştur */}
        <CompactProductForm
          isOpen={isNewProductFormOpen}
          onClose={() => {
            setIsNewProductFormOpen(false);
            setNewProductSearchTerm("");
          }}
          onProductCreated={handleProductCreated}
          isForSale={true}
          initialData={
            newProductSearchTerm
              ? {
                  name: newProductSearchTerm,
                  unit: "adet",
                  price: 0,
                  tax_rate: 20,
                }
              : undefined
          }
        />

        {/* Proposal Preview Modal */}
        <ProposalPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          formData={formData}
          items={items}
          calculationsByCurrency={calculationsByCurrency}
          onExportPDF={handleExportPDF}
          onSendEmail={handleSendEmail}
        />
      </div>
    </div>
  );
};

export default NewProposalCreate;