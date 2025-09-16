import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Plus, Trash2, Eye, FileDown, Calculator, Check, ChevronsUpDown, Edit, FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { proposalStatusLabels, proposalStatusColors, ProposalStatus } from "@/types/proposal";
import { Badge } from "@/components/ui/badge";
import { useProposalCreation } from "@/hooks/proposals/useProposalCreation";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { ProposalItem } from "@/types/proposal";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { PdfDownloadDropdown } from "@/components/proposals/PdfDownloadDropdown";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface NewProposalCreateProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const NewProposalCreate = ({ isCollapsed, setIsCollapsed }: NewProposalCreateProps) => {
  const navigate = useNavigate();
  const { createProposal } = useProposalCreation();
  const { customers, isLoading: isLoadingCustomers } = useCustomerSelect();
  const [saving, setSaving] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);
  
  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Turkish character normalization function
  const normalizeTurkish = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ş/g, 's').replace(/Ş/g, 's')
      .replace(/ç/g, 'c').replace(/Ç/g, 'c')
      .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/Ü/g, 'u')
      .replace(/ö/g, 'o').replace(/Ö/g, 'o')
      .replace(/ı/g, 'i').replace(/I/g, 'i').replace(/İ/g, 'i');
  };

  // Filter customers based on search query
  const filteredCustomers = customers?.filter(customer => {
    if (!customerSearchQuery.trim()) return true;
    
    const normalizedQuery = normalizeTurkish(customerSearchQuery);
    return customer.searchableText.includes(normalizedQuery);
  });

  // Form state matching the sample format
  const [formData, setFormData] = useState({
    // Customer Section
    customer_company: "",
    contact_name: "",
    contact_title: "",
    offer_date: new Date().toISOString().split('T')[0],
    offer_number: `TKF-${Date.now().toString().slice(-6)}`,
    
    // General Section
    validity_date: "",
    prepared_by: "",
    notes: "",
    
    // Financial settings
    currency: "TRY",
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
        description: formData.notes,
        number: formData.offer_number,
        customer_id: formData.customer_id || null,
        employee_id: formData.prepared_by || null,
        valid_until: formData.validity_date,
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
    <DefaultLayout 
      isCollapsed={isCollapsed} 
      setIsCollapsed={setIsCollapsed}
      title="World-Class Teklif Oluşturma"
      subtitle="Enterprise-grade B2B teklif sistemi"
    >
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
      <div className="space-y-6">
        {/* Top Row - Customer & Proposal Details Combined */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Customer Information */}
          <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="customer_company" className="text-sm">Firma Adı *</Label>
                  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerSearchOpen}
                        className={cn(
                          "w-full justify-between",
                          !formData.customer_company && "text-muted-foreground"
                        )}
                        disabled={isLoadingCustomers}
                      >
                        <span className="truncate text-left flex-1">{formData.customer_company || "Müşteri ara..."}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                       <Command shouldFilter={false} className="rounded-lg border shadow-md">
                         <CommandInput 
                           placeholder="Müşteri veya firma adı ile ara..." 
                           className="h-9"
                           value={customerSearchQuery}
                           onValueChange={setCustomerSearchQuery}
                         />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty className="py-6 text-center text-sm">
                            Aramanızla eşleşen müşteri bulunamadı.
                          </CommandEmpty>
                          <CommandGroup>
                             {filteredCustomers?.map((customer) => (
                               <CommandItem
                                 key={customer.id}
                                 value={customer.searchableText}
                                 onSelect={() => {
                                   const selectedName = customer.company || customer.name;
                                   handleFieldChange('customer_company', selectedName);
                                   handleFieldChange('contact_name', customer.name);
                                   handleFieldChange('customer_id', customer.id);
                                   setCustomerSearchOpen(false);
                                 }}
                                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground rounded-sm transition-colors"
                              >
                                 <Check
                                   className={cn(
                                     "h-4 w-4 shrink-0",
                                     formData.customer_id === customer.id ? "opacity-100" : "opacity-0"
                                   )}
                                 />
                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    {customer.company ? (
                                      <>
                                        <span className="font-medium text-foreground truncate">
                                          {customer.company}
                                        </span>
                                        <span className="px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground">
                                          {customer.name}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="font-medium text-foreground truncate">
                                        {customer.name}
                                      </span>
                                    )}
                                  </div>
                                  {customer.email && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {customer.email}
                                    </span>
                                  )}
                                  {(customer.mobile_phone || customer.address) && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {customer.mobile_phone && (
                                        <span>{customer.mobile_phone}</span>
                                      )}
                                      {customer.mobile_phone && customer.address && (
                                        <span>•</span>
                                      )}
                                      {customer.address && (
                                        <span className="truncate">{customer.address}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <ContactPersonInput
                  value={formData.contact_name}
                  onChange={(value) => handleFieldChange('contact_name', value)}
                  customerId={formData.customer_id}
                  error=""
                />
                <div>
                  <Label htmlFor="prepared_by">Teklifi Hazırlayan</Label>
                  <EmployeeSelector
                    value={formData.prepared_by || ""}
                    onChange={(value) => {
                      handleFieldChange('prepared_by', value);
                      handleFieldChange('employee_id', value);
                    }}
                    error=""
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offer Details */}
          <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                  <CalendarDays className="h-4 w-4 text-green-600" />
                </div>
                Teklif Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="offer_date" className="text-sm">Teklif Tarihi</Label>
                  <Input
                    id="offer_date"
                    type="date"
                    value={formData.offer_date}
                    onChange={(e) => handleFieldChange('offer_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="offer_number" className="text-sm">Teklif No</Label>
                  <Input
                    id="offer_number"
                    value={formData.offer_number}
                    onChange={(e) => handleFieldChange('offer_number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="validity_date" className="text-sm">Geçerlilik Tarihi *</Label>
                  <Input
                    id="validity_date"
                    type="date"
                    value={formData.validity_date}
                    onChange={(e) => handleFieldChange('validity_date', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="status" className="text-sm">Teklif Durumu</Label>
                  <Select value={formData.status} onValueChange={(value: ProposalStatus) => handleFieldChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <Badge className={proposalStatusColors.draft}>
                            {proposalStatusLabels.draft}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending_approval">
                        <div className="flex items-center gap-2">
                          <Badge className={proposalStatusColors.pending_approval}>
                            {proposalStatusLabels.pending_approval}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="sent">
                        <div className="flex items-center gap-2">
                          <Badge className={proposalStatusColors.sent}>
                            {proposalStatusLabels.sent}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="accepted">
                        <div className="flex items-center gap-2">
                          <Badge className={proposalStatusColors.accepted}>
                            {proposalStatusLabels.accepted}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <Badge className={proposalStatusColors.rejected}>
                            {proposalStatusLabels.rejected}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="expired">
                        <div className="flex items-center gap-2">
                          <Badge className={proposalStatusColors.expired}>
                            {proposalStatusLabels.expired}
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes" className="text-sm">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Teklif hakkında özel notlar..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products/Services Table - Full Width */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3">
            <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                      <Plus className="h-4 w-4 text-purple-600" />
                    </div>
                    Ürün/Hizmet Listesi
                  </CardTitle>
                  <Button onClick={addItem} size="sm" className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-sm transition-all duration-200">
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Satır Ekle</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-3 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-600">
                          Satır {item.row_number}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
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
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        <div className="md:col-span-6">
                          <Label className="text-sm">Ürün/Hizmet *</Label>
                          <ProductSelector
                            value={item.description || ''}
                            onChange={(productName) => {
                              handleItemChange(index, 'description', productName);
                            }}
                            onProductSelect={(product) => handleProductModalSelect(product, index)}
                            placeholder="Ürün seçin..."
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <Label className="text-sm">Miktar</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                            min="1"
                            className="mt-1"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <Label className="text-sm">Birim</Label>
                          <div className="mt-1 p-2 bg-gray-100 rounded text-center font-medium text-sm">
                            {item.unit || 'adet'}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-sm">Birim Fiyat</Label>
                           <div className="mt-1 p-2 bg-gray-100 rounded text-right font-medium text-sm">
                             {formatCurrency(item.unit_price, item.currency || 'TRY')}
                           </div>
                         </div>
                         <div className="md:col-span-1">
                           <Label className="text-sm">İndirim</Label>
                           <div className="mt-1 p-2 bg-gray-100 rounded text-center font-medium text-sm">
                             {item.discount_rate && item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                           </div>
                         </div>
                         <div className="md:col-span-1">
                           <Label className="text-sm">Toplam</Label>
                           <div className="mt-1 p-2 bg-gray-100 rounded text-right font-medium text-sm">
                             {formatCurrency(item.total_price, item.currency || 'TRY')}
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary - Right Side */}
          <div className="xl:col-span-1">
            <Card className="sticky top-6 shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
                    <Calculator className="h-4 w-4 text-orange-600" />
                  </div>
                  Finansal Özet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Always use multi-currency display to show actual currencies used */}
                <div className="space-y-4">
                  {Object.entries(calculationsByCurrency).map(([currency, totals]) => (
                    <div key={currency} className="border rounded-lg p-3 space-y-2">
                      <div className="font-medium text-sm text-center mb-2 text-primary">
                        {Object.keys(calculationsByCurrency).length > 1 ? `${currency} Toplamları` : "Finansal Toplam"}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Brüt Toplam:</span>
                          <span className="font-medium">{formatCurrency(totals.gross, currency)}</span>
                        </div>
                        
                        {/* Global Discount Controls */}
                        <div className="border-t pt-2 space-y-2">
                          <div className="font-medium text-xs text-center text-muted-foreground">
                            Genel İndirim
                          </div>
                          <div className="flex gap-2">
                            <Select value={globalDiscountType} onValueChange={(value: 'percentage' | 'amount') => setGlobalDiscountType(value)}>
                              <SelectTrigger className="w-20 h-8 text-xs">
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
                              className="flex-1 h-8 text-xs"
                            />
                          </div>
                        </div>
                        
                        {totals.discount > 0 && (
                          <div className="flex justify-between text-red-600 text-sm">
                            <span>İndirim:</span>
                            <span>-{formatCurrency(totals.discount, currency)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Net Toplam:</span>
                          <span className="font-medium">{formatCurrency(totals.net, currency)}</span>
                        </div>
                        
                        {totals.vat > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">KDV:</span>
                            <span className="font-medium">{formatCurrency(totals.vat, currency)}</span>
                          </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex justify-between font-bold">
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
        </div>

        {/* Terms & Conditions - Full Width */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
                <Check className="h-4 w-4 text-indigo-600" />
              </div>
              Şartlar ve Koşullar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
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
    </DefaultLayout>
  );
};

export default NewProposalCreate;