import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Receipt, Save, Eye, FileDown, Send, MoreHorizontal, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";
import InvoiceHeaderCard from "@/components/invoices/cards/InvoiceHeaderCard";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useEInvoice, useEInvoiceStatus } from "@/hooks/useEInvoice";
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalItem } from "@/types/proposal";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Constants
const DEFAULT_VAT_PERCENTAGE = 18;
const DEFAULT_CURRENCY = "TRY";
const DEFAULT_EXCHANGE_RATE = 1;

interface LineItem {
  id: string;
  row_number: number;
  name?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  total_price: number;
  currency?: string;
  seller_code?: string;
  buyer_code?: string;
}

interface InvoiceItem {
  id: string;
  urun_adi: string;
  aciklama: string;
  seller_code?: string;
  buyer_code?: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_orani: number;
  indirim_orani: number;
  satir_toplami: number;
  kdv_tutari: number;
}

interface InvoiceFormData {
  customer_id: string;
  fatura_tarihi: Date;
  issue_time: string;
  vade_tarihi: Date | null;
  aciklama: string;
  notlar: string;
  para_birimi: string;
  exchange_rate: number;
  odeme_sekli: string;
  banka_bilgileri: string;
  invoice_type: string;
  invoice_profile: string;
  send_type: string;
  sales_platform: string;
  is_despatch: boolean;
  internet_info: {
    website?: string;
    payment_method?: string;
    payment_method_name?: string;
    payment_tool_name?: string;
    payment_date?: string;
  };
  return_invoice_info: {
    invoice_number?: string;
    invoice_date?: string;
  };
}

const ProposalToInvoiceCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { customers } = useCustomerSelect();
  const { sendInvoice, isSending } = useEInvoice();
  const { profile } = useCurrentUser();
  
  // Get proposal ID from query parameters
  const queryParams = new URLSearchParams(location.search);
  const proposalId = queryParams.get("proposalId");
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const [assignedInvoiceNumber, setAssignedInvoiceNumber] = useState<string | null>(null);
  
  // E-fatura durumu takibi
  const { status: einvoiceStatus, refreshStatus } = useEInvoiceStatus(savedInvoiceId || undefined);
  
  const form = useForm({ defaultValues: { customer_id: "", supplier_id: "" } });
  const watchCustomerId = form.watch("customer_id");

  // Product modal states
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  // Selected customer
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState<InvoiceFormData>({
    customer_id: "",
    fatura_tarihi: new Date(),
    issue_time: format(new Date(), "HH:mm"),
    vade_tarihi: null,
    aciklama: "",
    notlar: "",
    para_birimi: DEFAULT_CURRENCY,
    exchange_rate: DEFAULT_EXCHANGE_RATE,
    odeme_sekli: "",
    banka_bilgileri: "",
    invoice_type: "SATIS",
    invoice_profile: "TEMELFATURA",
    send_type: "ELEKTRONIK",
    sales_platform: "NORMAL",
    is_despatch: false,
    internet_info: {},
    return_invoice_info: {},
  });

  // Invoice items state
  const [items, setItems] = useState<InvoiceItem[]>([{
    id: "1",
    urun_adi: "",
    aciklama: "",
    miktar: 1,
    birim: "adet",
    birim_fiyat: 0,
    kdv_orani: DEFAULT_VAT_PERCENTAGE,
    indirim_orani: 0,
    satir_toplami: 0,
    kdv_tutari: 0,
  }]);

  // Watch customer changes
  useEffect(() => {
    if (watchCustomerId) {
      const selected = customers?.find(c => c.id === watchCustomerId);
      if (selected) {
        setSelectedCustomer(selected);
        setFormData(prev => ({ ...prev, customer_id: watchCustomerId }));
      }
    }
  }, [watchCustomerId, customers]);

  // Load proposal data
  useEffect(() => {
    const fetchProposalData = async () => {
      if (!proposalId) {
        setError("Teklif ID'si bulunamadı. Lütfen teklif sayfasından faturaya çevirin.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch proposal with customer data
        const { data, error: fetchError } = await supabase
          .from("proposals")
          .select(`
            *,
            customer:customers(id, name, company, email, mobile_phone, office_phone, address, tax_office, tax_number)
          `)
          .eq("id", proposalId)
          .single();

        if (fetchError) {
          throw new Error("Teklif bilgileri yüklenemedi: " + fetchError.message);
        }

        if (!data) {
          throw new Error("Teklif bulunamadı");
        }

        setProposal(data);

        // Parse items if they're a string
        let proposalItems: ProposalItem[] = [];
        if (data.items) {
          if (typeof data.items === 'string') {
            try {
              proposalItems = JSON.parse(data.items);
            } catch (e) {
              console.error("Failed to parse items:", e);
            }
          } else if (Array.isArray(data.items)) {
            proposalItems = data.items as ProposalItem[];
          }
        }

        // Pre-populate customer data
        const customer = data.customer;
        if (customer) {
          setSelectedCustomer(customer);
          form.setValue("customer_id", data.customer_id);
        }

        // Build aciklama from proposal data
        const aciklamaParts = [];
        if (data.number) aciklamaParts.push(`Teklif No: ${data.number}`);
        if (data.title) aciklamaParts.push(data.title);
        if (data.subject) aciklamaParts.push(`Konu: ${data.subject}`);
        if (data.description) aciklamaParts.push(data.description);
        const aciklama = aciklamaParts.length > 0 ? aciklamaParts.join(' - ') : '';

        // Convert dates
        let faturaTarihi = new Date();
        if (data.offer_date) {
          try {
            const date = new Date(data.offer_date);
            if (!isNaN(date.getTime())) {
              faturaTarihi = date;
            }
          } catch (e) {
            console.warn("Invalid offer_date format");
          }
        }

        let vadeTarihi: Date | null = null;
        if (data.valid_until) {
          try {
            const date = new Date(data.valid_until);
            if (!isNaN(date.getTime())) {
              vadeTarihi = date;
            }
          } catch (e) {
            console.warn("Invalid valid_until format");
          }
        }

        const proposalCurrency = data.currency === 'TL' ? 'TRY' : (data.currency || DEFAULT_CURRENCY);

        // Pre-populate form data
        setFormData(prev => ({
          ...prev,
          customer_id: data.customer_id || "",
          fatura_tarihi: faturaTarihi,
          vade_tarihi: vadeTarihi,
          aciklama: aciklama,
          notlar: data.notes || "",
          para_birimi: proposalCurrency,
          exchange_rate: data.exchange_rate || (proposalCurrency === 'TRY' ? 1 : 1),
          odeme_sekli: data.payment_terms || "",
        }));

        // Set employee_id
        if (data.employee_id) {
          setEmployeeId(data.employee_id);
        }

        // Convert proposal items to invoice items
        if (proposalItems && proposalItems.length > 0) {
          const invoiceItems = proposalItems.map((item: any, index: number) => {
            const quantity = parseFloat(item.quantity || item.miktar || 1);
            const unitPrice = parseFloat(item.unit_price || item.unitPrice || item.birim_fiyat || 0);
            const discountRate = parseFloat(item.discount_rate || item.discountRate || item.indirim_orani || 0);
            const taxRate = parseFloat(item.tax_rate || item.taxRate || item.kdv_orani || DEFAULT_VAT_PERCENTAGE);
            
            const subtotal = quantity * unitPrice;
            const discountAmount = (subtotal * discountRate) / 100;
            const discountedSubtotal = subtotal - discountAmount;
            const taxAmount = (discountedSubtotal * taxRate) / 100;

            return {
              id: (index + 1).toString(),
              urun_adi: item.name || item.urun_adi || item.product_name || "",
              aciklama: item.description || item.aciklama || "",
              seller_code: item.seller_code || undefined,
              buyer_code: item.buyer_code || undefined,
              miktar: quantity,
              birim: item.unit || item.birim || "adet",
              birim_fiyat: unitPrice,
              kdv_orani: taxRate,
              indirim_orani: discountRate,
              satir_toplami: discountedSubtotal,
              kdv_tutari: taxAmount,
            };
          });
          setItems(invoiceItems);
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching proposal:", err);
        setError(err.message || "Teklif yüklenirken bir hata oluştu");
        setLoading(false);
      }
    };

    fetchProposalData();
  }, [proposalId]);

  // Calculate item totals
  const calculateItemTotals = (item: InvoiceItem): InvoiceItem => {
    const subtotal = item.miktar * item.birim_fiyat;
    const discountAmount = (subtotal * item.indirim_orani) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    const taxAmount = (discountedSubtotal * item.kdv_orani) / 100;
    
    return {
      ...item,
      satir_toplami: discountedSubtotal,
      kdv_tutari: taxAmount,
    };
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    updatedItems[index] = calculateItemTotals(updatedItems[index]);
    setItems(updatedItems);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: (items.length + 1).toString(),
      urun_adi: "",
      aciklama: "",
      miktar: 1,
      birim: "adet",
      birim_fiyat: 0,
      kdv_orani: DEFAULT_VAT_PERCENTAGE,
      indirim_orani: 0,
      satir_toplami: 0,
      kdv_tutari: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const moveItemUp = (index: number) => {
    if (index > 0) {
      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      setItems(newItems);
    }
  };

  const moveItemDown = (index: number) => {
    if (index < items.length - 1) {
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setItems(newItems);
    }
  };

  // ProductServiceCard formatına uygun handleItemChange
  const handleItemChange = useCallback((index: number, field: string, value: any) => {
    const fieldMapping: Record<string, keyof InvoiceItem> = {
      'name': 'urun_adi',
      'description': 'aciklama',
      'quantity': 'miktar',
      'unit': 'birim',
      'unit_price': 'birim_fiyat',
      'tax_rate': 'kdv_orani',
      'discount_rate': 'indirim_orani',
    };

    const mappedField = fieldMapping[field] || field;
    updateItem(index, mappedField as keyof InvoiceItem, value);
  }, [items]);

  // Product modal'dan ürün seçildiğinde
  const handleProductModalSelect = (product: any, itemIndex?: number) => {
    if (!product) return;

    const newItem: InvoiceItem = {
      id: (items.length + 1).toString(),
      urun_adi: product.name || product.product_name || "",
      aciklama: product.description || "",
      seller_code: product.seller_code || undefined,
      buyer_code: product.buyer_code || undefined,
      miktar: parseFloat(product.quantity) || 1,
      birim: product.unit || "adet",
      birim_fiyat: parseFloat(product.unit_price) || parseFloat(product.price) || 0,
      kdv_orani: parseFloat(product.tax_rate) || DEFAULT_VAT_PERCENTAGE,
      indirim_orani: parseFloat(product.discount_rate) || 0,
      satir_toplami: 0,
      kdv_tutari: 0,
    };

    const calculatedItem = calculateItemTotals(newItem);

    if (itemIndex !== undefined && itemIndex >= 0 && itemIndex < items.length) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = { ...calculatedItem, id: items[itemIndex].id };
      setItems(updatedItems);
    } else {
      setItems([...items, calculatedItem]);
    }

    setProductModalOpen(false);
    setSelectedProduct(null);
    setEditingItemIndex(undefined);
    setEditingItemData(null);
  };

  const handleAddProductToInvoice = (productData: any) => {
    handleProductModalSelect(productData, editingItemIndex);
  };

  // Calculate totals
  const totals = useMemo(() => {
    const indirim_tutari = items.reduce((sum, item) => {
      const subtotal = item.miktar * item.birim_fiyat;
      const discountAmount = (subtotal * item.indirim_orani) / 100;
      return sum + discountAmount;
    }, 0);
    
    const ara_toplam = items.reduce((sum, item) => sum + item.satir_toplami, 0);
    const kdv_tutari = items.reduce((sum, item) => sum + item.kdv_tutari, 0);
    const toplam_tutar = ara_toplam + kdv_tutari;

    return { ara_toplam, kdv_tutari, toplam_tutar, indirim_tutari };
  }, [items]);

  // Items'ı ProductServiceCard formatına dönüştür
  const productServiceItems = useMemo(() => {
    return items.map((item, index) => ({
      id: item.id,
      row_number: index + 1,
      name: item.urun_adi,
      description: item.aciklama,
      quantity: item.miktar,
      unit: item.birim,
      unit_price: item.birim_fiyat,
      tax_rate: item.kdv_orani,
      discount_rate: item.indirim_orani,
      total_price: item.satir_toplami + item.kdv_tutari,
      currency: formData.para_birimi,
    }));
  }, [items, formData.para_birimi]);

  // Calculations for FinancialSummaryCard
  const calculationsByCurrency = useMemo(() => {
    const currency = formData.para_birimi || DEFAULT_CURRENCY;
    
    // Calculate gross (brüt toplam - indirim öncesi)
    const gross = items.reduce((sum, item) => {
      return sum + (item.miktar * item.birim_fiyat);
    }, 0);

    // Calculate total discount from items (item bazlı indirimler)
    const itemDiscounts = items.reduce((sum, item) => {
      const subtotal = item.miktar * item.birim_fiyat;
      const discountAmount = (subtotal * item.indirim_orani) / 100;
      return sum + discountAmount;
    }, 0);

    // Apply global discount (sadece gösterim için, item'lara uygulanmaz)
    let globalDiscount = 0;
    if (globalDiscountValue > 0 && gross > 0) {
      if (globalDiscountType === 'percentage') {
        globalDiscount = (gross * globalDiscountValue) / 100;
      } else {
        // Amount discount
        globalDiscount = globalDiscountValue;
      }
    }

    // Total discount = item discounts + global discount
    const totalDiscount = itemDiscounts + globalDiscount;
    
    // Net = gross - total discount
    const net = gross - totalDiscount;
    
    // VAT: Item bazlı KDV'ler toplamı (global discount'tan etkilenmez)
    // Ancak global discount varsa, net üzerinden ortalama KDV oranıyla yeniden hesaplayabiliriz
    // Ama fatura sisteminde genelde item bazlı KDV korunur
    const vat = totals.kdv_tutari;
    
    // Grand total: net + vat
    // Not: Global discount uygulandığında, VAT'ı da yeniden hesaplamak gerekebilir
    // Ama fatura sisteminde genelde item bazlı hesaplamalar korunur
    const grand = net + vat;

    return {
      [currency]: {
        gross,
        discount: totalDiscount,
        net,
        vat,
        grand
      }
    };
  }, [items, totals.kdv_tutari, formData.para_birimi, globalDiscountValue, globalDiscountType]);

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save invoice
  const handleSave = async (status: 'taslak' | 'onaylandi' = 'taslak') => {
    try {
      setSaving(true);

      // Validation
      const customerId = formData.customer_id || form.getValues("customer_id");
      if (!customerId) {
        toast.error("Lütfen bir müşteri seçin");
        return;
      }

      const emptyItems = items.filter(item => !item.urun_adi.trim() || item.miktar <= 0 || item.birim_fiyat <= 0);
      if (emptyItems.length > 0) {
        toast.error("Lütfen tüm kalemleri eksiksiz doldurun");
        return;
      }

      // Format issue_time
      const issueTimeFormatted = formData.issue_time 
        ? `${formData.issue_time}:00` 
        : null;

      // Clean internet_info
      const internetInfo = formData.sales_platform === "INTERNET" && formData.internet_info
        ? Object.fromEntries(
            Object.entries(formData.internet_info).filter(([_, v]) => v !== null && v !== undefined && v !== "")
          )
        : null;

      // Clean return_invoice_info
      const returnInvoiceInfo = formData.invoice_type === "IADE" && formData.return_invoice_info
        ? Object.fromEntries(
            Object.entries(formData.return_invoice_info).filter(([_, v]) => v !== null && v !== undefined && v !== "")
          )
        : null;

      const invoiceData = {
        proposal_id: proposalId || null,
        customer_id: customerId,
        employee_id: employeeId || null,
        fatura_no: null,
        fatura_tarihi: format(formData.fatura_tarihi, "yyyy-MM-dd"),
        issue_time: issueTimeFormatted,
        invoice_type: formData.invoice_type || "SATIS",
        invoice_profile: formData.invoice_profile || "TEMELFATURA",
        send_type: formData.send_type || "ELEKTRONIK",
        sales_platform: formData.sales_platform || "NORMAL",
        is_despatch: formData.is_despatch || false,
        internet_info: internetInfo || {},
        return_invoice_info: returnInvoiceInfo || null,
        exchange_rate: formData.exchange_rate || 1,
        vade_tarihi: formData.vade_tarihi ? format(formData.vade_tarihi, "yyyy-MM-dd") : null,
        aciklama: formData.aciklama,
        notlar: formData.notlar,
        para_birimi: formData.para_birimi,
        ara_toplam: totals.ara_toplam,
        kdv_tutari: totals.kdv_tutari,
        indirim_tutari: totals.indirim_tutari,
        toplam_tutar: totals.toplam_tutar,
        odeme_sekli: formData.odeme_sekli,
        banka_bilgileri: formData.banka_bilgileri,
        durum: status,
        odeme_durumu: "odenmedi",
        odenen_tutar: 0,
        company_id: profile?.company_id,
      };

      // Insert invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert([invoiceData])
        .select()
        .single();

      if (invoiceError) {
        throw new Error("Fatura kaydedilemedi: " + invoiceError.message);
      }

      if (!invoice) {
        throw new Error("Fatura oluşturulamadı");
      }

      // Create invoice items
      const invoiceItems = items.map(item => ({
        sales_invoice_id: invoice.id,
        urun_adi: item.urun_adi,
        aciklama: item.aciklama,
        seller_code: item.seller_code || null,
        buyer_code: item.buyer_code || null,
        miktar: item.miktar,
        birim: item.birim,
        birim_fiyat: item.birim_fiyat,
        kdv_orani: item.kdv_orani,
        indirim_orani: item.indirim_orani,
        satir_toplami: item.satir_toplami,
        kdv_tutari: item.kdv_tutari,
        para_birimi: formData.para_birimi,
        company_id: profile?.company_id,
      }));

      const { error: itemsError } = await supabase
        .from("sales_invoice_items")
        .insert(invoiceItems);

      if (itemsError) {
        throw new Error("Fatura kalemleri kaydedilemedi: " + itemsError.message);
      }

      // Update proposal status
      if (proposalId) {
        await supabase
          .from("proposals")
          .update({ status: "invoiced" })
          .eq("id", proposalId);
      }

      setSavedInvoiceId(invoice.id);
      
      toast.success(
        status === 'taslak' 
          ? "✅ Fatura taslak olarak kaydedildi!" 
          : "✅ Fatura başarıyla oluşturuldu!",
        { duration: 5000 }
      );

      // Navigate to invoice detail
      setTimeout(() => {
        navigate(`/sales-invoices/${invoice.id}`);
      }, 1500);

    } catch (err: any) {
      console.error("Error saving invoice:", err);
      toast.error(`❌ ${err.message || "Fatura kaydedilirken hata oluştu"}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle PDF export
  const handleExportPDF = () => {
    toast.info("PDF indirme özelliği yakında eklenecek");
  };

  // Handle email send
  const handleSendEmail = () => {
    toast.info("E-posta gönderme özelliği yakında eklenecek");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Teklif bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/proposals")} variant="outline">
            Teklifler Sayfasına Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200/80 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BackButton fallbackPath="/proposals" />
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                  <Receipt className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Tekliften Fatura Oluştur</h1>
                  <p className="text-xs text-gray-500">
                    {proposal?.number && `Teklif: ${proposal.number}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Save as Draft Button */}
              <Button
                onClick={() => handleSave('taslak')}
                disabled={saving}
                variant="outline"
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span className="font-medium">Taslak Kaydet</span>
              </Button>

              {/* Create Invoice Button */}
              <Button
                onClick={() => handleSave('onaylandi')}
                disabled={saving}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Receipt className="h-4 w-4" />
                )}
                <span className="font-medium">Fatura Oluştur</span>
              </Button>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 px-3">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="font-medium">İşlemler</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Görüntüleme</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                    <FileDown className="h-4 w-4" />
                    <span>PDF İndir</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendEmail} className="gap-2 cursor-pointer">
                    <Send className="h-4 w-4" />
                    <span>E-posta Gönder</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Proposal Info Banner */}
        {proposal && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">Kaynak Teklif:</span>
                  <Badge variant="outline" className="bg-white/50">{proposal.number}</Badge>
                </div>
                <div className="h-4 w-px bg-green-300 hidden sm:block" />
                <div className="text-green-700">
                  {proposal.subject || proposal.title}
                </div>
                {proposal.total_amount && (
                  <>
                    <div className="h-4 w-px bg-green-300 hidden sm:block" />
                    <div className="font-medium text-green-900">
                      {formatCurrency(proposal.total_amount, proposal.currency || 'TRY')}
                    </div>
                  </>
                )}
                {selectedCustomer && (
                  <>
                    <div className="h-4 w-px bg-green-300 hidden sm:block" />
                    <div className="text-green-700">
                      <span className="font-medium">Müşteri:</span> {selectedCustomer.company || selectedCustomer.name}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <FormProvider {...form}>
          {/* Invoice Header Card */}
          <InvoiceHeaderCard
            selectedCustomer={selectedCustomer}
            formData={formData}
            assignedInvoiceNumber={assignedInvoiceNumber}
            einvoiceStatus={einvoiceStatus}
            onFieldChange={handleFieldChange}
            form={form}
          />

          {/* Products/Services Table */}
          <ProductServiceCard
            items={productServiceItems}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onMoveItemUp={moveItemUp}
            onMoveItemDown={moveItemDown}
            onItemChange={handleItemChange}
            onProductModalSelect={(product, itemIndex) => {
              if (itemIndex !== undefined) {
                setSelectedProduct(null);
                setEditingItemIndex(itemIndex);
                setEditingItemData(product);
                setProductModalOpen(true);
              } else {
                handleProductModalSelect(product, itemIndex);
              }
            }}
            showMoveButtons={true}
            inputHeight="h-10"
          />

          {/* Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"></div>
            <FinancialSummaryCard
              calculationsByCurrency={calculationsByCurrency}
              globalDiscountType={globalDiscountType}
              globalDiscountValue={globalDiscountValue}
              onGlobalDiscountTypeChange={setGlobalDiscountType}
              onGlobalDiscountValueChange={setGlobalDiscountValue}
              showVatControl={false}
              inputHeight="h-10"
              selectedCurrency={formData.para_birimi}
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
            onAddToProposal={handleAddProductToInvoice}
            currency={formData.para_birimi}
            existingData={editingItemData}
          />
        </FormProvider>
      </div>
    </div>
  );
};

export default ProposalToInvoiceCreate;

