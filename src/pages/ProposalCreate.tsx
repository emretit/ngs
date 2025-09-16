
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
      <div className="sticky top-0 z-20 bg-gradient-to-r from-background via-background/98 to-background backdrop-blur-xl border-b border-border/30 shadow-sm">
        <div className="flex items-center justify-between py-4 px-6">
          <div className="flex items-center gap-6">
            {/* Stylish Back Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="group gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 transition-all duration-300 hover:shadow-sm border border-transparent hover:border-border/50" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              <span className="font-medium">Teklifler</span>
            </Button>
            
            {/* Elegant Separator */}
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
            
            {/* Enhanced Title Section */}
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Yeni Teklif Oluştur
                </h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Progress value={completionProgress} className="w-32 h-2" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {Math.round(completionProgress)}%
                    </span>
                  </div>
                  <Badge variant="outline" className="gap-1.5 bg-gradient-to-r from-amber-50 to-amber-50/50 text-amber-700 border-amber-200/60 px-2.5 py-1">
                    <Clock className="h-3 w-3" />
                    Taslak
                  </Badge>
                </div>
              </div>
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
              className="gap-2 rounded-lg hover:bg-gradient-to-r hover:from-muted/60 hover:to-muted/40 transition-all duration-200 border-border/60 hover:border-border"
            >
              <Eye className="h-4 w-4" />
              Önizleme
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveDraft} 
              disabled={autoSaving}
              className="gap-2 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200"
            >
              {autoSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Taslak Kaydet
            </Button>
            
            <Button 
              size="sm" 
              onClick={handleSaveAndSend} 
              disabled={saving || !hasChanges}
              className="gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm hover:shadow-md transition-all duration-200"
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
        <Card className="shadow-lg border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-border/30 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 px-6 pt-6">
                <TabsList className="grid w-full grid-cols-5 bg-background/60 backdrop-blur-sm h-auto p-1 gap-1 rounded-xl shadow-sm border border-border/50">
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
