
// Redesigned ProposalCreate.tsx for better UX
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Clock, Save, Send, AlertCircle, Loader2, Eye, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useProposalCreation } from "@/hooks/proposals/useProposalCreation";
import { cn } from "@/lib/utils";

// Import enhanced form components
import ProposalContextPopulator from "@/components/proposals/form/enhanced/ProposalContextPopulator";
import ProposalBasicInfoTab from "@/components/proposals/form/enhanced/ProposalBasicInfoTab";
import ProposalAddressTab from "@/components/proposals/form/enhanced/ProposalAddressTab";
import ProposalLineItemsTab from "@/components/proposals/form/enhanced/ProposalLineItemsTab";
import ProposalSummaryTab from "@/components/proposals/form/enhanced/ProposalSummaryTab";
import ProposalNotesTab from "@/components/proposals/form/enhanced/ProposalNotesTab";
import ProposalStatusIndicator from "@/components/proposals/form/enhanced/ProposalStatusIndicator";
import ProposalPreviewDialog from "@/components/proposals/form/enhanced/ProposalPreviewDialog";

interface ProposalCreateProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ProposalCreate = ({ isCollapsed, setIsCollapsed }: ProposalCreateProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [completionProgress, setCompletionProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const { createProposal } = useProposalCreation();

  // Auto-populated context from URL params
  const customerId = searchParams.get('customer_id');
  const opportunityId = searchParams.get('opportunity_id');
  const templateId = searchParams.get('template_id');

  // Form state - enhanced with all required fields
  const [formData, setFormData] = useState({
    // Basic Information
    title: "",
    description: "",
    status: "draft" as const,
    valid_until: "",
    currency: "TRY",
    
    // Customer & Context
    customer_id: customerId || "",
    opportunity_id: opportunityId || "",
    employee_id: "",
    
    // Billing & Shipping
    billing_address: {
      company: "",
      contact_person: "",
      address: "",
      city: "",
      postal_code: "",
      country: "Türkiye",
      tax_number: "",
      tax_office: ""
    },
    shipping_address: {
      same_as_billing: true,
      company: "",
      contact_person: "",
      address: "",
      city: "",
      postal_code: "",
      country: "Türkiye"
    },
    
    // Line Items
    items: [],
    
    // Summary & Calculations
    subtotal: 0,
    total_tax: 0,
    total_discount: 0,
    total_amount: 0,
    price_list_id: "",
    
    // Terms & Notes
    payment_terms: "",
    delivery_terms: "",
    notes: "",
    internal_notes: "",
    terms_and_conditions: ""
  });

  // Tab completion status
  const tabsCompletion = {
    basic: { 
      completed: !!(formData.title && formData.customer_id && formData.valid_until),
      required: true 
    },
    address: { 
      completed: !!(formData.billing_address.company && formData.billing_address.address),
      required: true 
    },
    items: { 
      completed: formData.items.length > 0,
      required: true 
    },
    summary: { 
      completed: formData.total_amount > 0,
      required: false 
    },
    notes: { 
      completed: !!(formData.payment_terms || formData.delivery_terms),
      required: false 
    }
  };

  // Calculate completion progress
  useEffect(() => {
    const totalTabs = Object.keys(tabsCompletion).length;
    const completedTabs = Object.values(tabsCompletion).filter(tab => tab.completed).length;
    setCompletionProgress((completedTabs / totalTabs) * 100);
  }, [formData]);

  // Auto-save functionality
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(timer);
    }
  }, [hasChanges, formData]);

  const handleBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm("Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?");
      if (!confirmed) return;
    }
    navigate("/proposals");
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // Clear validation errors for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: []
      }));
    }
  };

  const handleAutoSave = async () => {
    if (!hasChanges) return;
    
    setAutoSaving(true);
    try {
      // Auto-save logic here - save as draft
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated save
      setHasChanges(false);
      toast.success("Taslak otomatik kaydedildi", {
        duration: 2000,
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setAutoSaving(true);
    try {
      await handleAutoSave();
    } finally {
      setAutoSaving(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string[]> = {};
    
    // Basic validation
    if (!formData.title.trim()) {
      errors.title = ["Teklif başlığı gereklidir"];
    }
    if (!formData.customer_id) {
      errors.customer_id = ["Müşteri seçimi gereklidir"];
    }
    if (!formData.valid_until) {
      errors.valid_until = ["Geçerlilik tarihi gereklidir"];
    }
    
    // Address validation
    if (!formData.billing_address.company) {
      errors.billing_company = ["Fatura adresi firma adı gereklidir"];
    }
    if (!formData.billing_address.address) {
      errors.billing_address = ["Fatura adresi gereklidir"];
    }
    
    // Items validation
    if (formData.items.length === 0) {
      errors.items = ["En az bir teklif kalemi eklenmelidir"];
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAndSend = async () => {
    if (!validateForm()) {
      toast.error("Lütfen gerekli alanları doldurun");
      // Navigate to first tab with error
      const errorTabs = Object.keys(validationErrors);
      if (errorTabs.length > 0) {
        if (errorTabs.some(e => ['title', 'customer_id', 'valid_until'].includes(e))) {
          setActiveTab('basic');
        } else if (errorTabs.some(e => e.includes('billing'))) {
          setActiveTab('address');
        } else if (errorTabs.includes('items')) {
          setActiveTab('items');
        }
      }
      return;
    }

    try {
      setSaving(true);
      const result = await createProposal({
        ...formData,
        status: "sent"
      });
      if (result) {
        toast.success("Teklif başarıyla oluşturuldu ve gönderildi");
        setHasChanges(false);
        navigate("/proposals");
      }
    } catch (error) {
      toast.error("Teklif gönderilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleNextTab = () => {
    const tabs = ["basic", "address", "items", "summary", "notes"];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  const getTabIcon = (tabKey: string, completed: boolean) => {
    if (completed) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (validationErrors[tabKey]) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="World-Class Teklif Oluşturma"
      subtitle="Enterprise-grade B2B teklif sistemi"
    >
      {/* Enhanced Sticky Header with Progress */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center justify-between py-3 px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              Teklifler
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <h1 className="text-xl font-semibold">Enterprise Teklif Sistemi</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={completionProgress} className="w-24 h-2" />
                  <span className="text-xs text-muted-foreground">{Math.round(completionProgress)}% tamamlandı</span>
                </div>
              </div>
              <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-3 w-3" />
                Taslak
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ProposalStatusIndicator 
              hasChanges={hasChanges}
              autoSaving={autoSaving}
              validationErrors={validationErrors}
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPreviewOpen(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Önizleme
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveDraft} 
              disabled={autoSaving}
            >
              {autoSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Taslak Kaydet
            </Button>
            
            <Button 
              size="sm" 
              onClick={handleSaveAndSend} 
              disabled={saving || !hasChanges}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {saving ? "Kaydediliyor..." : "Kaydet ve Gönder"}
            </Button>
          </div>
        </div>
      </div>

      {/* Auto-Context Populator */}
      <ProposalContextPopulator
        customerId={customerId}
        opportunityId={opportunityId}
        templateId={templateId}
        onContextLoaded={(context) => {
          setFormData(prev => ({
            ...prev,
            ...context
          }));
        }}
      />

      {/* Main Content with Enhanced Tabs */}
      <div className="p-6">
        <Card className="shadow-sm border-0 bg-white/50">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b bg-muted/30 px-6 pt-4">
                <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto p-0 gap-1">
                  <TabsTrigger 
                    value="basic" 
                    className={cn(
                      "relative flex flex-col gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm",
                      tabsCompletion.basic.completed && "border-green-200 bg-green-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getTabIcon('basic', tabsCompletion.basic.completed)}
                      <span className="font-medium">Temel Bilgiler</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Başlık, müşteri, tarih</span>
                    {tabsCompletion.basic.required && !tabsCompletion.basic.completed && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-2 w-2 p-0" />
                    )}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="address" 
                    className={cn(
                      "relative flex flex-col gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm",
                      tabsCompletion.address.completed && "border-green-200 bg-green-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getTabIcon('address', tabsCompletion.address.completed)}
                      <span className="font-medium">Adres Bilgileri</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Fatura ve teslimat</span>
                    {tabsCompletion.address.required && !tabsCompletion.address.completed && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-2 w-2 p-0" />
                    )}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="items" 
                    className={cn(
                      "relative flex flex-col gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm",
                      tabsCompletion.items.completed && "border-green-200 bg-green-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getTabIcon('items', tabsCompletion.items.completed)}
                      <span className="font-medium">Teklif Kalemleri</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Ürün ve hizmetler</span>
                    {tabsCompletion.items.required && !tabsCompletion.items.completed && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-2 w-2 p-0" />
                    )}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="summary" 
                    className={cn(
                      "flex flex-col gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm",
                      tabsCompletion.summary.completed && "border-green-200 bg-green-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getTabIcon('summary', tabsCompletion.summary.completed)}
                      <span className="font-medium">Özet & Toplamlar</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Vergi, indirim, toplam</span>
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="notes" 
                    className={cn(
                      "flex flex-col gap-2 py-3 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm",
                      tabsCompletion.notes.completed && "border-green-200 bg-green-50/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {getTabIcon('notes', tabsCompletion.notes.completed)}
                      <span className="font-medium">Notlar & Şartlar</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Ödeme, teslimat, notlar</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="basic" className="mt-0">
                  <ProposalBasicInfoTab
                    formData={formData}
                    onFieldChange={handleFieldChange}
                    validationErrors={validationErrors}
                    onNext={handleNextTab}
                  />
                </TabsContent>

                <TabsContent value="address" className="mt-0">
                  <ProposalAddressTab
                    formData={formData}
                    onFieldChange={handleFieldChange}
                    validationErrors={validationErrors}
                    onNext={handleNextTab}
                  />
                </TabsContent>

                <TabsContent value="items" className="mt-0">
                  <ProposalLineItemsTab
                    formData={formData}
                    onFieldChange={handleFieldChange}
                    validationErrors={validationErrors}
                    onNext={handleNextTab}
                  />
                </TabsContent>

                <TabsContent value="summary" className="mt-0">
                  <ProposalSummaryTab
                    formData={formData}
                    onFieldChange={handleFieldChange}
                    validationErrors={validationErrors}
                    onNext={handleNextTab}
                  />
                </TabsContent>

                <TabsContent value="notes" className="mt-0">
                  <ProposalNotesTab
                    formData={formData}
                    onFieldChange={handleFieldChange}
                    validationErrors={validationErrors}
                    onSave={handleSaveAndSend}
              saving={saving}
            />
                </TabsContent>
          </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Preview Dialog */}
      <ProposalPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        formData={formData}
      />

      {/* Auto-save notification */}
      {autoSaving && (
        <div className="fixed bottom-4 right-4 z-50">
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 gap-2 py-2 px-4">
            <Loader2 className="h-3 w-3 animate-spin" />
            Otomatik kaydediliyor...
          </Badge>
        </div>
      )}

      {/* Validation summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="fixed bottom-4 left-4 z-50">
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {Object.keys(validationErrors).length} alan tamamlanmayı bekliyor
            </AlertDescription>
          </Alert>
        </div>
      )}
    </DefaultLayout>
  );
};

export default ProposalCreate;
