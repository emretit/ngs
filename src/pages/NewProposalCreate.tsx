import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Plus, Trash, Eye, FileDown, Calculator, Check, Edit, FileText, Clock } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { proposalStatusLabels, proposalStatusColors, ProposalStatus } from "@/types/proposal";
import { Badge } from "@/components/ui/badge";
import { useProposalCreation } from "@/hooks/proposals/useProposalCreation";
import { ProposalItem } from "@/types/proposal";
// import { PdfDownloadDropdown } from "@/components/proposals/PdfDownloadDropdown";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface NewProposalCreateProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const NewProposalCreate = ({ isCollapsed, setIsCollapsed }: NewProposalCreateProps) => {
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
  
  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Form state matching the sample format
  const [formData, setFormData] = useState({
    // Customer Section
    customer_company: "",
    contact_name: "",
    contact_title: "",
    offer_date: new Date(),
    offer_number: `TKF-${Date.now().toString().slice(-6)}`,
    
    // General Section
    subject: "", // Teklif konusu
    validity_date: undefined as Date | undefined,
    prepared_by: "",
    notes: "",
    
    // Financial settings
    currency: "TRY",
    exchange_rate: 1, // Döviz kuru
    discount_percentage: 0,
    vat_percentage: 20,
    
    // Terms
    payment_terms: "Siparişle birlikte %50 avans, teslimde kalan tutar ödenecektir.",
    delivery_terms: "Teslimat süresi: Sipariş tarihinden itibaren 15-20 iş günü",
    warranty_terms: "Ürünlerimiz 2 yıl garantilidir.",
    price_terms: "",
    other_terms: "",
    
    // Backend compatibility fields
    title: "",
    customer_id: "",
    employee_id: "",
    description: "",
    status: "draft" as ProposalStatus
  });

  // Line items state
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "1",
      row_number: 1,
      name: "",
      description: "",
      quantity: 1,
      unit: "adet",
      unit_price: 0,
      total_price: 0,
      currency: "TRY"
    }
  ]);

  // Calculate totals by currency
  const calculateTotalsByCurrency = () => {
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
  };

  const calculationsByCurrency = calculateTotalsByCurrency();
  console.log("🔍 Debug - Items:", items);
  console.log("🔍 Debug - CalculationsByCurrency:", calculationsByCurrency);
  console.log("🔍 Debug - Object.keys length:", Object.keys(calculationsByCurrency).length);
  
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

  const handleFieldChange = (field: string, value: any) => {
    console.log('🔍 NewProposalCreate - handleFieldChange:', { field, value });
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
      total_price: field === 'quantity' || field === 'unit_price' 
        ? (field === 'quantity' ? value : updatedItems[index].quantity) * 
          (field === 'unit_price' ? value : updatedItems[index].unit_price)
        : updatedItems[index].total_price
    };
    setItems(updatedItems);
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      row_number: items.length + 1,
      name: "",
      description: "",
      quantity: 1,
      unit: "adet",
      unit_price: 0,
      total_price: 0,
      currency: formData.currency
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      // Renumber items
      const renumberedItems = updatedItems.map((item, i) => ({
        ...item,
        row_number: i + 1
      }));
      setItems(renumberedItems);
    }
  };

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

  const handleSave = async (status: ProposalStatus = formData.status) => {
    console.log("🔍 Save button clicked with status:", status);
    console.log("🔍 FormData:", formData);
    console.log("🔍 Items:", items);
    
    // Validation
    if (!formData.customer_company.trim()) {
      console.log("❌ Validation failed: customer_company is empty");
      toast.error("Müşteri firma adı gereklidir");
      return;
    }
    if (!formData.contact_name.trim()) {
      console.log("❌ Validation failed: contact_name is empty");
      toast.error("İletişim kişisi adı gereklidir");
      return;
    }
    if (!formData.validity_date) {
      console.log("❌ Validation failed: validity_date is empty");
      toast.error("Geçerlilik tarihi gereklidir");
      return;
    }
    
    // Check if items have any meaningful content
    const validItems = items.filter(item => item.name.trim() || item.description.trim());
    console.log("🔍 Valid items count:", validItems.length);
    
    if (validItems.length === 0) {
      console.log("❌ Validation failed: no valid items");
      toast.error("En az bir teklif kalemi eklenmelidir");
      return;
    }
    
    console.log("✅ All validations passed, proceeding with save...");

    setSaving(true);
    try {
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
      toast.error("Teklif kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
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
              variant="outline" 
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
            >
              <span className="font-medium">Taslak Kaydet</span>
            </Button>
            <Button 
              onClick={() => handleSave('sent')}
              disabled={saving}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Calculator className="h-4 w-4" />
              <span>{saving ? "Kaydediliyor..." : "Teklifi Kaydet"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Top Row - Customer & Proposal Details Combined */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Customer Information */}
          <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-2 pt-2.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
              <FormProvider {...form}>
              <div className="grid grid-cols-1 gap-3">
                <ProposalPartnerSelect partnerType="customer" />
                <ContactPersonInput
                  value={formData.contact_name}
                  onChange={(value) => handleFieldChange('contact_name', value)}
                  customerId={formData.customer_id}
                  error=""
                />
                <div>
                  <EmployeeSelector
                    value={formData.prepared_by || ""}
                    onChange={(value) => {
                      handleFieldChange('prepared_by', value);
                      handleFieldChange('employee_id', value);
                    }}
                    error=""
                    label="Teklifi Hazırlayan"
                    placeholder="Teklifi hazırlayan seçin..."
                    searchPlaceholder="Teklifi hazırlayan ara..."
                    loadingText="Teklifi hazırlayanlar yükleniyor..."
                    noResultsText="Teklifi hazırlayan bulunamadı"
                  />
                </div>
              </div>
              </FormProvider>
            </CardContent>
          </Card>

          {/* Offer Details */}
          <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-2 pt-2.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                  <CalendarDays className="h-4 w-4 text-green-600" />
                </div>
                Teklif Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 px-4 pb-4">
              {/* Teklif Konusu */}
              <div>
                <Label htmlFor="subject" className="text-xs font-medium text-gray-700">Teklif Konusu</Label>
                <Input
                  id="subject"
                  value={formData.subject || ""}
                  onChange={(e) => handleFieldChange('subject', e.target.value)}
                  placeholder="Teklif konusunu girin"
                  className="mt-1 h-7 text-xs"
                />
              </div>

              {/* Tarih Alanları - Altlı Üstlü */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="offer_date" className="text-xs font-medium text-gray-700">Teklif Tarihi</Label>
                    <DatePicker
                      date={formData.offer_date}
                      onSelect={(date) => handleFieldChange('offer_date', date)}
                      placeholder="Teklif tarihi seçin"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validity_date" className="text-xs font-medium text-gray-700">
                      Geçerlilik Tarihi <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      date={formData.validity_date}
                      onSelect={(date) => handleFieldChange('validity_date', date)}
                      placeholder="Geçerlilik tarihi seçin"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Teklif No, Durum ve Para Birimi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="offer_number" className="text-xs font-medium text-gray-700">Teklif No</Label>
                  <Input
                    id="offer_number"
                    value={formData.offer_number}
                    onChange={(e) => handleFieldChange('offer_number', e.target.value)}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-xs font-medium text-gray-700">Teklif Durumu</Label>
                  <Select value={formData.status} onValueChange={(value: ProposalStatus) => handleFieldChange('status', value)}>
                    <SelectTrigger className="mt-1 h-7 text-xs">
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(proposalStatusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${proposalStatusColors[value as ProposalStatus]}`}></span>
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency" className="text-xs font-medium text-gray-700">Para Birimi</Label>
                  <Select value={formData.currency || "TRY"} onValueChange={(value) => handleFieldChange('currency', value)}>
                    <SelectTrigger className="mt-1 h-7 text-xs">
                      <SelectValue placeholder="Para birimi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">₺ TRY</SelectItem>
                      <SelectItem value="USD">$ USD</SelectItem>
                      <SelectItem value="EUR">€ EUR</SelectItem>
                      <SelectItem value="GBP">£ GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Döviz Kuru - Sadece TRY dışındaki para birimleri için */}
              {formData.currency && formData.currency !== "TRY" && (
                <div>
                  <Label htmlFor="exchange_rate" className="text-xs font-medium text-gray-700">
                    Döviz Kuru (1 {formData.currency} = ? TRY)
                  </Label>
                  <Input
                    id="exchange_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.exchange_rate || ""}
                    onChange={(e) => handleFieldChange('exchange_rate', parseFloat(e.target.value) || 1)}
                    placeholder="Örn: 32.50"
                    className="mt-1 h-7 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    1 {formData.currency} = {formData.exchange_rate || "1"} TRY
                  </p>
                </div>
              )}

              {/* Notlar Alanı */}
              <div>
                <Label htmlFor="notes" className="text-xs font-medium text-gray-700">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Teklif hakkında notlarınızı yazın..."
                  className="mt-1 h-7 text-xs resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products/Services Table - Full Width */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-2 pt-2.5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                      <Plus className="h-4 w-4 text-purple-600" />
                    </div>
                    Ürün/Hizmet Listesi
                  </CardTitle>
                  <Button onClick={addItem} size="sm" className="gap-2 px-3 py-1.5 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-sm transition-all duration-200">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium text-sm">Satır Ekle</span>
                  </Button>
                </div>
              </CardHeader>
          <CardContent className="space-y-3 pt-0 px-4 pb-4">
                {/* Kolon Başlıkları */}
                <div className="grid grid-cols-12 gap-2 mb-3 px-1">
                  <div className="col-span-5">
                    <Label className="text-xs font-medium text-gray-600">Ürün/Hizmet</Label>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs font-medium text-gray-600">Miktar</Label>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs font-medium text-gray-600">Birim</Label>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs font-medium text-gray-600">Birim Fiyat</Label>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs font-medium text-gray-600">KDV %</Label>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs font-medium text-gray-600">İndirim</Label>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs font-medium text-gray-600">Toplam</Label>
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs font-medium text-gray-600">İşlemler</Label>
                  </div>
                </div>

                {/* Veri Satırları */}
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-1.5 bg-gray-50/50">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Ürün/Hizmet */}
                        <div className="col-span-5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-gray-600 min-w-[20px]">{item.row_number}.</span>
                            <ProductSelector
                              value={item.description || ''}
                              onChange={(productName) => {
                                handleItemChange(index, 'description', productName);
                              }}
                              onProductSelect={(product) => handleProductModalSelect(product, index)}
                              placeholder="Ürün seçin..."
                              className="flex-1 max-w-full"
                            />
                          </div>
                        </div>
                        
                        {/* Miktar */}
                        <div className="col-span-1">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            min="1"
                            className="h-7 text-xs"
                          />
                        </div>
                        
                        {/* Birim */}
                        <div className="col-span-1">
                          <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-xs">
                            {item.unit || 'adet'}
                          </div>
                        </div>
                        
                        {/* Birim Fiyat */}
                        <div className="col-span-1">
                          <div className="p-1.5 bg-gray-100 rounded text-right font-medium text-xs">
                            {formatCurrency(item.unit_price, item.currency || 'TRY')}
                          </div>
                        </div>
                        
                        {/* KDV % */}
                        <div className="col-span-1">
                          <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-xs">
                            {item.tax_rate ? `%${item.tax_rate}` : '-'}
                          </div>
                        </div>
                        
                        {/* İndirim */}
                        <div className="col-span-1">
                          <div className="p-1.5 bg-gray-100 rounded text-center font-medium text-xs">
                            {item.discount_rate && item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                          </div>
                        </div>
                        
                        {/* Toplam */}
                        <div className="col-span-1">
                          <div className="p-1.5 bg-gray-100 rounded text-right font-medium text-xs">
                            {formatCurrency(item.total_price, item.currency || 'TRY')}
                          </div>
                        </div>
                        
                        {/* Düzenle ve Sil Butonları */}
                        <div className="col-span-1 flex gap-1 justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const existingData = {
                                name: item.name,
                                description: item.description || '',
                                quantity: item.quantity,
                                unit: item.unit,
                                unit_price: item.unit_price,
                                vat_rate: item.tax_rate || 20,
                                discount_rate: item.discount_rate || 0,
                                currency: item.currency || formData.currency
                              };
                              
                              setSelectedProduct(null);
                              setEditingItemIndex(index);
                              setEditingItemData(existingData);
                              setProductModalOpen(true);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          </CardContent>
        </Card>

        {/* Terms and Financial Summary - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Terms & Conditions */}
          <Card className="lg:col-span-2 shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-2 pt-2.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
                  <Check className="h-4 w-4 text-indigo-600" />
                </div>
                Şartlar ve Koşullar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 px-4 pb-4">
              <ProposalFormTerms
                paymentTerms={formData.payment_terms}
                deliveryTerms={formData.delivery_terms}
                warrantyTerms={formData.warranty_terms}
                priceTerms={formData.price_terms}
                otherTerms={formData.other_terms}
                onInputChange={(e) => handleFieldChange(e.target.name, e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className="lg:col-span-1 shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-2 pt-2.5">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Finansal Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 px-4 pb-4">
                {/* Always use multi-currency display to show actual currencies used */}
                <div className="space-y-4">
                  {Object.entries(calculationsByCurrency).map(([currency, totals]) => (
                    <div key={currency} className="space-y-3">
                      {Object.keys(calculationsByCurrency).length > 1 && (
                        <div className="text-right text-sm font-medium text-primary">
                          {currency} Toplamları
                        </div>
                      )}
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Brüt Toplam:</span>
                          <span className="font-medium">{formatCurrency(totals.gross, currency)}</span>
                        </div>
                        
                        {/* Global Discount Controls */}
                        <div className="border-t pt-2 space-y-2">
                          <div className="text-xs text-center text-muted-foreground">
                            Genel İndirim
                          </div>
                          <div className="flex gap-2">
                            <Select value={globalDiscountType} onValueChange={(value: 'percentage' | 'amount') => setGlobalDiscountType(value)}>
                              <SelectTrigger className="w-16 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">%</SelectItem>
                                <SelectItem value="amount">₺</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Input
                              type="number"
                              value={globalDiscountValue}
                              onChange={(e) => setGlobalDiscountValue(Number(e.target.value))}
                              placeholder="0"
                              min="0"
                              step={globalDiscountType === 'percentage' ? '0.1' : '0.01'}
                              className="flex-1 h-7 text-xs"
                            />
                          </div>
                        </div>
                        
                        {totals.discount > 0 && (
                          <div className="flex justify-between text-red-600 text-xs">
                            <span>İndirim:</span>
                            <span>-{formatCurrency(totals.discount, currency)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Net Toplam:</span>
                          <span className="font-medium">{formatCurrency(totals.net, currency)}</span>
                        </div>
                        
                        {totals.vat > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">KDV:</span>
                            <span className="font-medium">{formatCurrency(totals.vat, currency)}</span>
                          </div>
                        )}
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between font-bold text-sm">
                          <span>GENEL TOPLAM:</span>
                          <span className="text-green-600">{formatCurrency(totals.grand, currency)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
          </Card>
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
      </div>
    </div>
  );
};

export default NewProposalCreate;