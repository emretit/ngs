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
import { TemplateSchema, PdfTemplate, QuoteData, CustomTextField } from '@/types/pdf-template';
import PdfRenderer from '@/components/pdf/PdfRenderer';
import { PdfExportService } from '@/services/pdf/pdfExportService';
import { LogoUploadField } from '@/components/templates/LogoUploadField';
import { CustomTextFields } from '@/components/templates/CustomTextFields';
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
      }),
      totals: z.object({
        showGross: z.boolean(),
        showDiscount: z.boolean(),
        showTax: z.boolean(),
        showNet: z.boolean(),
      }),
      notes: z.object({
        intro: z.string(),
        introFontSize: z.number().min(8).max(32),
        footer: z.string(),
        footerFontSize: z.number().min(8).max(32),
        customFields: z.array(z.object({
          id: z.string(),
          label: z.string(),
          text: z.string(),
          position: z.enum(['header', 'footer', 'before-table', 'after-table']),
          style: z.object({
            fontSize: z.number().optional(),
            align: z.enum(['left', 'center', 'right']).optional(),
            bold: z.boolean().optional(),
            color: z.string().optional(),
          }).optional(),
        })).optional(),
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
      },
      totals: {
        showGross: true,
        showDiscount: true,
        showTax: true,
        showNet: true,
      },
      notes: {
        intro: 'Bu teklif 30 gün geçerlidir.',
        introFontSize: 12,
        footer: 'İyi çalışmalar dileriz.',
        footerFontSize: 12,
        customFields: [],
      },
    },
  });

  useEffect(() => {
    loadTemplates();
    loadSampleData();
  }, []);

  useEffect(() => {
    if (templateId === 'new') {
      setIsNewTemplate(true);
      setSelectedTemplate(null);
      setTemplateName('Yeni Şablon');
      // Form'u varsayılan değerlerle doldur
      form.reset();
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
            introFontSize: template.schema_json.notes.introFontSize || 12,
            footerFontSize: template.schema_json.notes.footerFontSize || 12,
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
              <div className="p-6 space-y-8">
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-200/50 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                      <span className="text-2xl">⚙️</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-1">Şablon Ayarları</h3>
                      <p className="text-sm text-gray-600">PDF şablonunuzu özelleştirin ve önizlemesini gerçek zamanlı olarak görün</p>
                    </div>
                  </div>
                </div>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                {/* Template Name */}
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl p-5 border border-emerald-200/50 shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-sm">
                      <span className="text-lg">✏️</span>
                    </div>
                    <Label htmlFor="template-name" className="text-lg font-semibold text-gray-800">Şablon Adı</Label>
                  </div>
                  <Input
                    id="template-name"
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Şablon adını girin"
                    className="h-10 text-base border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Header Settings */}
                <Accordion type="single" collapsible defaultValue="header">
                  <AccordionItem value="header" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-4 py-3 rounded-t-lg border-b border-gray-200 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-md">
                          <span className="text-sm font-bold text-blue-700">📄</span>
                        </div>
                        <span>Başlık Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-2">
                      {/* Title and Logo Settings - Side by Side */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Title Settings */}
                        <div className="space-y-3">
                          {/* Title Section Header */}
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 flex items-center justify-center bg-blue-100 rounded">
                              <span className="text-xs font-bold text-blue-700">T</span>
                            </div>
                            <Label className="text-sm font-semibold text-gray-800">Başlık</Label>
                          </div>

                          {/* Title Controls */}
                          <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-3 space-y-3">
                            {/* Title Text Input */}
                            <div>
                              <Label className="text-xs text-gray-600 mb-1 block">Başlık Metni</Label>
                              <Input 
                                {...form.register('header.title')} 
                                className="h-8 text-sm placeholder:text-gray-400 placeholder:italic" 
                                placeholder="Başlık metnini girin"
                              />
                            </div>

                            {/* Font Size - Simplified */}
                            <div className="pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-gray-600 min-w-fit">Font Boyutu</Label>
                                <Input
                                  type="number"
                                  {...form.register('header.titleFontSize', { valueAsNumber: true })}
                                  min="8"
                                  max="32"
                                  placeholder="16"
                                  className="h-8 w-16 text-center text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Logo Settings */}
                        <div className="space-y-3">
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
                      <div className="space-y-3">
                        {/* Company Section Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md">
                              <span className="text-sm font-bold text-gray-700">🏢</span>
                            </div>
                            <Label className="text-base font-semibold text-gray-800">Şirket Bilgileri</Label>
                          </div>
                          <div className="flex items-center gap-2">
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
                          <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-3 space-y-3">
                            {/* Company Name & Font Size */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Şirket Adı</Label>
                                <Input 
                                  {...form.register('header.companyName')} 
                                  placeholder="Şirket adını girin" 
                                  className="h-8 text-sm placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Font Boyutu</Label>
                                <Input
                                  type="number"
                                  {...form.register('header.companyInfoFontSize', { valueAsNumber: true })}
                                  min="8"
                                  max="32"
                                  placeholder="10"
                                  className="h-8 w-16 text-center text-xs"
                                />
                              </div>
                            </div>
                            
                            {/* Company Address */}
                            <div>
                              <Label className="text-xs text-gray-600 mb-1 block">Şirket Adresi</Label>
                              <Input 
                                {...form.register('header.companyAddress')} 
                                placeholder="Şirket adresini girin" 
                                className="h-8 text-sm placeholder:text-gray-400 placeholder:italic" 
                              />
                            </div>
                            
                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Telefon</Label>
                                <Input 
                                  {...form.register('header.companyPhone')} 
                                  placeholder="Telefon numarasını girin" 
                                  className="h-8 text-sm placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">E-posta</Label>
                                <Input 
                                  {...form.register('header.companyEmail')} 
                                  placeholder="E-posta adresini girin" 
                                  className="h-8 text-sm placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                            </div>
                            
                            {/* Website & Tax Number */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Website</Label>
                                <Input 
                                  {...form.register('header.companyWebsite')} 
                                  placeholder="Website adresini girin" 
                                  className="h-8 text-sm placeholder:text-gray-400 placeholder:italic" 
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600 mb-1 block">Vergi No</Label>
                                <Input 
                                  {...form.register('header.companyTaxNumber')} 
                                  placeholder="Vergi numarasını girin" 
                                  className="h-8 text-sm placeholder:text-gray-400 placeholder:italic" 
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
                    <AccordionTrigger className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 px-4 py-3 rounded-t-lg border-b border-gray-200 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-green-100 rounded-md">
                          <span className="text-sm font-bold text-green-700">👥</span>
                        </div>
                        <span>Müşteri ve Teklif Bilgileri</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6">
                      {/* Customer and Proposal Information - Always Visible */}
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                          <div className="font-medium text-blue-800 mb-2">Müşteri ve Teklif Bilgileri</div>
                          <div className="space-y-1 text-blue-700">
                            <div>• Müşteri bilgileri otomatik olarak gösterilir</div>
                            <div>• Teklif bilgileri (numara, tarih, geçerlilik, hazırlayan) otomatik olarak gösterilir</div>
                          </div>
                          <div className="text-xs text-blue-600 mt-2">
                            Bu alanlar artık her zaman görünür ve düzenlenemez.
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Line Table Settings */}
                <Accordion type="single" collapsible defaultValue="table">
                  <AccordionItem value="table" className="border border-gray-200 rounded-lg">
                    <AccordionTrigger className="bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 px-4 py-3 rounded-t-lg border-b border-gray-200 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-purple-100 rounded-md">
                          <span className="text-sm font-bold text-purple-700">📊</span>
                        </div>
                        <span>Tablo Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {watchedValues.lineTable?.columns?.map((column, index) => (
                          <div key={column.key} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 flex items-center justify-center bg-purple-100 rounded-full">
                                  <span className="text-xs font-bold text-purple-700">
                                    {index + 1}
                                  </span>
                                </div>
                                <Label className="text-sm font-medium text-gray-700">{column.label}</Label>
                              </div>
                              
                              <Switch
                                id={`show-${column.key}`}
                                checked={column.show}
                                onCheckedChange={(checked) => {
                                  const newColumns = [...(watchedValues.lineTable?.columns || [])];
                                  newColumns[index].show = checked;
                                  form.setValue('lineTable.columns', newColumns);
                                }}
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
                    <AccordionTrigger className="bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 px-4 py-3 rounded-t-lg border-b border-gray-200 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded-md">
                          <span className="text-sm font-bold text-orange-700">💰</span>
                        </div>
                        <span>Toplam Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Ara Toplam */}
                        <div className="border rounded-lg p-3 bg-orange-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 flex items-center justify-center bg-orange-100 rounded-full">
                                <span className="text-xs font-bold text-orange-700">1</span>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Ara Toplam</Label>
                                <div className="text-xs text-gray-500">Sipariş tutarı</div>
                              </div>
                            </div>
                            <Switch
                              id="show-gross"
                              checked={watchedValues.totals?.showGross}
                              onCheckedChange={(checked) => form.setValue('totals.showGross', checked)}
                            />
                          </div>
                        </div>

                        {/* İndirim */}
                        <div className="border rounded-lg p-3 bg-red-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded-full">
                                <span className="text-xs font-bold text-red-700">2</span>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">İndirim</Label>
                                <div className="text-xs text-gray-500">Toplam indirim tutarı</div>
                              </div>
                            </div>
                            <Switch
                              id="show-discount"
                              checked={watchedValues.totals?.showDiscount}
                              onCheckedChange={(checked) => form.setValue('totals.showDiscount', checked)}
                            />
                          </div>
                        </div>

                        {/* KDV */}
                        <div className="border rounded-lg p-3 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-full">
                                <span className="text-xs font-bold text-blue-700">3</span>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">KDV</Label>
                                <div className="text-xs text-gray-500">Vergi tutarı</div>
                              </div>
                            </div>
                            <Switch
                              id="show-tax"
                              checked={watchedValues.totals?.showTax}
                              onCheckedChange={(checked) => form.setValue('totals.showTax', checked)}
                            />
                          </div>
                        </div>

                        {/* Genel Toplam */}
                        <div className="border rounded-lg p-3 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 flex items-center justify-center bg-green-100 rounded-full">
                                <span className="text-xs font-bold text-green-700">4</span>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">Genel Toplam</Label>
                                <div className="text-xs text-gray-500">Son ödenecek tutar</div>
                              </div>
                            </div>
                            <Switch
                              id="show-net"
                              checked={watchedValues.totals?.showNet}
                              onCheckedChange={(checked) => form.setValue('totals.showNet', checked)}
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
                    <AccordionTrigger className="bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 px-4 py-3 rounded-t-lg border-b border-gray-200 font-semibold text-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 flex items-center justify-center bg-pink-100 rounded-md">
                          <span className="text-sm font-bold text-pink-700">📝</span>
                        </div>
                        <span>Not Ayarları</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Giriş Notu</Label>
                        <Textarea {...form.register('notes.intro')} rows={3} />
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Font Boyutu:</Label>
                          <Input
                            type="number"
                            {...form.register('notes.introFontSize', { valueAsNumber: true })}
                            min="8"
                            max="32"
                            placeholder="12"
                            className="w-20"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Alt Bilgi</Label>
                        <Textarea {...form.register('notes.footer')} rows={3} />
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Font Boyutu:</Label>
                          <Input
                            type="number"
                            {...form.register('notes.footerFontSize', { valueAsNumber: true })}
                            min="8"
                            max="32"
                            placeholder="12"
                            className="w-20"
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <CustomTextFields
                          fields={watchedValues.notes?.customFields || []}
                          onFieldsChange={(fields) => form.setValue('notes.customFields', fields)}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="mr-2 h-4 w-4" />
                    {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/settings')}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
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