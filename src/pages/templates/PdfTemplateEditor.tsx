import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { PDFViewer } from '@react-pdf/renderer';
import { Download, Save, Eye, EyeOff, Plus, ArrowLeft } from 'lucide-react';
import { TemplateSchema, PdfTemplate, QuoteData } from '@/types/pdf-template';
import PdfRenderer from '@/components/pdf/PdfRenderer';
import { PdfExportService } from '@/services/pdf/pdfExportService';
import { LogoUploadField } from '@/components/templates/LogoUploadField';
import { toast } from 'sonner';

interface PdfTemplateEditorProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (value: boolean) => void;
}

const PdfTemplateEditor: React.FC<PdfTemplateEditorProps> = ({ 
  isCollapsed = false, 
  setIsCollapsed = () => {} 
}) => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplate | null>(null);
  const [previewData, setPreviewData] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const form = useForm<TemplateSchema>({
    resolver: zodResolver(z.object({
      page: z.object({
        size: z.enum(['A4', 'A3', 'Letter']),
        padding: z.object({
          top: z.number().min(10).max(100),
          right: z.number().min(10).max(100),
          bottom: z.number().min(10).max(100),
          left: z.number().min(10).max(100),
        }),
        fontSize: z.number().min(8).max(20),
      }),
      header: z.object({
        title: z.string().min(1),
        titleFontSize: z.number().min(8).max(32),
        showLogo: z.boolean(),
        logoUrl: z.string().optional(),
        logoPosition: z.enum(['left', 'center', 'right']),
        logoSize: z.number().min(20).max(200),
        showValidity: z.boolean(),
        showCompanyInfo: z.boolean(),
        companyName: z.string(),
        companyAddress: z.string(),
        companyPhone: z.string(),
        companyEmail: z.string(),
        companyWebsite: z.string(),
        companyTaxNumber: z.string().optional(),
        companyInfoFontSize: z.number().min(8).max(32),
      }),

      lineTable: z.object({
        columns: z.array(z.object({
          key: z.string(),
          show: z.boolean(),
          label: z.string(),
          align: z.enum(['left', 'center', 'right']),
        })),
        showRowNumber: z.boolean().optional(),
      }),
      totals: z.object({
        showGross: z.boolean(),
        showDiscount: z.boolean(),
        showTax: z.boolean(),
        showNet: z.boolean(),
      }),
      notes: z.object({
        footer: z.string(),
        footerFontSize: z.number().min(8).max(32),
        termsSettings: z.object({
          showPaymentTerms: z.boolean(),
          showDeliveryTerms: z.boolean(),
          showWarrantyTerms: z.boolean(),
          showPriceTerms: z.boolean(),
          showOtherTerms: z.boolean(),
          titleAlign: z.enum(['left', 'center', 'right']).optional(),
        }).optional(),
      }),
    })),
    defaultValues: {
      page: {
        size: 'A4',
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        fontSize: 12,
      },
      header: {
        title: 'TEKLİF',
        titleFontSize: 16,
        showLogo: true,
        logoUrl: undefined,
        logoPosition: 'left',
        logoSize: 80,
        showValidity: true,
        showCompanyInfo: true,
        companyName: 'NGS TEKNOLOJİ',
        companyAddress: 'İstanbul, Türkiye',
        companyPhone: '+90 212 555 0123',
        companyEmail: 'info@ngsteknoloji.com',
        companyWebsite: 'www.ngsteknoloji.com',
        companyTaxNumber: '',
        companyInfoFontSize: 10,
      },

      lineTable: {
        columns: [
          { key: 'description', show: true, label: 'Açıklama' },
          { key: 'quantity', show: true, label: 'Miktar' },
          { key: 'unit_price', show: true, label: 'Birim Fiyat' },
          { key: 'discount', show: true, label: 'İndirim' },
          { key: 'total', show: true, label: 'Toplam' },
        ],
        showRowNumber: true,
      },
      totals: {
        showGross: true,
        showDiscount: true,
        showTax: true,
        showNet: true,
      },
      notes: {
        footer: 'İyi çalışmalar dileriz.',
        footerFontSize: 12,
        termsSettings: {
          showPaymentTerms: true,
          showDeliveryTerms: true,
          showWarrantyTerms: true,
          showPriceTerms: false,
          showOtherTerms: false,
          titleAlign: 'left',
        },
      },
    },
  });

  useEffect(() => {
    loadTemplates();
    loadSampleData();
  }, []);

  // Load company info from companies table - optimized to only load when needed
  const loadCompanyInfo = async (showToast = false) => {
    try {
      const companySettings = await PdfExportService.getCompanySettings();
      
      if (companySettings && Object.keys(companySettings).length > 0) {
        // Always update company info fields
        form.setValue('header.companyName', companySettings.company_name || '');
        form.setValue('header.companyAddress', companySettings.company_address || '');
        form.setValue('header.companyPhone', companySettings.company_phone || '');
        form.setValue('header.companyEmail', companySettings.company_email || '');
        form.setValue('header.companyWebsite', companySettings.company_website || '');
        form.setValue('header.companyTaxNumber', companySettings.company_tax_number || '');
        
        // Set logo URL if available
        if (companySettings.company_logo_url) {
          form.setValue('header.logoUrl', companySettings.company_logo_url);
        }
        
        if (showToast) {
          toast.success('Şirket bilgileri yüklendi');
        }
      } else {
        if (showToast) {
          toast.warning('Şirket bilgileri bulunamadı');
        }
      }
    } catch (error) {
      console.error('Error loading company info:', error);
      if (showToast) {
        toast.error('Şirket bilgileri yüklenirken hata oluştu');
      }
    }
  };

  useEffect(() => {
    if (templateId === 'new') {
      setIsNewTemplate(true);
      setSelectedTemplate(null);
      setTemplateName('Yeni Şablon');
      // Form'u varsayılan değerlerle doldur
      form.reset();
      // Load company info for new template after a short delay to ensure form is reset (silent load)
      setTimeout(() => {
        loadCompanyInfo(false);
      }, 100);
    } else if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
        setIsNewTemplate(false);
        setTemplateName(template.name);
        
        // Ensure all required fields exist with defaults (including migration for proposalBlock)
        const schemaWithDefaults = {
          ...template.schema_json,
          header: {
            ...template.schema_json.header,
            logoPosition: template.schema_json.header.logoPosition || 'left',
            logoSize: template.schema_json.header.logoSize || 80,
            titleFontSize: template.schema_json.header.titleFontSize || 16,
            showCompanyInfo: template.schema_json.header.showCompanyInfo ?? true,
            companyName: template.schema_json.header.companyName || 'NGS TEKNOLOJİ',
            companyAddress: template.schema_json.header.companyAddress || 'İstanbul, Türkiye',
            companyPhone: template.schema_json.header.companyPhone || '+90 212 555 0123',
            companyEmail: template.schema_json.header.companyEmail || 'info@ngsteknoloji.com',
            companyWebsite: template.schema_json.header.companyWebsite || 'www.ngsteknoloji.com',
            companyTaxNumber: template.schema_json.header.companyTaxNumber || '',
            companyInfoFontSize: template.schema_json.header.companyInfoFontSize || 10,
          },
          
          // Migration: Add discount column if it doesn't exist
          lineTable: {
            ...template.schema_json.lineTable,
            showRowNumber: template.schema_json.lineTable?.showRowNumber ?? true,
            columns: (() => {
              const existingColumns = template.schema_json.lineTable?.columns || [];
              const hasDiscountColumn = existingColumns.some(col => col.key === 'discount');
              
              if (!hasDiscountColumn) {
                // Insert discount column before total column
                const newColumns = [...existingColumns];
                const totalIndex = newColumns.findIndex(col => col.key === 'total');
                if (totalIndex !== -1) {
                  newColumns.splice(totalIndex, 0, {
                    key: 'discount',
                    show: true,
                    label: 'İndirim'
                  });
                } else {
                  // If no total column, add at the end
                  newColumns.push({
                    key: 'discount',
                    show: true,
                    label: 'İndirim'
                  });
                }
                return newColumns;
              }
              return existingColumns;
            })()
          },

          notes: {
            ...template.schema_json.notes,
            footerFontSize: template.schema_json.notes.footerFontSize || 12,
            termsSettings: template.schema_json.notes.termsSettings || {
              showPaymentTerms: true,
              showDeliveryTerms: true,
              showWarrantyTerms: true,
              showPriceTerms: false,
              showOtherTerms: false,
              titleAlign: 'left',
            },
          }
        };
        
        form.reset(schemaWithDefaults);
      } else {
        toast.error('Şablon bulunamadı');
        navigate('/settings');
      }
    }
  }, [templateId, templates, form, navigate]);

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const templates = await PdfExportService.getTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Şablonlar yüklenirken hata oluştu');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadSampleData = async () => {
    try {
      const companySettings = await PdfExportService.getCompanySettings();
      const sampleData: QuoteData = {
        number: 'TEK-2024-001',
        title: 'Örnek Teklif',
        date: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer: {
          name: 'Örnek Müşteri',
          company: 'Örnek Şirket A.Ş.',
          email: 'info@ornek.com',
          mobile_phone: '+90 212 555 0123',
          address: 'İstanbul, Türkiye',
        },
        items: [
          {
            id: '1',
            description: 'Ürün/Hizmet 1',
            quantity: 2,
            unit: 'adet',
            unit_price: 100.00,
            discount_rate: 10,
            total: 180.00,
          },
          {
            id: '2',
            description: 'Ürün/Hizmet 2',
            quantity: 1,
            unit: 'paket',
            unit_price: 150.00,
            discount_rate: 0,
            total: 150.00,
          },
        ],
        subtotal: 350.00,
        total_discount: 35.00,
        total_tax: 63.00,
        total_amount: 378.00,
        currency: 'TRY',
        notes: 'Bu bir örnek tekliftir.',
        payment_terms: '30 gün vadeli',
        delivery_terms: '1 hafta içinde',
        warranty_terms: '1 yıl garanti',
        id: 'sample-1',
        created_at: new Date().toISOString(),
      };
      setPreviewData(sampleData);
    } catch (error) {
      console.error('Error loading sample data:', error);
    }
  };

  const handleSave = async (data: TemplateSchema) => {
    setIsLoading(true);
    try {
      // Get current form values to ensure logo URL is included
      const currentFormData = form.getValues();
      const currentLogoUrl = currentFormData.header?.logoUrl;
      
      // Merge current form data with submitted data to ensure logo URL is preserved
      const mergedData = {
        ...data,
        header: {
          ...data.header,
          logoUrl: currentLogoUrl || data.header?.logoUrl
        }
      };

      if (isNewTemplate) {
        // Create new template
        const newTemplate: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'> = {
          name: templateName || 'Yeni Şablon',
          type: 'quote',
          locale: 'tr',
          schema_json: mergedData,
          version: 1,
          is_default: false,
          created_by: null, // Will be set by Supabase
        };
        
        const savedTemplate = await PdfExportService.saveTemplate(newTemplate);
        toast.success('Şablon başarıyla oluşturuldu');
        
        // Navigate to edit mode
        navigate(`/pdf-templates/edit/${savedTemplate.id}`);
      } else if (selectedTemplate) {
        // Update existing template
        const updatedTemplate: Omit<PdfTemplate, 'id' | 'created_at' | 'updated_at'> = {
          name: templateName || selectedTemplate.name,
          type: selectedTemplate.type,
          locale: selectedTemplate.locale,
          schema_json: mergedData,
          version: selectedTemplate.version + 1,
          is_default: selectedTemplate.is_default,
          created_by: selectedTemplate.created_by,
        };
        
        // Pass the template ID for update
        await PdfExportService.saveTemplate(updatedTemplate, selectedTemplate.id);
        toast.success('Şablon başarıyla kaydedildi');
        
        // Update the selected template with the new schema to prevent reload issues
        setSelectedTemplate(prev => prev ? { 
          ...prev, 
          name: templateName || prev.name,
          schema_json: mergedData, 
          version: prev.version + 1 
        } : null);
        
        // Reload templates to refresh the list, but don't reset the form
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Şablon kaydedilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!previewData || !selectedTemplate) return;
    
    setIsLoading(true);
    try {
      await PdfExportService.downloadPdf(previewData, { templateId: selectedTemplate.id });
      toast.success('PDF başarıyla indirildi');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('PDF indirilirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const watchedValues = form.watch();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isNewTemplate ? 'Yeni PDF Şablonu' : 'PDF Şablon Editörü'}
              </h1>
              <p className="text-muted-foreground">
                {isNewTemplate ? 'Yeni bir PDF şablonu oluşturun' : `${selectedTemplate?.name || 'Şablon'} düzenleniyor`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Settings Panel */}
          <ResizablePanel defaultSize={35} minSize={30}>
            <div className="h-full overflow-y-auto bg-gradient-to-b from-background via-background/98 to-muted/20 border-r border-border/20">
              <div className="p-3 space-y-3">
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-3 border border-blue-200/50 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                      <span className="text-lg">⚙️</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">Şablon Ayarları</h3>
                      <p className="text-xs text-gray-600">PDF şablonunuzu özelleştirin</p>
                    </div>
                  </div>
                </div>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-3">
                {/* Template Name */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-lg p-3 border border-emerald-200/50 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 rounded-md shadow-sm">
                      <span className="text-sm">✏️</span>
                    </div>
                    <Label htmlFor="template-name" className="text-sm font-semibold text-gray-800">Şablon Adı</Label>
                  </div>
                  <Input
                    id="template-name"
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Şablon adını girin"
                    className="h-8 text-sm border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Header Settings */}
                <Accordion type="single" collapsible defaultValue="header">
                  <AccordionItem value="header" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-3 py-2 rounded-t-lg border-b border-gray-200 font-semibold text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-md">
                          <span className="text-xs font-bold text-blue-700">📄</span>
                        </div>
                        <span>Başlık Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2 px-3 pb-3">
                      {/* Title and Logo Settings - Side by Side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                        {/* Title Settings */}
                        <div className="space-y-1.5">
                          {/* Title Section Header */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 flex items-center justify-center bg-blue-100 rounded">
                              <span className="text-xs font-bold text-blue-700">T</span>
                            </div>
                            <Label className="text-xs font-semibold text-gray-800">Başlık</Label>
                          </div>

                          {/* Title Controls */}
                          <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-1.5">
                            {/* Title Text Input */}
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Başlık Metni</Label>
                              <Input 
                                {...form.register('header.title')} 
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                placeholder="Başlık metnini girin"
                              />
                            </div>

                            {/* Font Size - Simplified */}
                            <div className="pt-1 border-t border-gray-200">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-gray-600 min-w-fit">Font</Label>
                                <Input
                                  type="number"
                                  {...form.register('header.titleFontSize', { valueAsNumber: true })}
                                  min="8"
                                  max="32"
                                  placeholder="16"
                                  className="h-7 w-14 text-center text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Logo Settings */}
                        <div className="space-y-1.5">
                          <LogoUploadField
                            logoUrl={watchedValues.header?.logoUrl}
                            onLogoChange={(url) => form.setValue('header.logoUrl', url || undefined)}
                            logoPosition={watchedValues.header?.logoPosition || 'left'}
                            onPositionChange={(value) => form.setValue('header.logoPosition', value)}
                            logoSize={watchedValues.header?.logoSize || 80}
                            onSizeChange={(value) => form.setValue('header.logoSize', value)}
                            showLogo={watchedValues.header?.showLogo}
                            onShowLogoChange={(value) => form.setValue('header.showLogo', value)}
                          />
                        </div>
                      </div>
                      
                      {/* Company Info Settings */}
                      <div className="space-y-2">
                        {/* Company Section Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded-md">
                              <span className="text-xs font-bold text-gray-700">🏢</span>
                            </div>
                            <Label className="text-xs font-semibold text-gray-800">Şirket Bilgileri</Label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id="show-company-info"
                              checked={watchedValues.header?.showCompanyInfo}
                              onCheckedChange={(checked) => form.setValue('header.showCompanyInfo', checked)}
                              className="scale-75"
                            />
                            <Label htmlFor="show-company-info" className="text-xs text-gray-600">Göster</Label>
                          </div>
                        </div>

                        {/* Company Controls - Only show when enabled */}
                        {watchedValues.header?.showCompanyInfo && (
                          <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-1.5">
                            {/* Info Message - More compact */}
                            <div className="p-1 bg-blue-50/80 border border-blue-200/50 rounded text-xs text-blue-700 flex items-center gap-1">
                              <span className="text-xs">💡</span>
                              <span>Sistem Ayarları'ndan otomatik yüklenir</span>
                            </div>
                            
                            {/* Company Name & Font Size */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Şirket Adı</Label>
                                <Input 
                                  {...form.register('header.companyName')} 
                                  placeholder="Şirket adı" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Font</Label>
                                <Input
                                  type="number"
                                  {...form.register('header.companyInfoFontSize', { valueAsNumber: true })}
                                  min="8"
                                  max="32"
                                  placeholder="10"
                                  className="h-7 w-14 text-center text-xs"
                                />
                              </div>
                            </div>
                            
                            {/* Company Address */}
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Adres</Label>
                              <Input 
                                {...form.register('header.companyAddress')} 
                                placeholder="Şirket adresi" 
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                              />
                            </div>
                            
                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Telefon</Label>
                                <Input 
                                  {...form.register('header.companyPhone')} 
                                  placeholder="Telefon" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">E-posta</Label>
                                <Input 
                                  {...form.register('header.companyEmail')} 
                                  placeholder="E-posta" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                            </div>
                            
                            {/* Website & Tax Number */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Website</Label>
                                <Input 
                                  {...form.register('header.companyWebsite')} 
                                  placeholder="Website" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-0.5 block">Vergi No</Label>
                                <Input 
                                  {...form.register('header.companyTaxNumber')} 
                                  placeholder="Vergi no" 
                                  className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Customer and Proposal Block Settings */}
                <Accordion type="single" collapsible defaultValue="customer">
                  <AccordionItem value="customer" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 px-3 py-2 rounded-t-lg border-b border-gray-200 font-semibold text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center bg-green-100 rounded-md">
                          <span className="text-xs font-bold text-green-700">👥</span>
                        </div>
                        <span>Müşteri ve Teklif Bilgileri</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-2">
                      <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md">
                        <div className="font-medium text-blue-800 mb-1">Müşteri ve Teklif Bilgileri</div>
                        <div className="space-y-0.5 text-blue-700 text-xs">
                          <div>• Müşteri bilgileri otomatik gösterilir</div>
                          <div>• Teklif bilgileri otomatik gösterilir</div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Line Table Settings */}
                <Accordion type="single" collapsible defaultValue="table">
                  <AccordionItem value="table" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 px-3 py-2 rounded-t-lg border-b border-gray-200 font-semibold text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center bg-purple-100 rounded-md">
                          <span className="text-xs font-bold text-purple-700">📊</span>
                        </div>
                        <span>Tablo Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-2 space-y-2">
                      {/* Sıra Numarası Toggle */}
                      <div className="border rounded-md p-2 bg-indigo-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 flex items-center justify-center bg-indigo-100 rounded-full">
                              <span className="text-xs font-bold text-indigo-700">#</span>
                            </div>
                            <Label className="text-xs font-medium text-gray-700">Sıra Numarası</Label>
                          </div>
                          <Switch
                            id="show-row-number"
                            checked={watchedValues.lineTable?.showRowNumber ?? true}
                            onCheckedChange={(checked) => form.setValue('lineTable.showRowNumber', checked)}
                            className="scale-75"
                          />
                        </div>
                      </div>

                      {/* Kolonlar */}
                      <div className="grid grid-cols-2 gap-2">
                        {watchedValues.lineTable?.columns?.map((column, index) => (
                          <div key={column.key} className="border rounded-md p-2 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 flex items-center justify-center bg-purple-100 rounded-full">
                                  <span className="text-xs font-bold text-purple-700">
                                    {index + 1}
                                  </span>
                                </div>
                                <Label className="text-xs font-medium text-gray-700">{column.label}</Label>
                              </div>
                              
                              <Switch
                                id={`show-${column.key}`}
                                checked={column.show}
                                onCheckedChange={(checked) => {
                                  const newColumns = [...(watchedValues.lineTable?.columns || [])];
                                  newColumns[index].show = checked;
                                  form.setValue('lineTable.columns', newColumns);
                                }}
                                className="scale-75"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Totals Settings */}
                <Accordion type="single" collapsible defaultValue="totals">
                  <AccordionItem value="totals" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 px-3 py-2 rounded-t-lg border-b border-gray-200 font-semibold text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center bg-orange-100 rounded-md">
                          <span className="text-xs font-bold text-orange-700">💰</span>
                        </div>
                        <span>Toplam Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Ara Toplam */}
                        <div className="border rounded-md p-2 bg-orange-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 flex items-center justify-center bg-orange-100 rounded-full">
                                <span className="text-xs font-bold text-orange-700">1</span>
                              </div>
                              <Label className="text-xs font-medium text-gray-700">Ara Toplam</Label>
                            </div>
                            <Switch
                              id="show-gross"
                              checked={watchedValues.totals?.showGross}
                              onCheckedChange={(checked) => form.setValue('totals.showGross', checked)}
                              className="scale-75"
                            />
                          </div>
                        </div>

                        {/* İndirim */}
                        <div className="border rounded-md p-2 bg-red-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 flex items-center justify-center bg-red-100 rounded-full">
                                <span className="text-xs font-bold text-red-700">2</span>
                              </div>
                              <Label className="text-xs font-medium text-gray-700">İndirim</Label>
                            </div>
                            <Switch
                              id="show-discount"
                              checked={watchedValues.totals?.showDiscount}
                              onCheckedChange={(checked) => form.setValue('totals.showDiscount', checked)}
                              className="scale-75"
                            />
                          </div>
                        </div>

                        {/* KDV */}
                        <div className="border rounded-md p-2 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                <span className="text-xs font-bold text-blue-700">3</span>
                              </div>
                              <Label className="text-xs font-medium text-gray-700">KDV</Label>
                            </div>
                            <Switch
                              id="show-tax"
                              checked={watchedValues.totals?.showTax}
                              onCheckedChange={(checked) => form.setValue('totals.showTax', checked)}
                              className="scale-75"
                            />
                          </div>
                        </div>

                        {/* Genel Toplam */}
                        <div className="border rounded-md p-2 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 flex items-center justify-center bg-green-100 rounded-full">
                                <span className="text-xs font-bold text-green-700">4</span>
                              </div>
                              <Label className="text-xs font-medium text-gray-700">Genel Toplam</Label>
                            </div>
                            <Switch
                              id="show-net"
                              checked={watchedValues.totals?.showNet}
                              onCheckedChange={(checked) => form.setValue('totals.showNet', checked)}
                              className="scale-75"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Notes Settings */}
                <Accordion type="single" collapsible defaultValue="notes">
                  <AccordionItem value="notes" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 px-3 py-2 rounded-t-lg border-b border-gray-200 font-semibold text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 flex items-center justify-center bg-pink-100 rounded-md">
                          <span className="text-xs font-bold text-pink-700">📝</span>
                        </div>
                        <span>Not Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-3 pt-2 space-y-2">
                      {/* Şartlar ve Koşullar Ayarları */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold text-gray-800">Şartlar ve Koşullar</Label>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-600">Başlık Hizalama:</Label>
                            <Select
                              value={watchedValues.notes?.termsSettings?.titleAlign || 'left'}
                              onValueChange={(value) => form.setValue('notes.termsSettings.titleAlign', value as 'left' | 'center' | 'right')}
                            >
                              <SelectTrigger className="h-7 w-24 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Sol</SelectItem>
                                <SelectItem value="center">Orta</SelectItem>
                                <SelectItem value="right">Sağ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {/* Ödeme Şartları */}
                            <div className="border rounded-md p-2 bg-blue-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                    <span className="text-xs font-bold text-blue-700">1</span>
                                  </div>
                                  <Label className="text-xs font-medium text-gray-700">Ödeme Şartları</Label>
                                </div>
                                <Switch
                                  id="show-payment-terms"
                                  checked={watchedValues.notes?.termsSettings?.showPaymentTerms ?? true}
                                  onCheckedChange={(checked) => form.setValue('notes.termsSettings.showPaymentTerms', checked)}
                                  className="scale-75"
                                />
                              </div>
                            </div>

                            {/* Teslimat Şartları */}
                            <div className="border rounded-md p-2 bg-green-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 flex items-center justify-center bg-green-100 rounded-full">
                                    <span className="text-xs font-bold text-green-700">2</span>
                                  </div>
                                  <Label className="text-xs font-medium text-gray-700">Teslimat Şartları</Label>
                                </div>
                                <Switch
                                  id="show-delivery-terms"
                                  checked={watchedValues.notes?.termsSettings?.showDeliveryTerms ?? true}
                                  onCheckedChange={(checked) => form.setValue('notes.termsSettings.showDeliveryTerms', checked)}
                                  className="scale-75"
                                />
                              </div>
                            </div>

                            {/* Garanti Şartları */}
                            <div className="border rounded-md p-2 bg-purple-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 flex items-center justify-center bg-purple-100 rounded-full">
                                    <span className="text-xs font-bold text-purple-700">3</span>
                                  </div>
                                  <Label className="text-xs font-medium text-gray-700">Garanti Şartları</Label>
                                </div>
                                <Switch
                                  id="show-warranty-terms"
                                  checked={watchedValues.notes?.termsSettings?.showWarrantyTerms ?? true}
                                  onCheckedChange={(checked) => form.setValue('notes.termsSettings.showWarrantyTerms', checked)}
                                  className="scale-75"
                                />
                              </div>
                            </div>

                            {/* Fiyat Şartları */}
                            <div className="border rounded-md p-2 bg-orange-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 flex items-center justify-center bg-orange-100 rounded-full">
                                    <span className="text-xs font-bold text-orange-700">4</span>
                                  </div>
                                  <Label className="text-xs font-medium text-gray-700">Fiyat Şartları</Label>
                                </div>
                                <Switch
                                  id="show-price-terms"
                                  checked={watchedValues.notes?.termsSettings?.showPriceTerms ?? false}
                                  onCheckedChange={(checked) => form.setValue('notes.termsSettings.showPriceTerms', checked)}
                                  className="scale-75"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Diğer Şartlar */}
                          <div className="border rounded-md p-2 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded-full">
                                  <span className="text-xs font-bold text-gray-700">5</span>
                                </div>
                                <Label className="text-xs font-medium text-gray-700">Diğer Şartlar</Label>
                              </div>
                              <Switch
                                id="show-other-terms"
                                checked={watchedValues.notes?.termsSettings?.showOtherTerms ?? false}
                                onCheckedChange={(checked) => form.setValue('notes.termsSettings.showOtherTerms', checked)}
                                className="scale-75"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 pt-2 border-t border-gray-200">
                        <Label className="text-xs">Alt Bilgi</Label>
                        <Textarea {...form.register('notes.footer')} rows={2} className="text-xs" />
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Font:</Label>
                          <Input
                            type="number"
                            {...form.register('notes.footerFontSize', { valueAsNumber: true })}
                            min="8"
                            max="32"
                            placeholder="12"
                            className="h-7 w-14 text-center text-xs"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <Button type="submit" disabled={isLoading} size="sm" className="h-8 text-xs">
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/settings')}
                    disabled={isLoading}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                    Çık
                  </Button>
                </div>
                </form>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* PDF Preview */}
          <ResizablePanel defaultSize={65} minSize={50}>
            <div className="h-full p-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    PDF Önizleme
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full p-0">
                  {previewData && watchedValues ? (
                    <div className="h-full">
                      <PDFViewer className="w-full h-full">
                        <PdfRenderer data={previewData} schema={watchedValues} />
                      </PDFViewer>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      PDF önizlemesi yükleniyor...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default PdfTemplateEditor;