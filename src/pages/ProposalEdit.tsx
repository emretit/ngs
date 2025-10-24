
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash, Edit, ArrowLeft, Calculator, Check, ChevronsUpDown, Clock, Send, ShoppingCart, FileText, Download, MoreHorizontal, Save, FileDown, Eye, TrendingUp, ArrowRight, Building2, CalendarDays, XCircle } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatters";
import { useProposalEdit } from "@/hooks/useProposalEdit";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { FormProvider, useForm } from "react-hook-form";
import { ProposalItem } from "@/types/proposal";

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { proposalStatusColors, proposalStatusLabels, ProposalStatus } from "@/types/proposal";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { handleProposalStatusChange } from "@/services/workflow/proposalWorkflow";
import { PdfExportService } from "@/services/pdf/pdfExportService";
import ProposalFormTerms from "@/components/proposals/form/ProposalFormTerms";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import ContactPersonInput from "@/components/proposals/form/ContactPersonInput";
import ProductSelector from "@/components/proposals/form/ProductSelector";
import ProductDetailsModal from "@/components/proposals/form/ProductDetailsModal";
import ProposalPartnerSelect from "@/components/proposals/form/ProposalPartnerSelect";

// New Card Components
import CustomerInfoCard from "@/components/proposals/cards/CustomerInfoCard";
import ProposalDetailsCard from "@/components/proposals/cards/ProposalDetailsCard";
import ProductServiceCard from "@/components/proposals/cards/ProductServiceCard";
import TermsConditionsCard from "@/components/proposals/cards/TermsConditionsCard";
import FinancialSummaryCard from "@/components/proposals/cards/FinancialSummaryCard";

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
  
  // Form object for FormProvider
  const form = useForm({
    defaultValues: {
      customer_id: proposal?.customer_id || '',
      contact_name: proposal?.contact_name || '',
      prepared_by: proposal?.prepared_by || '',
      employee_id: proposal?.employee_id || '',
    }
  });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);
  
  // Global discount state
  const [globalDiscountType, setGlobalDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      toast.success("Teklif silindi");
      navigate("/proposals");
    } catch (error) {
      console.error('Error deleting proposal:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
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
    // Status action butonları artık İşlemler dropdown menüsünde
    return null;
  };

  const handleExportPDF = () => {
    toast.info("PDF export özelliği yakında eklenecek");
  };

  const handleConvertToSale = () => {
    toast.info("Satışa çevirme özelliği yakında eklenecek");
  };

  const handleSmartSave = () => {
    handleSaveChanges(proposal.status);
  };

  // Status action fonksiyonları
  const handleSendToCustomer = () => {
    handleStatusChange('sent');
  };

  const handleSendForApproval = () => {
    handleStatusChange('pending_approval');
  };

  const handleConvertToDraft = () => {
    handleStatusChange('draft');
  };

  const handleAcceptProposal = () => {
    handleStatusChange('accepted');
  };

  const handleRejectProposal = () => {
    handleStatusChange('rejected');
  };

  return (
    <div>
      {/* Header Actions */}
      <div className="mb-6 p-6 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="gap-2 hover:bg-white/60 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/60 rounded-xl shadow-sm">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">
                  Teklif Düzenle
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${proposalStatusColors[proposal.status]} text-xs`}>
                    {proposalStatusLabels[proposal.status]}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {proposal.number || 'Teklif #' + id}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSmartSave}
              disabled={isSaving || !hasChanges}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Kaydediliyor..." : hasChanges ? "Değişiklikleri Kaydet" : "Kaydedildi"}</span>
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
                
                {/* Status Actions */}
                {proposal.status === 'draft' && (
                  <>
                    <DropdownMenuItem onClick={handleSendToCustomer} className="gap-2 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Send className="h-4 w-4" />
                      <span>Müşteriye Gönder</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSendForApproval} className="gap-2 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                      <Clock className="h-4 w-4" />
                      <span>Onaya Gönder</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                {proposal.status === 'pending_approval' && (
                  <>
                    <DropdownMenuItem onClick={handleSendToCustomer} className="gap-2 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Send className="h-4 w-4" />
                      <span>Müşteriye Gönder</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleConvertToDraft} className="gap-2 cursor-pointer text-gray-600 hover:text-gray-700 hover:bg-gray-50">
                      <ArrowLeft className="h-4 w-4" />
                      <span>Taslağa Çevir</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                {proposal.status === 'sent' && (
                  <>
                    <DropdownMenuItem onClick={handleAcceptProposal} className="gap-2 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50">
                      <Check className="h-4 w-4" />
                      <span>Kabul Edildi</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleRejectProposal} className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                      <XCircle className="h-4 w-4" />
                      <span>Reddedildi</span>
                    </DropdownMenuItem>
                  </>
                )}
                
                {proposal.status === 'accepted' && (
                  <DropdownMenuItem onClick={handleConvertToOrder} className="gap-2 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Siparişe Çevir</span>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleConvertToSale} className="gap-2 cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50">
                  <TrendingUp className="h-4 w-4" />
                  <span>Satışa Çevir</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleDeleteClick} className="gap-2 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash className="h-4 w-4" />
                  <span>Sil</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Status Actions */}
      {getStatusActions()}

      {/* Main Content */}
      <div className="space-y-4">
        {/* Top Row - Customer & Proposal Details Combined */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Customer Information */}
          <CustomerInfoCard
            data={{
              customer_id: formData.customer_id,
              contact_name: formData.contact_name,
              prepared_by: formData.prepared_by,
              employee_id: formData.employee_id,
            }}
            onChange={handleFieldChange}
            errors={{}}
            required={true}
          />

          {/* Offer Details */}
          <ProposalDetailsCard
            data={{
              subject: formData.subject,
              offer_date: formData.offer_date,
              validity_date: formData.validity_date,
              offer_number: formData.offer_number,
              status: formData.status,
              currency: formData.currency,
              exchange_rate: formData.exchange_rate,
              notes: formData.notes,
            }}
            onChange={handleFieldChange}
            errors={{}}
          />
        </div>

        {/* Products/Services Table - Full Width */}
        <ProductServiceCard
          items={items}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onUpdateItem={handleItemChange}
          onMoveItemUp={undefined}
          onMoveItemDown={undefined}
          loading={false}
        />

        {/* Terms and Financial Summary - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Terms & Conditions */}
          <TermsConditionsCard
            data={{
              payment_terms: formData.payment_terms,
              delivery_terms: formData.delivery_terms,
              warranty_terms: formData.warranty_terms,
              price_terms: formData.price_terms,
              other_terms: formData.other_terms,
            }}
            onChange={(field, value) => handleFieldChange(field, value)}
            errors={{}}
          />

          {/* Financial Summary */}
          <FinancialSummaryCard
            data={{
              gross_total: Object.values(calculationsByCurrency)[0]?.gross || 0,
              vat_percentage: formData.vat_percentage || 20,
              discount_type: globalDiscountType,
              discount_value: globalDiscountValue,
              net_total: Object.values(calculationsByCurrency)[0]?.net || 0,
              vat_amount: Object.values(calculationsByCurrency)[0]?.vat || 0,
              total_amount: Object.values(calculationsByCurrency)[0]?.grand || 0,
              currency: formData.currency || 'TRY',
            }}
            onChange={(field, value) => {
              if (field === 'vat_percentage') {
                handleFieldChange('vat_percentage', value);
              } else if (field === 'discount_type') {
                setGlobalDiscountType(value);
                setHasChanges(true);
              } else if (field === 'discount_value') {
                setGlobalDiscountValue(value);
                setHasChanges(true);
              }
            }}
            errors={{}}
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

        {/* Confirmation Dialog */}
        <ConfirmationDialogComponent
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Teklifi Sil"
          description="Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          confirmText="Sil"
          cancelText="İptal"
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default ProposalEdit;
