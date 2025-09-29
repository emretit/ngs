
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash, Edit, ArrowLeft, Calculator, Check, ChevronsUpDown, Clock, Send, ShoppingCart, FileText, Download } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { useProposalEdit } from "@/hooks/useProposalEdit";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { ProposalItem } from "@/types/proposal";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { proposalStatusColors, proposalStatusLabels, ProposalStatus } from "@/types/proposal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { handleProposalStatusChange } from "@/services/workflow/proposalWorkflow";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import CustomerSelector from "@/components/proposals/form/CustomerSelector";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface ProposalEditProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ProposalEdit = ({ isCollapsed, setIsCollapsed }: ProposalEditProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { proposal, loading, saving, handleBack, handleSave } = useProposalEdit();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);
  
  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);

  // Form state matching the proposal edit format
  const [formData, setFormData] = useState({
    // Customer Section
    customer_company: "",
    contact_name: "",
    contact_title: "",
    offer_date: undefined as Date | undefined,
    offer_number: "",
    
    // General Section
    validity_date: undefined as Date | undefined,
    prepared_by: "",
    notes: "",
    
    // Financial settings
    currency: "TRY",
    discount_percentage: 0,
    vat_percentage: 20,
    
    // Terms
    payment_terms: "",
    delivery_terms: "",
    warranty_terms: "",
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
  const [items, setItems] = useState<LineItem[]>([]);
  
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Load templates when component mounts
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const data = await PdfExportService.getTemplates('quote');
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Initialize form data when proposal loads
  useEffect(() => {
    if (proposal) {
      setFormData({
        customer_company: String(proposal.customer_company || ""),
        contact_name: String(proposal.contact_name || ""),
        contact_title: "",
        offer_date: proposal.created_at ? new Date(proposal.created_at) : undefined,
        offer_number: proposal.number || "",
        validity_date: proposal.valid_until ? new Date(proposal.valid_until) : undefined,
        prepared_by: proposal.employee_id || "",
        notes: proposal.notes || "",
        currency: proposal.currency || "TRY",
        discount_percentage: 0,
        vat_percentage: 20,
        payment_terms: proposal.payment_terms || "Siparişle birlikte %50 avans, teslimde kalan tutar ödenecektir.",
        delivery_terms: proposal.delivery_terms || "Teslimat süresi: Sipariş tarihinden itibaren 15-20 iş günü",
        warranty_terms: proposal.warranty_terms || "Ürünlerimiz 2 yıl garantilidir.",
        price_terms: proposal.price_terms || "",
        other_terms: proposal.other_terms || "",
        title: proposal.title || "",
        customer_id: proposal.customer_id || "",
        employee_id: proposal.employee_id || "",
        description: proposal.description || "",
        status: proposal.status as ProposalStatus
      });

      // Initialize items from proposal
      if (proposal.items && proposal.items.length > 0) {
        const initialItems = proposal.items.map((item, index) => ({
          ...item,
          id: item.id || crypto.randomUUID(),
          row_number: index + 1,
        }));
        setItems(initialItems);
      } else {
        setItems([{
          id: "1",
          row_number: 1,
          name: "",
          description: "",
          quantity: 1,
          unit: "adet",
          unit_price: 0,
          total_price: 0,
          currency: proposal.currency || "TRY"
        }]);
      }
    }
  }, [proposal]);

  // Track changes
  const handleFieldChange = (field: string, value: any) => {
    console.log('🔍 ProposalEdit - handleFieldChange:', { field, value });
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Calculate totals by currency (modern approach like NewProposalCreate)
  const calculateTotalsByCurrency = () => {
    const totals: Record<string, { gross: number; discount: number; net: number; vat: number; grand: number }> = {};
    
    // First, collect all currencies used in items
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
      const vat = (net * (formData.vat_percentage || 0)) / 100;
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
  
  // Auto-detect primary currency from items (use the currency with highest total)
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
  
  const calculations = {
    gross_total: primaryTotals.gross,
    discount_amount: primaryTotals.discount,
    net_total: primaryTotals.net,
    vat_amount: primaryTotals.vat,
    grand_total: primaryTotals.grand
  };

  // Update item calculations
  useEffect(() => {
    const updatedItems = items.map(item => ({
      ...item,
      total_price: item.quantity * item.unit_price
    }));
    setItems(updatedItems);
  }, [items.map(item => `${item.quantity}-${item.unit_price}`).join(',')]);

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setItems(updatedItems);
    setHasChanges(true);
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
    setHasChanges(true);
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
    setHasChanges(true);
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
      setHasChanges(true);
    }
  };

  // Save function
  const handleSaveChanges = async (status: ProposalStatus = proposal?.status || 'draft') => {
    console.log("🔍 Save changes clicked with status:", status);
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
    if (items.length === 0 || items.every(item => !item.name.trim() && !item.description.trim())) {
      console.log("❌ Validation failed: no valid items");
      toast.error("En az bir teklif kalemi eklenmelidir");
      return;
    }

    console.log("✅ All validations passed, proceeding with save...");

    setIsSaving(true);
    try {
      // Prepare data for backend compatible with database schema
      const proposalData = {
        title: `${formData.customer_company} - Teklif`,
        description: formData.notes,
        number: formData.offer_number,
        customer_id: formData.customer_id || null,
        employee_id: formData.employee_id || null,
        valid_until: formData.validity_date?.toISOString().split('T')[0] || "",
        terms: `${formData.payment_terms}\n\n${formData.delivery_terms}\n\nGaranti: ${formData.warranty_terms}`,
        payment_terms: formData.payment_terms,
        delivery_terms: formData.delivery_terms,
        warranty_terms: formData.warranty_terms,
        price_terms: formData.price_terms,
        other_terms: formData.other_terms,
        notes: formData.notes,
        status: status,
        // Financial totals for PDF generation
        subtotal: primaryTotals.gross,
        total_discount: primaryTotals.discount,
        total_tax: primaryTotals.vat,
        total_amount: primaryTotals.grand,
        currency: primaryCurrency,
        items: items.map(item => ({
          ...item,
          total_price: item.quantity * item.unit_price
        }))
      };

      console.log("🔍 Prepared proposal data:", proposalData);

      await handleSave(proposalData);
      setHasChanges(false);
      toast.success("Teklif başarıyla güncellendi");
    } catch (error) {
      console.error("💥 Error saving proposal:", error);
      toast.error("Teklif güncellenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
    <div className="flex items-center justify-center h-[600px]">
          <div className="w-8 h-8 border-4 border-t-blue-600 border-b-blue-600 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
        </div>
  );
  }

  if (!proposal) {
    return (
    <div className="flex flex-col items-center justify-center h-[600px]">
          <h2 className="text-xl font-semibold mb-2">Teklif Bulunamadı</h2>
          <p className="text-muted-foreground mb-6">İstediğiniz teklif mevcut değil veya erişim izniniz yok.</p>
          <Button onClick={handleBack}>Teklifler Sayfasına Dön</Button>
        </div>
  );
  }

  const handlePreview = () => {
    toast.info("Önizleme özelliği yakında eklenecek");
  };

  const handleStatusChange = async (newStatus: ProposalStatus) => {
    if (!proposal) return;
    
    try {
      await handleProposalStatusChange(
        proposal.id,
        proposal.title,
        proposal.opportunity_id || null,
        newStatus,
        proposal.employee_id
      );
      
      toast.success(`Teklif durumu "${proposalStatusLabels[newStatus]}" olarak güncellendi`);
    } catch (error) {
      console.error("Error updating proposal status:", error);
      toast.error("Teklif durumu güncellenirken bir hata oluştu");
    }
  };

  const handleDelete = () => {
    toast.success("Teklif silindi");
    navigate("/proposals");
  };

  const handlePdfPrint = async (templateId?: string) => {
    if (!proposal) return;
    
    try {
      // Teklif detaylarını çek
      const proposalData = await PdfExportService.transformProposalForPdf(proposal);
      
      // PDF'i yeni sekmede aç
      await PdfExportService.openPdfInNewTab(proposalData, { templateId });
      
      toast("PDF yeni sekmede açıldı");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("PDF oluşturulurken hata oluştu: " + (error as Error).message);
    }
  };

  const handleSendEmail = () => {
    toast.success("E-posta gönderme penceresi açıldı");
  };

  const handleConvertToOrder = () => {
    if (!proposal) return;
    
    navigate(`/orders/create?proposalId=${proposal.id}`);
    toast.success("Sipariş oluşturma sayfasına yönlendiriliyorsunuz");
  };

  const getStatusActions = () => {
    if (!proposal) return null;
    
    const actions = [];
    
    if (proposal.status === 'draft') {
      actions.push(
        <Button key="send" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange('sent')}>
          <Send className="h-4 w-4 mr-2" />
          Müşteriye Gönder
        </Button>
      );
      actions.push(
        <Button key="pending" variant="outline" onClick={() => handleStatusChange('pending_approval')}>
          <Clock className="h-4 w-4 mr-2" />
          Onaya Gönder
        </Button>
      );
    }
    
    if (proposal.status === 'pending_approval') {
      actions.push(
        <Button key="send" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStatusChange('sent')}>
          <Send className="h-4 w-4 mr-2" />
          Müşteriye Gönder
        </Button>
      );
      actions.push(
        <Button key="draft" variant="outline" onClick={() => handleStatusChange('draft')}>
          Taslağa Çevir
        </Button>
      );
    }
    
    if (proposal.status === 'sent') {
      actions.push(
        <Button key="accept" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange('accepted')}>
          Kabul Edildi
        </Button>
      );
      actions.push(
        <Button key="reject" variant="destructive" onClick={() => handleStatusChange('rejected')}>
          Reddedildi
        </Button>
      );
    }
    
    if (proposal.status === 'accepted') {
      actions.push(
        <Button key="convert" onClick={handleConvertToOrder} className="bg-green-600 hover:bg-green-700">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Siparişe Çevir
        </Button>
      );
    }
    
    return actions.length > 0 ? (
      <div className="flex flex-wrap gap-2 mt-4">
        {actions}
      </div>
    ) : null;
  };

  return (
    <div>
      {/* Header Actions */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Teklif Düzenle</h1>
            <Badge className={proposalStatusColors[proposal.status]}>
              {proposalStatusLabels[proposal.status]}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">

          <Button 
            variant="outline" 
            onClick={() => handleSaveChanges(proposal.status)}
            disabled={isSaving || !hasChanges}
            size="sm"
          >
            {hasChanges ? "Değişiklikleri Kaydet" : "Kaydedildi"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF Yazdır
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {templates.map(template => (
                <DropdownMenuItem 
                  key={template.id} 
                  onClick={() => handlePdfPrint(template.id)}
                  className="cursor-pointer"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {template.name} {template.is_default && '(Varsayılan)'}
                </DropdownMenuItem>
              ))}
              {templates.length === 0 && (
                <DropdownMenuItem disabled>
                  Şablon bulunamadı
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="bg-red-600 hover:bg-red-700 text-white" size="sm">
                <Trash className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Teklif Sil</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu teklifi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status Actions */}
      {getStatusActions()}

      {/* Main Content */}
      <div className="space-y-4">
        {/* Top Row - Customer & Proposal Details Combined */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Müşteri Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="grid grid-cols-1 gap-3">
                <CustomerSelector
                  value={formData.customer_id}
                  onChange={(customerId, customerName, companyName) => {
                    handleFieldChange('customer_id', customerId);
                    handleFieldChange('customer_company', companyName);
                    handleFieldChange('contact_name', customerName);
                  }}
                  error=""
                />
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
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offer Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Teklif Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Tarih Alanları - Altlı Üstlü */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="offer_date" className="text-sm font-medium text-gray-700">Teklif Tarihi</Label>
                    <DatePicker
                      date={formData.offer_date}
                      onSelect={(date) => handleFieldChange('offer_date', date)}
                      placeholder="Teklif tarihi seçin"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validity_date" className="text-sm font-medium text-gray-700">
                      Geçerlilik Tarihi <span className="text-red-500">*</span>
                    </Label>
                    <DatePicker
                      date={formData.validity_date}
                      onSelect={(date) => handleFieldChange('validity_date', date)}
                      placeholder="Geçerlilik tarihi seçin"
                    />
                  </div>
                </div>
              </div>

              {/* Diğer Alanlar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="offer_number" className="text-sm font-medium text-gray-700">Teklif No</Label>
                  <Input
                    id="offer_number"
                    value={formData.offer_number}
                    onChange={(e) => handleFieldChange('offer_number', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">Teklif Durumu</Label>
                  <Select value={formData.status} onValueChange={(value: ProposalStatus) => handleFieldChange('status', value)}>
                    <SelectTrigger className="mt-1">
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
              </div>

              {/* Notlar Alanı */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notlar</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Teklif hakkında notlarınızı yazın..."
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products/Services Table - Full Width */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Ürün/Hizmet Listesi</CardTitle>
              <Button onClick={addItem} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Satır Ekle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
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
                            className="h-8 text-xs"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Terms & Conditions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Check className="h-4 w-4" />
                Şartlar ve Koşullar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
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
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Finansal Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                {/* Multi-currency display */}
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
                        
                        {/* VAT Percentage Control */}
                        <div className="border-t pt-2 space-y-2">
                          <div className="text-xs text-center text-muted-foreground">
                            KDV Oranı
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={formData.vat_percentage}
                              onChange={(e) => {
                                handleFieldChange('vat_percentage', Number(e.target.value));
                              }}
                              placeholder="20"
                              min="0"
                              max="100"
                              step="0.1"
                              className="flex-1 h-6 text-xs"
                            />
                            <div className="px-2 py-1 bg-muted text-xs flex items-center">
                              %
                            </div>
                          </div>
                        </div>

                        {/* Global Discount Controls */}
                        <div className="border-t pt-2 space-y-2">
                          <div className="text-xs text-center text-muted-foreground">
                            Genel İndirim
                          </div>
                          <div className="flex gap-2">
                            <Select value={globalDiscountType} onValueChange={(value: 'percentage' | 'amount') => {
                              setGlobalDiscountType(value);
                              setHasChanges(true);
                            }}>
                              <SelectTrigger className="w-16 h-6 text-xs">
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
                              onChange={(e) => {
                                setGlobalDiscountValue(Number(e.target.value));
                                setHasChanges(true);
                              }}
                              placeholder="0"
                              min="0"
                              step={globalDiscountType === 'percentage' ? '0.1' : '0.01'}
                              className="flex-1 h-6 text-xs"
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

export default ProposalEdit;
