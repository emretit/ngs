import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2, Info, FileText, MoreHorizontal, Send, FileDown } from "lucide-react";
import { toast } from "sonner";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { useEInvoice, useEInvoiceStatus } from "@/hooks/useEInvoice";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import InvoiceHeaderCard from "@/components/invoices/cards/InvoiceHeaderCard";
import InvoiceItemsCard from "@/components/invoices/cards/InvoiceItemsCard";
import InvoiceFinancialCard from "@/components/invoices/cards/InvoiceFinancialCard";
import InvoiceEInvoiceCard from "@/components/invoices/cards/InvoiceEInvoiceCard";

interface InvoiceItem {
  id: string;
  urun_adi: string;
  aciklama: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_orani: number;
  indirim_orani: number;
  satir_toplami: number;
  kdv_tutari: number;
}

interface CreateSalesInvoiceProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CreateSalesInvoice = ({ isCollapsed, setIsCollapsed }: CreateSalesInvoiceProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customers: customerOptions, isLoading: isLoadingCustomers } = useCustomerSelect();
  const { sendInvoice, isSending } = useEInvoice();
  const orderId = searchParams.get("orderId");
  const proposalId = searchParams.get("proposalId");

  // React Hook Form setup for ProposalPartnerSelect
  const form = useForm({ 
    defaultValues: { 
      customer_id: "", 
      supplier_id: "" 
    },
    mode: "onChange"
  });
  const watchCustomerId = form.watch("customer_id");

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [proposalData, setProposalData] = useState<any>(null);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null);
  const [assignedInvoiceNumber, setAssignedInvoiceNumber] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
  // E-fatura durumu takibi
  const { status: einvoiceStatus, refreshStatus } = useEInvoiceStatus(savedInvoiceId || undefined);
  
  const [formData, setFormData] = useState({
    customer_id: "",
    fatura_no: "", // Boş bırakılacak, E-fatura gönderilirken otomatik atanacak
    fatura_tarihi: new Date(),
    vade_tarihi: null as Date | null,
    aciklama: "",
    notlar: "",
    para_birimi: "TRY",
    odeme_sekli: "",
    banka_bilgileri: "",
  });

  // Müşteri seçildiğinde bilgilerini yükle (form'dan gelen değeri kullan)
  useEffect(() => {
    if (watchCustomerId && watchCustomerId !== formData.customer_id) {
      handleCustomerChange(watchCustomerId);
      setFormData(prev => ({ ...prev, customer_id: watchCustomerId }));
    }
  }, [watchCustomerId]);

  const handleCustomerChange = async (customerId: string) => {
    setFormData({ ...formData, customer_id: customerId });
    
    // Müşteri bilgilerini çek
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (!error && customer) {
      setSelectedCustomer(customer);
    }
  };

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      urun_adi: "",
      aciklama: "",
      miktar: 1,
      birim: "adet",
      birim_fiyat: 0,
      kdv_orani: 18,
      indirim_orani: 0,
      satir_toplami: 0,
      kdv_tutari: 0,
    }
  ]);

  // Load order data if orderId is provided, or proposal data if proposalId is provided
  useEffect(() => {
    if (orderId) {
      loadOrderData(orderId);
    } else if (proposalId) {
      loadProposalData(proposalId);
    }
  }, [orderId, proposalId]);

  const loadOrderData = async (id: string) => {
    try {
      setLoadingData(true);
      const { data: order, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:customers(*),
          items:order_items(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (order) {
        setOrderData(order);
        
        // Build aciklama from description, order_number and title
        const aciklamaParts = [];
        if (order.order_number) aciklamaParts.push(`Sipariş No: ${order.order_number}`);
        if (order.title) aciklamaParts.push(order.title);
        if (order.description) aciklamaParts.push(order.description);
        const aciklama = aciklamaParts.length > 0 ? aciklamaParts.join(' - ') : '';
        
        // Convert order_date (timestamp) to Date object if it exists
        let faturaTarihi = new Date();
        if (order.order_date) {
          try {
            const date = new Date(order.order_date);
            if (!isNaN(date.getTime())) {
              faturaTarihi = date;
            }
          } catch (error) {
            console.warn("Invalid order_date format, using current date:", error);
          }
        }
        
        // Convert expected_delivery_date to Date object if it exists
        let vadeTarihi: Date | null = null;
        if (order.expected_delivery_date) {
          try {
            const date = new Date(order.expected_delivery_date);
            if (!isNaN(date.getTime())) {
              vadeTarihi = date;
            }
          } catch (error) {
            console.warn("Invalid expected_delivery_date format:", error);
          }
        }
        
        setFormData(prev => ({
          ...prev,
          customer_id: order.customer_id || "",
          fatura_tarihi: faturaTarihi,
          vade_tarihi: vadeTarihi,
          aciklama: aciklama,
          notlar: order.notes || "",
          para_birimi: order.currency === 'TL' ? 'TRY' : (order.currency || "TRY"),
          odeme_sekli: order.payment_terms || "",
        }));
        
        // Set employee_id
        if (order.employee_id) {
          setEmployeeId(order.employee_id);
        }
        
        // Form'a da customer_id'yi set et
        if (order.customer_id) {
          form.setValue("customer_id", order.customer_id);
        }
        
        // Load customer data
        if (order.customer) {
          setSelectedCustomer(order.customer);
        }

        // Convert order items to invoice items
        if (order.items && order.items.length > 0) {
          const invoiceItems = order.items.map((item: any, index: number) => ({
            id: (index + 1).toString(),
            urun_adi: item.name,
            aciklama: item.description || "",
            miktar: parseFloat(item.quantity),
            birim: item.unit || "adet",
            birim_fiyat: parseFloat(item.unit_price),
            kdv_orani: parseFloat(item.tax_rate) || 18,
            indirim_orani: parseFloat(item.discount_rate) || 0,
            satir_toplami: parseFloat(item.total_price),
            kdv_tutari: (parseFloat(item.total_price) * (parseFloat(item.tax_rate) || 18)) / 100,
          }));
          setItems(invoiceItems);
        }
      }
    } catch (error) {
      console.error("Error loading order:", error);
      toast.error("Sipariş verileri yüklenirken hata oluştu");
    } finally {
      setLoadingData(false);
    }
  };

  const loadProposalData = async (id: string) => {
    try {
      setLoadingData(true);
      const { data: proposal, error } = await supabase
        .from("proposals")
        .select(`
          *,
          customer:customers(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (proposal) {
        setProposalData(proposal);
        
        // Build aciklama from description, subject, number and title
        const aciklamaParts = [];
        if (proposal.number) aciklamaParts.push(`Teklif No: ${proposal.number}`);
        if (proposal.title) aciklamaParts.push(proposal.title);
        if (proposal.subject) aciklamaParts.push(`Konu: ${proposal.subject}`);
        if (proposal.description) aciklamaParts.push(proposal.description);
        const aciklama = aciklamaParts.length > 0 ? aciklamaParts.join(' - ') : '';
        
        // Convert offer_date to Date object if it exists
        let faturaTarihi = new Date();
        if (proposal.offer_date) {
          try {
            const date = new Date(proposal.offer_date);
            if (!isNaN(date.getTime())) {
              faturaTarihi = date;
            }
          } catch (error) {
            console.warn("Invalid offer_date format, using current date:", error);
          }
        }
        
        // Convert valid_until to Date object if it exists
        let vadeTarihi: Date | null = null;
        if (proposal.valid_until) {
          try {
            const date = new Date(proposal.valid_until);
            if (!isNaN(date.getTime())) {
              vadeTarihi = date;
            }
          } catch (error) {
            console.warn("Invalid valid_until format:", error);
          }
        }
        
        setFormData(prev => ({
          ...prev,
          customer_id: proposal.customer_id || "",
          fatura_tarihi: faturaTarihi,
          vade_tarihi: vadeTarihi,
          aciklama: aciklama,
          notlar: proposal.notes || "",
          para_birimi: proposal.currency === 'TL' ? 'TRY' : (proposal.currency || "TRY"),
          odeme_sekli: proposal.payment_terms || "",
        }));
        
        // Set employee_id
        if (proposal.employee_id) {
          setEmployeeId(proposal.employee_id);
        }
        
        // Form'a da customer_id'yi set et
        if (proposal.customer_id) {
          form.setValue("customer_id", proposal.customer_id);
        }

        // Load customer data
        if (proposal.customer) {
          setSelectedCustomer(proposal.customer);
        }

        // Convert proposal items from JSONB to invoice items
        // Parse items if it's a string (JSONB from database)
        let parsedItems: any[] = [];
        if (proposal.items) {
          try {
            if (typeof proposal.items === 'string') {
              parsedItems = JSON.parse(proposal.items);
            } else if (Array.isArray(proposal.items)) {
              parsedItems = proposal.items;
            }
          } catch (error) {
            console.error("Error parsing proposal items:", error);
            parsedItems = [];
          }
        }
        
        console.log("Parsed proposal items:", parsedItems);
        
        if (parsedItems && Array.isArray(parsedItems) && parsedItems.length > 0) {
          const invoiceItems = parsedItems.map((item: any, index: number) => {
            const quantity = parseFloat(item.quantity || item.miktar || 1);
            const unitPrice = parseFloat(item.unit_price || item.unitPrice || item.birim_fiyat || 0);
            const discountRate = parseFloat(item.discount_rate || item.discountRate || item.indirim_orani || 0);
            const taxRate = parseFloat(item.tax_rate || item.taxRate || item.kdv_orani || 18);
            
            const subtotal = quantity * unitPrice;
            const discountAmount = (subtotal * discountRate) / 100;
            const discountedSubtotal = subtotal - discountAmount;
            const taxAmount = (discountedSubtotal * taxRate) / 100;

            return {
              id: (index + 1).toString(),
              urun_adi: item.name || item.urun_adi || item.product_name || "",
              aciklama: item.description || item.aciklama || "",
              miktar: quantity,
              birim: item.unit || item.birim || "adet",
              birim_fiyat: unitPrice,
              kdv_orani: taxRate,
              indirim_orani: discountRate,
              satir_toplami: discountedSubtotal,
              kdv_tutari: taxAmount,
            };
          });
          console.log("Converted invoice items:", invoiceItems);
          setItems(invoiceItems);
        } else {
          console.warn("No items found in proposal or items array is empty");
          // Keep default empty item if no items found
        }
      }
    } catch (error) {
      console.error("Error loading proposal:", error);
      toast.error("Teklif verileri yüklenirken hata oluştu");
    } finally {
      setLoadingData(false);
    }
  };

  const calculateItemTotals = (item: InvoiceItem) => {
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
    
    // Recalculate totals
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
      kdv_orani: 18,
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

  const calculateTotals = () => {
    // Calculate indirim tutarı (toplam indirim miktarı)
    const indirim_tutari = items.reduce((sum, item) => {
      const subtotal = item.miktar * item.birim_fiyat;
      const discountAmount = (subtotal * item.indirim_orani) / 100;
      return sum + discountAmount;
    }, 0);
    
    const ara_toplam = items.reduce((sum, item) => sum + item.satir_toplami, 0);
    const kdv_tutari = items.reduce((sum, item) => sum + item.kdv_tutari, 0);
    const toplam_tutar = ara_toplam + kdv_tutari;

    return { ara_toplam, kdv_tutari, toplam_tutar, indirim_tutari };
  };

  // Currency code'u Intl.NumberFormat için geçerli formata çevir
  const getValidCurrencyCode = (currency: string): string => {
    // TL -> TRY dönüşümü (Intl.NumberFormat TL'yi desteklemiyor)
    if (currency === 'TL' || currency === 'tl') {
      return 'TRY';
    }
    return currency;
  };

  // Para birimini formatla
  const formatCurrency = (amount: number, currency: string = "TRY") => {
    const currencyCode = getValidCurrencyCode(currency);
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: currencyCode 
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submit başladı", { formData, items });
    
    // Detaylı validasyonlar
    const customerId = watchCustomerId || formData.customer_id;
    if (!customerId) {
      console.log("Müşteri seçilmedi");
      toast.error("❌ Lütfen müşteri seçiniz");
      return;
    }

    // Müşteri bilgileri kontrolü
    if (selectedCustomer) {
      if (!selectedCustomer.tax_number) {
        toast.error("❌ Seçili müşterinin vergi numarası eksik. Lütfen müşteri bilgilerini tamamlayın.");
        return;
      }
      
      // E-fatura mükellefi ise alias kontrolü
      if (selectedCustomer.is_einvoice_mukellef && !selectedCustomer.einvoice_alias_name) {
        toast.warning("⚠️ Müşteri e-fatura mükellefi ancak alias bilgisi eksik. Fatura gönderilemeyebilir.");
      }
    }

    if (items.length === 0) {
      console.log("Fatura kalemi yok");
      toast.error("❌ En az bir fatura kalemi ekleyiniz");
      return;
    }

    if (items.every(item => !item.urun_adi.trim())) {
      console.log("Fatura kalemlerinde ürün adı yok");
      toast.error("❌ Tüm fatura kalemlerinde ürün/hizmet adı giriniz");
      return;
    }

    // Check for empty required fields in items
    const emptyItems = items.filter(item => !item.urun_adi.trim() || item.miktar <= 0 || item.birim_fiyat <= 0);
    if (emptyItems.length > 0) {
      console.log("Eksik bilgili kalemler var:", emptyItems);
      toast.error(`❌ ${emptyItems.length} kalemde eksik bilgi var. Tüm kalemlerde ürün adı, miktar ve birim fiyat giriniz`);
      return;
    }
    
    // Toplam kontrolü
    const totals = calculateTotals();
    if (totals.toplam_tutar <= 0) {
      toast.error("❌ Fatura toplam tutarı sıfırdan büyük olmalıdır");
      return;
    }

    try {
      setLoading(true);
      console.log("Loading state true yapıldı");
      
      const totals = calculateTotals();
      console.log("Totals hesaplandı:", totals);

      // Get current user and company ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("User data:", user, "User error:", userError);
      
      if (userError) throw userError;
      if (!user) throw new Error("Kullanıcı giriş yapmamış");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      console.log("Profile data:", profile, "Profile error:", profileError);
      
      if (profileError) throw profileError;

      const invoiceData = {
        order_id: orderId || null,
        proposal_id: proposalId || null,
        customer_id: customerId,
        employee_id: employeeId || null,
        fatura_no: null, // NULL olarak kaydedilecek, E-fatura gönderilirken otomatik atanacak
        fatura_tarihi: format(formData.fatura_tarihi, "yyyy-MM-dd"),
        vade_tarihi: formData.vade_tarihi ? format(formData.vade_tarihi, "yyyy-MM-dd") : null,
        aciklama: formData.aciklama,
        notlar: formData.notlar,
        para_birimi: formData.para_birimi,
        ara_toplam: totals.ara_toplam,
        kdv_tutari: totals.kdv_tutari,
        toplam_tutar: totals.toplam_tutar,
        odeme_sekli: formData.odeme_sekli,
        banka_bilgileri: formData.banka_bilgileri,
        durum: "taslak",
        odeme_durumu: "odenmedi",
        company_id: profile?.company_id,
      };

      console.log("Invoice data hazırlandı:", invoiceData);

      // Create sales invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("sales_invoices")
        .insert(invoiceData)
        .select()
        .single();

      console.log("Invoice insert sonucu:", { invoice, invoiceError });

      if (invoiceError) {
        console.error("Invoice insert hatası:", invoiceError);
        throw invoiceError;
      }

      if (!invoice) {
        throw new Error("Fatura oluşturulamadı");
      }

      // Create invoice items
      const invoiceItems = items.map(item => ({
        sales_invoice_id: invoice.id,
        urun_adi: item.urun_adi,
        aciklama: item.aciklama,
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

      console.log("Invoice items hazırlandı:", invoiceItems);

      const { error: itemsError } = await supabase
        .from("sales_invoice_items")
        .insert(invoiceItems);

      console.log("Invoice items insert sonucu:", { itemsError });

      if (itemsError) {
        console.error("Invoice items insert hatası:", itemsError);
        throw itemsError;
      }

      // Save invoice ID for e-invoice operations
      setSavedInvoiceId(invoice.id);
      console.log("Saved invoice ID:", invoice.id);

      toast.success("✅ Fatura başarıyla oluşturuldu! E-fatura göndermek için aşağıdaki butonları kullanabilirsiniz.", {
        duration: 5000,
      });

      console.log("Fatura başarıyla oluşturuldu");
      
      // Scroll to e-invoice section
      setTimeout(() => {
        const einvoiceSection = document.querySelector('#einvoice-section');
        if (einvoiceSection) {
          einvoiceSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      
      // Don't navigate immediately to allow e-invoice operations
      // navigate("/sales-invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      toast.error(`❌ Fatura oluşturulurken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, {
        duration: 7000,
      });
    } finally {
      setLoading(false);
      console.log("Loading state false yapıldı");
    }
  };

  const totals = calculateTotals();

  // E-fatura işlevleri
  const handleSendEInvoice = async () => {
    if (!savedInvoiceId) {
      toast.error("❌ Önce faturayı kaydedin");
      return;
    }

    // Check if already sending
    if (isSending || einvoiceStatus?.status === 'sending') {
      toast.info("⏳ E-fatura zaten gönderiliyor, lütfen bekleyin");
      return;
    }

    // Son bir kez müşteri kontrolü yap
    if (selectedCustomer?.is_einvoice_mukellef && !selectedCustomer?.einvoice_alias_name) {
      const confirmSend = window.confirm(
        "⚠️ Uyarı: Müşteri e-fatura mükellefi ancak alias bilgisi eksik. " +
        "Fatura gönderilemeyebilir. Yine de göndermek istiyor musunuz?"
      );
      if (!confirmSend) return;
    }

    sendInvoice(savedInvoiceId);
    
    // E-fatura gönderildikten sonra durumu yenile
    setTimeout(async () => {
      await refreshStatus();
      
      const { data: updatedInvoice } = await supabase
        .from('sales_invoices')
        .select('fatura_no')
        .eq('id', savedInvoiceId)
        .single();
      
      if (updatedInvoice?.fatura_no) {
        setAssignedInvoiceNumber(updatedInvoice.fatura_no);
      }
    }, 3000); // 3 saniye bekle
  };

  // Loading sayfası
  if (loadingData) {
    return (
      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">
              {orderId ? "Sipariş verileri yükleniyor..." : "Teklif verileri yükleniyor..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Simple Back Button */}
            <BackButton 
              onClick={() => navigate("/sales-invoices")}
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
                  {orderId && orderData ? `Sipariş ${orderData.order_number} için fatura oluşturun` : 
                   proposalId && proposalData ? `Teklif ${proposalData.number} için fatura oluşturun` :
                   "Hızlı ve kolay fatura oluşturma"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const form = document.getElementById('invoice-form') as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={loading || loadingData}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Kaydediliyor..." : "Kaydet"}</span>
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
                {savedInvoiceId && einvoiceStatus?.status !== 'sent' && (
                  <>
                    <DropdownMenuItem 
                      onClick={handleSendEInvoice} 
                      disabled={isSending || einvoiceStatus?.status === 'sending'}
                      className="gap-2 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>E-Fatura Gönder</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={() => toast.info("PDF indirme özelliği yakında eklenecek")} 
                  className="gap-2 cursor-pointer"
                >
                  <FileDown className="h-4 w-4" />
                  <span>PDF İndir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
                  </div>
                  </div>
                </div>

      {/* Main Content */}
      <FormProvider {...form}>
        <form id="invoice-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Customer & Invoice Information - Single Card */}
          <InvoiceHeaderCard
            selectedCustomer={selectedCustomer}
            formData={formData}
            assignedInvoiceNumber={assignedInvoiceNumber}
            einvoiceStatus={einvoiceStatus}
            onFieldChange={(field, value) => setFormData({ ...formData, [field]: value })}
            form={form}
          />

          {/* Invoice Items - Full Width */}
          <InvoiceItemsCard
            items={items}
            currency={formData.para_birimi}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onItemChange={updateItem}
            formatCurrency={formatCurrency}
          />

          {/* Financial Summary */}
          <InvoiceFinancialCard
            totals={totals}
            currency={formData.para_birimi}
            formatCurrency={formatCurrency}
          />

          {/* Info Text */}
          <div className="text-sm text-gray-600">
            <Info className="inline h-4 w-4 mr-1" />
            * ile işaretli alanlar zorunludur
          </div>

          {/* E-Invoice Actions */}
          <InvoiceEInvoiceCard
            savedInvoiceId={savedInvoiceId}
            einvoiceStatus={einvoiceStatus}
            isSending={isSending}
            onSendEInvoice={handleSendEInvoice}
            onRefreshStatus={refreshStatus}
            onNavigateToInvoices={() => navigate("/sales-invoices")}
          />
        </form>
      </FormProvider>
        </div>
  );
};

export default CreateSalesInvoice;
