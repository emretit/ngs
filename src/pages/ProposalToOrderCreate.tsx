import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { ShoppingCart, Save, Eye, FileDown, Send, MoreHorizontal, Package, FileText, Loader2, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { OrderStatus, CreateOrderData, CreateOrderItemData } from "@/types/orders";
import { useOrders } from "@/hooks/useOrders";
import { cn } from "@/lib/utils";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProposalPreviewModal from "@/components/proposals/form/ProposalPreviewModal";
import OrderCustomerInfoCard from "@/components/orders/cards/OrderCustomerInfoCard";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { supabase } from "@/integrations/supabase/client";
import { Proposal, ProposalItem } from "@/types/proposal";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Constants
const DEFAULT_VAT_PERCENTAGE = 20;
const DEFAULT_CURRENCY = "TRY";
const DEFAULT_EXCHANGE_RATE = 1;
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT = "adet";

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
  product_id?: string;
  image_url?: string;
}

interface CustomerData {
  customer_company: string;
  contact_name: string;
  customer_id: string;
}

interface OrderData {
  subject: string;
  order_date: Date;
  order_number: string;
  document_number: string;
  expected_delivery_date: Date | undefined;
  requested_date: Date | undefined;
  delivery_date: Date | undefined;
  shipment_date: Date | undefined;
  prepared_by: string;
  employee_id: string;
  notes: string;
  status: OrderStatus;
  delivery_address: string;
  delivery_contact_name: string;
  delivery_contact_phone: string;
  payment_method: string;
  shipment_location: string;
  invoice_date: Date | undefined;
  invoice_number: string;
  is_cancelled: boolean;
  is_non_shippable: boolean;
  proposal_id?: string;
  proposal_number?: string;
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

const ProposalToOrderCreate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { createOrderMutation } = useOrders();
  const { customers } = useCustomerSelect();
  
  // Get proposal ID from query parameters
  const queryParams = new URLSearchParams(location.search);
  const proposalId = queryParams.get("proposalId");
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  
  const form = useForm({ defaultValues: { customer_id: "", supplier_id: "" } });
  const watchCustomerId = form.watch("customer_id");

  useEffect(() => {
    if (watchCustomerId) {
      const selected = customers?.find(c => c.id === watchCustomerId);
      if (selected) {
        handleFieldChange('customer_id', watchCustomerId);
        handleFieldChange('customer_company', selected.company || selected.name || "");
        handleFieldChange('contact_name', selected.name || "");
      }
    }
  }, [watchCustomerId, customers]);

  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Form state - Split into logical sections for better performance
  const [customerData, setCustomerData] = useState<CustomerData>({
    customer_company: "",
    contact_name: "",
    customer_id: "",
  });

  const [orderData, setOrderData] = useState<OrderData>({
    subject: "",
    order_date: new Date(),
    order_number: `SIP-${Date.now().toString().slice(-6)}`,
    document_number: "",
    expected_delivery_date: undefined,
    requested_date: undefined,
    delivery_date: undefined,
    shipment_date: undefined,
    prepared_by: "",
    employee_id: "",
    notes: "",
    status: "pending",
    delivery_address: "",
    delivery_contact_name: "",
    delivery_contact_phone: "",
    payment_method: "",
    shipment_location: "",
    invoice_date: undefined,
    invoice_number: "",
    is_cancelled: false,
    is_non_shippable: false,
    proposal_id: undefined,
    proposal_number: undefined,
  });

  const [financialData, setFinancialData] = useState<FinancialData>({
    currency: DEFAULT_CURRENCY,
    exchange_rate: DEFAULT_EXCHANGE_RATE,
    vat_percentage: DEFAULT_VAT_PERCENTAGE,
  });

  const [termsData, setTermsData] = useState<TermsData>({
    payment_terms: "",
    delivery_terms: "",
    warranty_terms: "",
    price_terms: "",
    other_terms: "",
  });

  // Line items state
  const [items, setItems] = useState<LineItem[]>([]);

