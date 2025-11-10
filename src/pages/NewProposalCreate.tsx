import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Plus, Trash, Calculator, Check, Edit, FileText, ArrowUp, ArrowDown, Eye, Download, Mail, MoreHorizontal, Save, FileDown, Send, ShoppingCart, ArrowRight } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { proposalStatusLabels, proposalStatusColors, ProposalStatus } from "@/types/proposal";
import { Badge } from "@/components/ui/badge";
import { useProposalCreation } from "@/hooks/proposals/useProposalCreation";
import { ProposalItem } from "@/types/proposal";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import ProposalPreviewModal from "@/components/proposals/form/ProposalPreviewModal";
import CustomerInfoCard from "@/components/proposals/cards/CustomerInfoCard";
import ProposalDetailsCard from "@/components/proposals/cards/ProposalDetailsCard";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import TermsConditionsCard from "@/components/proposals/cards/TermsConditionsCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";

// Constants
const DEFAULT_VAT_PERCENTAGE = 20;
const DEFAULT_CURRENCY = "TL";
const DEFAULT_EXCHANGE_RATE = 1;
const DEFAULT_QUANTITY = 1;
const DEFAULT_UNIT = "adet";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface CustomerData {
  customer_company: string;
  contact_name: string;
  customer_id: string;
}

interface ProposalData {
  subject: string;
  offer_date: Date;
  offer_number: string;
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

interface NewProposalCreateProps {
  // Props removed as they were not being used
}

const NewProposalCreate = () => {
  const form = useForm({ defaultValues: { customer_id: "", supplier_id: "" } });
  const watchCustomerId = form.watch("customer_id");
  const { customers } = useCustomerSelect();

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
  const navigate = useNavigate();
  const { createProposal } = useProposalCreation();
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

  const [proposalData, setProposalData] = useState<ProposalData>({
    subject: "",
    offer_date: new Date(),
    offer_number: `TKF-${Date.now().toString().slice(-6)}`,
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
      const currency = item.currency || 'TL';
      usedCurrencies.add(currency);
    });
    
    // Initialize totals for all used currencies
    usedCurrencies.forEach(currency => {
      totals[currency] = { gross: 0, discount: 0, net: 0, vat: 0, grand: 0 };
    });
    
    // Calculate gross totals
    items.forEach(item => {
      const currency = item.currency || 'TL';
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

  // Update item calculations
  useEffect(() => {
    setItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        total_price: item.quantity * item.unit_price
      }))
    );
  }, []);

  const handleFieldChange = useCallback((field: string, value: any) => {
    // Update the appropriate state based on field
    if (['customer_company', 'contact_name', 'customer_id'].includes(field)) {
      setCustomerData(prev => ({ ...prev, [field]: value }));
    } else if (['subject', 'offer_date', 'offer_number', 'validity_date', 'prepared_by', 'employee_id', 'notes', 'status'].includes(field)) {
      setProposalData(prev => ({ ...prev, [field]: value }));
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

  const handleAddProductToProposal = (productData: any, itemIndex?: number) => {
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
        currency: productData.currency || formData.currency
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
        currency: productData.currency || formData.currency
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
    if (!formData.customer_company.trim()) {
      errors.push("Müşteri firma adı gereklidir");
    }
    
    if (!formData.contact_name.trim()) {
      errors.push("İletişim kişisi adı gereklidir");
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
        : ['TL', { grand: 0 }];
      
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
      const proposalData = {
        title: `${formData.customer_company} - Teklif`,
        subject: formData.subject, // Teklif konusu
        description: formData.notes,
        number: formData.offer_number,
        customer_id: formData.customer_id || null,
        employee_id: formData.prepared_by || null,
        valid_until: formData.validity_date?.toISOString().split('T')[0] || "",
        terms: `${formData.payment_terms}\n\n${formData.delivery_terms}\n\nGaranti: ${formData.warranty_terms}`,
        payment_terms: formData.payment_terms,
        delivery_terms: formData.delivery_terms,
        warranty_terms: formData.warranty_terms,
        price_terms: formData.price_terms,
        other_terms: formData.other_terms,
        notes: formData.notes,
        status: status,
        total_amount: primaryTotals.grand,
        currency: primaryCurrency,
        exchange_rate: formData.exchange_rate, // Döviz kuru
        // Override hook's calculation with our computed total
        computed_total_amount: primaryTotals.grand,
        items: validItems.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price
        }))
      };

      const result = await createProposal(proposalData);
      if (result) {
        toast.success(status === 'draft' ? "Teklif taslak olarak kaydedildi" : "Teklif başarıyla oluşturuldu");
        navigate("/proposals");
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
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
    const isFormComplete = 
      formData.customer_id && 
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


  return (
    <div>
      {/* Enhanced Sticky Header with Progress */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
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
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Yeni Teklif Oluştur
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Hızlı ve kolay teklif oluşturma
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
                
                <DropdownMenuItem onClick={handleConvertToOrder} className="gap-2 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                  <ShoppingCart className="h-4 w-4" />
                  <span>Siparişe Çevir</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Top Row - Customer & Proposal Details Combined */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Customer Information */}
          <CustomerInfoCard
            formData={formData}
            handleFieldChange={handleFieldChange}
            errors={{}}
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
              // Editing existing item
              setSelectedProduct(product); // product'ı set et, null yapma
              setEditingItemIndex(itemIndex);
              setEditingItemData(product);
              setProductModalOpen(true);
            } else {
              // Adding new item
              handleProductModalSelect(product, itemIndex);
            }
          }}
          showMoveButtons={true}
          inputHeight="h-7"
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
          />

          {/* Financial Summary */}
          <FinancialSummaryCard
            calculationsByCurrency={calculationsByCurrency}
            globalDiscountType={globalDiscountType}
            globalDiscountValue={globalDiscountValue}
            onGlobalDiscountTypeChange={setGlobalDiscountType}
            onGlobalDiscountValueChange={setGlobalDiscountValue}
            showVatControl={false}
            inputHeight="h-7"
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