  // Load proposal data
  useEffect(() => {
    const fetchProposalData = async () => {
      if (!proposalId) {
        setError("Teklif ID'si bulunamadı. Lütfen teklif sayfasından siparişe çevirin.");
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
            customer:customers(id, name, company, email, mobile_phone, office_phone, address)
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
        setCustomerData({
          customer_company: customer?.company || customer?.name || "",
          contact_name: customer?.name || "",
          customer_id: data.customer_id || "",
        });

        // Set form value for customer_id
        if (data.customer_id) {
          form.setValue("customer_id", data.customer_id);
        }

        // Pre-populate order data from proposal
        setOrderData(prev => ({
          ...prev,
          subject: data.subject || data.title || "",
          notes: data.notes || "",
          prepared_by: data.employee_id || "",
          employee_id: data.employee_id || "",
          payment_method: data.payment_terms || "",
          proposal_id: data.id,
          proposal_number: data.number,
          delivery_address: customer?.address || "",
        }));

        // Pre-populate financial data
        setFinancialData({
          currency: data.currency || DEFAULT_CURRENCY,
          exchange_rate: data.exchange_rate || DEFAULT_EXCHANGE_RATE,
          vat_percentage: DEFAULT_VAT_PERCENTAGE,
        });

        // Pre-populate terms data
        setTermsData({
          payment_terms: data.payment_terms || "",
          delivery_terms: data.delivery_terms || "",
          warranty_terms: data.warranty_terms || "",
          price_terms: data.price_terms || "",
          other_terms: data.other_terms || "",
        });

        // Pre-populate items
        if (proposalItems.length > 0) {
          const lineItems: LineItem[] = proposalItems.map((item, index) => ({
            id: item.id || Date.now().toString() + index,
            row_number: index + 1,
            name: item.name || "",
            description: item.description || "",
            quantity: Number(item.quantity) || DEFAULT_QUANTITY,
            unit: item.unit || DEFAULT_UNIT,
            unit_price: Number(item.unit_price) || 0,
            tax_rate: Number(item.tax_rate) || DEFAULT_VAT_PERCENTAGE,
            discount_rate: Number(item.discount_rate) || 0,
            total_price: Number(item.total_price) || (Number(item.quantity) * Number(item.unit_price)),
            currency: item.currency || data.currency || DEFAULT_CURRENCY,
            product_id: item.product_id,
          }));
          setItems(lineItems);
        } else {
          // Add empty item if no items
          setItems([{
            id: "1",
            row_number: 1,
            name: "",
            description: "",
            quantity: DEFAULT_QUANTITY,
            unit: DEFAULT_UNIT,
            unit_price: 0,
            total_price: 0,
            currency: data.currency || DEFAULT_CURRENCY
          }]);
        }

      } catch (err) {
        console.error("Error fetching proposal:", err);
        setError(err instanceof Error ? err.message : "Teklif bilgileri yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchProposalData();
  }, [proposalId, form]);

  // Combined form data for backward compatibility
  const formData = useMemo(() => ({
    ...customerData,
    ...orderData,
    ...financialData,
    ...termsData,
    title: "",
    description: "",
  }), [customerData, orderData, financialData, termsData]);

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

  const handleFieldChange = useCallback((field: string, value: any) => {
    // Update the appropriate state based on field
    if (['customer_company', 'contact_name', 'customer_id'].includes(field)) {
      setCustomerData(prev => ({ ...prev, [field]: value }));
    } else if (['subject', 'order_date', 'order_number', 'document_number', 'expected_delivery_date', 'requested_date', 'delivery_date', 'shipment_date', 'prepared_by', 'employee_id', 'notes', 'status', 'delivery_address', 'delivery_contact_name', 'delivery_contact_phone', 'payment_method', 'shipment_location', 'invoice_date', 'invoice_number', 'is_cancelled', 'is_non_shippable'].includes(field)) {
      setOrderData(prev => ({ ...prev, [field]: value }));
    } else if (['currency', 'exchange_rate', 'vat_percentage'].includes(field)) {
      setFinancialData(prev => ({ ...prev, [field]: value }));
    } else if (['payment_terms', 'delivery_terms', 'warranty_terms', 'price_terms', 'other_terms'].includes(field)) {
      setTermsData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

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
    setProductModalOpen(true);
  };

  const handleAddProductToOrder = (productData: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        name: productData.name,
        description: productData.description,
        quantity: productData.quantity,
        unit: productData.unit,
        unit_price: productData.unit_price,
        tax_rate: productData.vat_rate,
        discount_rate: productData.discount_rate,
        total_price: productData.total_price,
        currency: productData.currency || formData.currency,
        product_id: productData.product_id
      };
      setItems(updatedItems);
    } else {
      // Add new item
      const newItem: LineItem = {
        id: Date.now().toString(),
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
        product_id: productData.product_id
      };
      setItems([...items, newItem]);
    }

    setProductModalOpen(false);
    setEditingItemIndex(undefined);
    setSelectedProduct(null);
  };

  const validateForm = () => {
    const errors: string[] = [];

    // Müşteri bilgileri validasyonu
    if (!formData.customer_company.trim() && !formData.customer_id) {
      errors.push("Müşteri firma adı gereklidir");
    }

    // Tarih validasyonu
    if (!formData.order_date) {
      errors.push("Sipariş tarihi gereklidir");
    }

    // Sipariş konusu validasyonu
    if (!formData.subject.trim()) {
      errors.push("Sipariş konusu gereklidir");
    }

    // Ürün/hizmet validasyonu
    const validItems = items.filter(item =>
      item.name?.trim() || item.description?.trim()
    );

    if (validItems.length === 0) {
      errors.push("En az bir sipariş kalemi eklenmelidir");
    }

    // Ürün/hizmet detay validasyonu
    validItems.forEach((item, index) => {
      if (!item.name?.trim() && !item.description?.trim()) {
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

  const handleSave = async (status: OrderStatus = formData.status) => {
    try {
      // Form validasyonu
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        validationErrors.forEach(error => toast.error(error));
        return;
      }

      const validItems = items.filter(item =>
        item.name?.trim() || item.description?.trim()
      );

      setSaving(true);

      // Auto-detect primary currency from items
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

      // Prepare data for backend
      const orderCreateData: CreateOrderData = {
        proposal_id: orderData.proposal_id,
        title: `${formData.customer_company} - Sipariş`,
        description: formData.notes,
        customer_id: formData.customer_id || undefined,
        employee_id: formData.prepared_by || undefined,
        expected_delivery_date: formData.expected_delivery_date?.toISOString().split('T')[0],
        payment_terms: formData.payment_terms,
        delivery_terms: formData.delivery_terms,
        warranty_terms: formData.warranty_terms,
        price_terms: formData.price_terms,
        other_terms: formData.other_terms,
        notes: formData.notes,
        status: status,
        currency: primaryCurrency,
        delivery_address: formData.delivery_address,
        delivery_contact_name: formData.delivery_contact_name,
        delivery_contact_phone: formData.delivery_contact_phone,
        items: validItems.map((item, index) => ({
          product_id: item.product_id,
          name: item.name || item.description || "",
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || DEFAULT_UNIT,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || DEFAULT_VAT_PERCENTAGE,
          discount_rate: item.discount_rate || 0,
          item_group: 'product',
          stock_status: 'in_stock',
          sort_order: index + 1
        }))
      };

      const result = await createOrderMutation.mutateAsync(orderCreateData);
      if (result) {
        // Update proposal status to 'accepted' if order created successfully
        if (orderData.proposal_id) {
          await supabase
            .from("proposals")
            .update({ status: 'accepted' })
            .eq("id", orderData.proposal_id);
        }
        
        toast.success(status === 'pending' ? "Sipariş taslak olarak kaydedildi" : "Sipariş başarıyla oluşturuldu");
        navigate("/orders/list");
      }
    } catch (error) {
      console.error('Error saving order:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Sipariş kaydedilirken bir hata oluştu";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Smart save function - determines save type based on form completion
  const handleSmartSave = () => {
    // Check if form is complete enough to be confirmed
    const isFormComplete =
      formData.customer_id &&
      formData.contact_name &&
      formData.subject &&
      formData.order_date &&
      items.length > 0 &&
      items.every(item => item.name && item.quantity && item.unit_price > 0);

    if (isFormComplete) {
      // Form is complete, save as confirmed order
      handleSave('confirmed');
    } else {
      // Form is incomplete, save as pending
      handleSave('pending');
    }
  };

  // Preview functions
  const handlePreview = () => {
    setPreviewModalOpen(true);
  };

  const handleExportPDF = () => {
    toast.info("PDF export özelliği yakında eklenecek");
  };

  const handleSendEmail = () => {
    toast.info("E-posta gönderimi özelliği yakında eklenecek");
  };

  const handleBackNavigation = () => {
    if (proposalId) {
      navigate(`/proposal/${proposalId}`);
    } else {
      navigate("/proposals");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Teklif bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hata</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => navigate("/proposals")} variant="outline">
            Teklifler Sayfasına Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Enhanced Sticky Header with Progress */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            {/* Simple Back Button */}
            <BackButton
              onClick={handleBackNavigation}
              variant="ghost"
              size="sm"
            >
              {proposalId ? "Teklif Detayı" : "Teklifler"}
            </BackButton>

            {/* Simple Title Section with Icon */}
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Tekliften Sipariş Oluştur
                  </h1>
                  {orderData.proposal_number && (
                    <Badge variant="outline" className="text-xs font-normal">
                      <FileText className="h-3 w-3 mr-1" />
                      {orderData.proposal_number}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/70">
                  Onaylanan tekliften yeni sipariş oluşturuyorsunuz
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
              <span>{saving ? "Kaydediliyor..." : "Siparişi Oluştur"}</span>
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
                <DropdownMenuLabel>Görüntüleme</DropdownMenuLabel>
                <DropdownMenuItem onClick={handlePreview} className="gap-2 cursor-pointer">
                  <Eye className="h-4 w-4" />
                  <span>Önizle</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4" />
                  <span>PDF İndir</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendEmail} className="gap-2 cursor-pointer">
                  <Send className="h-4 w-4" />
                  <span>E-posta Gönder</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Müşteri Sayfasına Git */}
                {formData.customer_id && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => navigate(`/customers/${formData.customer_id}`)}
                      className="gap-2 cursor-pointer"
                    >
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>Müşteri Sayfasına Git</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuLabel>Kaydetme Seçenekleri</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleSave('pending')} className="gap-2 cursor-pointer">
                  <Save className="h-4 w-4 text-gray-500" />
                  <span>Taslak Olarak Kaydet</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSave('confirmed')} className="gap-2 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50">
                  <Package className="h-4 w-4" />
                  <span>Siparişi Onayla</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Proposal Info Banner */}
      {proposal && (
        <div className="mb-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Kaynak Teklif:</span>
                  <span className="text-blue-700">{proposal.number}</span>
                </div>
                <div className="h-4 w-px bg-blue-300" />
                <div className="text-blue-700">
                  {proposal.subject || proposal.title}
                </div>
                {proposal.total_amount && (
                  <>
                    <div className="h-4 w-px bg-blue-300" />
                    <div className="font-medium text-blue-900">
                      {formatCurrency(proposal.total_amount, proposal.currency || 'TRY')}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-3">
        {/* Customer & Delivery Information - Yan yana */}
        <OrderCustomerInfoCard
          formData={formData}
          handleFieldChange={handleFieldChange}
          errors={{}}
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
              // Editing existing item
              setSelectedProduct(null);
              setEditingItemIndex(itemIndex);
              setEditingItemData(product);
              setProductModalOpen(true);
            } else {
              // Adding new item
              handleProductModalSelect(product, itemIndex);
            }
          }}
          showMoveButtons={true}
          inputHeight="h-10"
        />

        {/* Financial Summary - Tek başına sağda */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2"></div>
          {/* Financial Summary */}
          <FinancialSummaryCard
            calculationsByCurrency={calculationsByCurrency}
            globalDiscountType={globalDiscountType}
            globalDiscountValue={globalDiscountValue}
            onGlobalDiscountTypeChange={setGlobalDiscountType}
            onGlobalDiscountValueChange={setGlobalDiscountValue}
            showVatControl={false}
            inputHeight="h-10"
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
          onAddToProposal={(productData) => handleAddProductToOrder(productData, editingItemIndex)}
          currency={formData.currency}
          existingData={editingItemData}
        />

        {/* Order Preview Modal */}
        <ProposalPreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          formData={formData}
          items={items.map(item => ({
            ...item,
            name: item.name || 'Ürün',
            unit: item.unit || 'adet'
          }))}
          calculationsByCurrency={calculationsByCurrency}
          onExportPDF={handleExportPDF}
          onSendEmail={handleSendEmail}
        />
      </div>
    </div>
  );
};

export default ProposalToOrderCreate;

