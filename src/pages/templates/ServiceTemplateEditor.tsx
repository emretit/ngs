import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { PDFViewer } from '@react-pdf/renderer';
import { Save, FileText, Loader2, Eye, MoreHorizontal, Download, Send } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ServiceTemplateService, ServiceTemplate, CreateServiceTemplateData } from '@/services/serviceTemplateService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import ServicePdfRenderer from '@/components/pdf/ServicePdfRenderer';
import { 
  ServiceTemplateSchema, 
  ServicePdfData, 
  defaultServiceTemplateSchema, 
  sampleServicePdfData 
} from '@/types/service-template';
import { LogoUploadField } from '@/components/templates/LogoUploadField';
import { PdfExportService } from '@/services/pdf/pdfExportService';

const serviceTemplateFormSchema = z.object({
  name: z.string().min(1, 'Şablon adı gereklidir'),
  description: z.string().optional(),
});

type ServiceTemplateFormData = z.infer<typeof serviceTemplateFormSchema>;

export default function ServiceTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [pdfSchema, setPdfSchema] = useState<ServiceTemplateSchema>(defaultServiceTemplateSchema);
  const [previewData, setPreviewData] = useState<ServicePdfData>(sampleServicePdfData);
  const [templateName, setTemplateName] = useState('');
  const companyInfoLoadedRef = useRef(false);

  const form = useForm<ServiceTemplateFormData>({
    resolver: zodResolver(serviceTemplateFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Load existing template
  const { data: existingTemplate, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['service-template', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      return ServiceTemplateService.getTemplate(id);
    },
    enabled: !isNew,
  });


  // Load company info on mount
  const loadCompanyInfo = async (showToast = false) => {
    if (companyInfoLoadedRef.current && showToast) {
      return;
    }
    
    try {
      const companySettings = await PdfExportService.getCompanySettings();
      if (companySettings) {
        const settings = companySettings as any;
        setPdfSchema(prev => ({
          ...prev,
          header: {
            ...prev.header,
            companyName: settings.company_name || '',
            companyAddress: settings.company_address || '',
            companyPhone: settings.company_phone || '',
            companyEmail: settings.company_email || '',
            companyWebsite: settings.company_website || '',
            companyTaxNumber: settings.company_tax_number || '',
            ...(settings.company_logo_url ? { logoUrl: settings.company_logo_url } : {}),
          },
        }));
        
        if (showToast && !companyInfoLoadedRef.current) {
          companyInfoLoadedRef.current = true;
          toast.success('Şirket bilgileri sistem ayarlarından yüklendi');
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
    const isNewTemplatePage = location.pathname === '/pdf-templates/service/new' || id === 'new';
    
    if (isNewTemplatePage) {
      setTemplateName('Yeni Servis Şablonu');
      companyInfoLoadedRef.current = false;
      const initializeNewTemplate = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        await loadCompanyInfo(true);
      };
      initializeNewTemplate();
    } else if (existingTemplate) {
      setTemplateName(existingTemplate.name || '');
      form.reset({
        name: existingTemplate.name || '',
        description: existingTemplate.description || '',
      });
      
      // Load PDF schema from service_details.pdf_schema
      if (existingTemplate.service_details?.pdf_schema) {
        // Merge with defaults to ensure all properties exist
        setPdfSchema({
          ...defaultServiceTemplateSchema,
          ...existingTemplate.service_details.pdf_schema,
          page: {
            ...defaultServiceTemplateSchema.page,
            ...(existingTemplate.service_details.pdf_schema.page || {}),
            padding: {
              ...defaultServiceTemplateSchema.page.padding,
              ...(existingTemplate.service_details.pdf_schema.page?.padding || {}),
            },
          },
          header: {
            ...defaultServiceTemplateSchema.header,
            ...(existingTemplate.service_details.pdf_schema.header || {}),
          },
          serviceInfo: {
            ...defaultServiceTemplateSchema.serviceInfo,
            ...(existingTemplate.service_details.pdf_schema.serviceInfo || {}),
          },
          partsTable: {
            ...defaultServiceTemplateSchema.partsTable,
            ...(existingTemplate.service_details.pdf_schema.partsTable || {}),
          },
          signatures: {
            ...defaultServiceTemplateSchema.signatures,
            ...(existingTemplate.service_details.pdf_schema.signatures || {}),
          },
          notes: {
            ...defaultServiceTemplateSchema.notes,
            ...(existingTemplate.service_details.pdf_schema.notes || {}),
          },
        });
      } else if (existingTemplate.service_details) {
        // Fallback: if pdf_schema doesn't exist, use service_details directly with defaults
        setPdfSchema({
          ...defaultServiceTemplateSchema,
          ...(existingTemplate.service_details as ServiceTemplateSchema),
          page: {
            ...defaultServiceTemplateSchema.page,
            ...((existingTemplate.service_details as any)?.page || {}),
            padding: {
              ...defaultServiceTemplateSchema.page.padding,
              ...((existingTemplate.service_details as any)?.page?.padding || {}),
            },
          },
        });
      }
    }
  }, [id, existingTemplate, form, location.pathname]);


  const createMutation = useMutation({
    mutationFn: async (data: ServiceTemplateFormData) => {
      if (!userData?.company_id || !userData?.id) {
        throw new Error('Kullanıcı bilgileri bulunamadı');
      }
      
      // pdfSchema'yı kontrol et
      if (!pdfSchema) {
        throw new Error('PDF şeması yüklenemedi');
      }
      
      const templateData: CreateServiceTemplateData = {
        name: data.name,
        description: data.description,
        service_details: {
          pdf_schema: pdfSchema,
        },
      };
      
      console.log('Creating template with data:', {
        name: templateData.name,
        description: templateData.description,
        service_details: templateData.service_details,
        pdf_schema_keys: Object.keys(templateData.service_details.pdf_schema || {}),
      });
      
      return ServiceTemplateService.createTemplate(userData.company_id, userData.id, templateData);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-templates'] });
      toast.success('Servis şablonu başarıyla oluşturuldu');
      navigate(`/pdf-templates/service/edit/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Şablon oluşturulurken bir hata oluştu');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceTemplateFormData) => {
      if (!id || id === 'new') throw new Error('Template ID bulunamadı');
      
      // pdfSchema'yı kontrol et
      if (!pdfSchema) {
        throw new Error('PDF şeması yüklenemedi');
      }
      
      // Mevcut service_details'i koru, sadece pdf_schema'yı güncelle
      const currentServiceDetails = existingTemplate?.service_details || {};
      const templateData: Partial<CreateServiceTemplateData> = {
        name: data.name,
        description: data.description,
        service_details: {
          ...currentServiceDetails,
          pdf_schema: pdfSchema,
        },
      };
      
      console.log('Updating template with data:', {
        id,
        name: templateData.name,
        description: templateData.description,
        service_details: templateData.service_details,
        pdf_schema_keys: Object.keys(templateData.service_details?.pdf_schema || {}),
      });
      
      return ServiceTemplateService.updateTemplate(id, templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-templates'] });
      queryClient.invalidateQueries({ queryKey: ['service-template', id] });
      toast.success('Servis şablonu başarıyla güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Şablon güncellenirken bir hata oluştu');
    },
  });

  const onSubmit = (data: ServiceTemplateFormData) => {
    // pdfSchema'nın güncel olduğundan emin ol
    if (!pdfSchema) {
      toast.error('PDF şeması yüklenemedi. Lütfen sayfayı yenileyin.');
      return;
    }
    
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isLoadingTemplate;

  // PDF Schema update helpers
  const updatePdfSchema = (path: string, value: any) => {
    setPdfSchema(prev => {
      const newSchema = { ...prev };
      const keys = path.split('.');
      let current: any = newSchema;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSchema;
    });
  };

  const handleDownloadPdf = async () => {
    if (!previewData) return;
    
    try {
      const blob = await PdfExportService.generateServicePdf(previewData, { template: { id: '', name: '', schema_json: pdfSchema, is_active: true, company_id: '', created_at: '', updated_at: '' } as any });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `servis-fisi-${previewData.serviceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF başarıyla indirildi');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('PDF indirilirken hata oluştu');
    }
  };

  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate("/pdf-templates")}
              variant="ghost"
              size="sm"
            >
              PDF Şablonları
            </BackButton>
            
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {isNew ? 'Yeni Servis Şablonu' : 'Servis Şablonu Editörü'}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {isNew ? 'Yeni bir servis şablonu oluşturun' : `${existingTemplate?.name || 'Şablon'} düzenleniyor`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={form.handleSubmit(onSubmit, (errors) => {
                console.error('Form validation errors:', errors);
                toast.error('Lütfen form alanlarını kontrol edin');
              })}
              disabled={isLoading}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? "Kaydediliyor..." : "Kaydet"}</span>
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
                <DropdownMenuItem onClick={handleDownloadPdf} className="gap-2 cursor-pointer" disabled={!previewData}>
                  <Download className="h-4 w-4" />
                  <span>PDF İndir</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info("E-posta gönderimi özelliği yakında eklenecek")} className="gap-2 cursor-pointer">
                  <Send className="h-4 w-4" />
                  <span>E-posta Gönder</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

      </div>

      {/* Top Panel - Genel Ayarlar */}
      <div className="bg-background px-4 py-2 rounded-md border border-gray-200">
        <div className="flex items-center gap-6">
          {/* Genel Ayarlar - Accordion */}
          <div className="flex-1">
            <Accordion type="single" collapsible defaultValue="general" className="w-full">
              <AccordionItem value="general" className="border-0">
                <AccordionTrigger className="bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 px-3 py-1.5 rounded-lg border border-gray-200 font-semibold text-xs text-gray-800 h-auto">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🎨</span>
                    <span>Genel Ayarlar</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 px-0 pb-0">
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Şablon Adı */}
                    <div className="flex items-center gap-2">
                      <Label htmlFor="template-name" className="text-xs text-gray-600 whitespace-nowrap">Şablon Adı:</Label>
                      <Input
                        id="template-name"
                        type="text"
                        {...form.register('name')}
                        value={form.watch('name') || templateName}
                        onChange={(e) => {
                          setTemplateName(e.target.value);
                          form.setValue('name', e.target.value);
                        }}
                        placeholder="Şablon adı"
                        className="h-7 w-40 text-xs"
                      />
                      {form.formState.errors.name && (
                        <p className="text-xs text-destructive ml-2">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    {/* Font Family */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Font:</Label>
                      <Select
                        value={pdfSchema?.page?.fontFamily || 'Roboto'}
                        onValueChange={(value) => updatePdfSchema('page.fontFamily', value)}
                      >
                        <SelectTrigger className="h-7 w-40 text-xs">
                          <SelectValue placeholder="Font seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                          <SelectItem value="Open Sans">Open Sans</SelectItem>
                          <SelectItem value="Lato">Lato</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Poppins">Poppins</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times-Roman">Times Roman</SelectItem>
                          <SelectItem value="Courier">Courier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Size */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Font Boyutu:</Label>
                      <Input
                        type="number"
                        value={pdfSchema?.page?.fontSize || 12}
                        onChange={(e) => updatePdfSchema('page.fontSize', Number(e.target.value))}
                        min="8"
                        max="20"
                        placeholder="12"
                        className="h-7 w-14 text-center text-xs"
                      />
                    </div>

                    {/* Font Weight */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Kalınlık:</Label>
                      <Select
                        value={pdfSchema?.page?.fontWeight || 'normal'}
                        onValueChange={(value) => updatePdfSchema('page.fontWeight', value)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue placeholder="Kalınlık" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Kalın</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Font Color */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Font Rengi:</Label>
                      <div className="flex items-center gap-1">
                        {[
                          { name: 'Siyah', value: '#000000' },
                          { name: 'Koyu Gri', value: '#374151' },
                          { name: 'Gri', value: '#6B7280' },
                          { name: 'Mavi', value: '#3B82F6' },
                          { name: 'Kırmızı', value: '#EF4444' },
                          { name: 'Yeşil', value: '#10B981' },
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => updatePdfSchema('page.fontColor', color.value)}
                            className={`h-6 w-6 rounded-full border hover:ring-2 hover:ring-blue-400 transition-all ${
                              pdfSchema?.page?.fontColor === color.value ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={pdfSchema?.page?.fontColor || '#000000'}
                        onChange={(e) => updatePdfSchema('page.fontColor', e.target.value)}
                        className="h-7 w-12"
                        title="Özel Renk"
                      />
                    </div>

                    {/* Background Color */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-600 whitespace-nowrap">Arka Plan:</Label>
                      <div className="flex items-center gap-1">
                        {[
                          { name: 'Beyaz', value: '#FFFFFF', preview: 'bg-white' },
                          { name: 'Açık Gri', value: '#F9FAFB', preview: 'bg-gray-50' },
                          { name: 'Gri', value: '#F3F4F6', preview: 'bg-gray-100' },
                          { name: 'Açık Mavi', value: '#EFF6FF', preview: 'bg-blue-50' },
                          { name: 'Açık Yeşil', value: '#F0FDF4', preview: 'bg-green-50' },
                        ].map((bg) => (
                          <button
                            key={bg.value}
                            type="button"
                            onClick={() => updatePdfSchema('page.backgroundColor', bg.value)}
                            className={`${bg.preview} border rounded p-1 h-6 w-6 hover:ring-2 hover:ring-blue-400 transition-all ${
                              pdfSchema?.page?.backgroundColor === bg.value ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'
                            }`}
                            title={bg.name}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={pdfSchema?.page?.backgroundColor || '#FFFFFF'}
                        onChange={(e) => updatePdfSchema('page.backgroundColor', e.target.value)}
                        className="h-7 w-12"
                        title="Özel Renk"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-16rem)] rounded-md border border-gray-200 overflow-hidden">
        {/* Settings Panel */}
        <ResizablePanel defaultSize={28} minSize={22} className="min-w-0 flex flex-col">
          <div className="h-full flex flex-col bg-gradient-to-b from-background via-background/98 to-muted/20 border-r border-border/20 min-h-0 overflow-hidden">
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-2 min-h-0 space-y-2">
              
              {/* Header Settings */}
              <Accordion type="single" collapsible defaultValue="header">
                <AccordionItem value="header" className="border border-gray-200 rounded-lg">
                  <AccordionTrigger className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">📄</span>
                      <span>Başlık Ayarları</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 pt-1.5 px-2 pb-2">
                    {/* Title and Logo Settings - Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                      {/* Title Settings */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">T</span>
                            <Label className="text-xs font-semibold text-gray-800">Başlık</Label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Switch
                              id="show-title"
                              checked={pdfSchema.header.showTitle ?? true}
                              onCheckedChange={(checked) => updatePdfSchema('header.showTitle', checked)}
                              className="scale-[0.65]"
                            />
                            <Label htmlFor="show-title" className="text-xs text-gray-600">Göster</Label>
                          </div>
                        </div>
                        {pdfSchema.header.showTitle && (
                          <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-1.5">
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Başlık Metni</Label>
                              <Input 
                                value={pdfSchema.header.title || ''}
                                onChange={(e) => updatePdfSchema('header.title', e.target.value)}
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                                placeholder="Başlık metnini girin"
                              />
                            </div>
                            <div className="pt-1 border-t border-gray-200 flex items-center gap-2">
                              <Label className="text-xs text-gray-600 min-w-fit">Font</Label>
                              <Input
                                type="number"
                                value={pdfSchema.header.titleFontSize || 18}
                                onChange={(e) => updatePdfSchema('header.titleFontSize', Number(e.target.value))}
                                min="8"
                                max="30"
                                placeholder="18"
                                className="h-7 w-14 text-center text-xs"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Logo Settings */}
                      <LogoUploadField
                        logoUrl={pdfSchema.header.logoUrl}
                        onLogoChange={(url) => updatePdfSchema('header.logoUrl', url || undefined)}
                        logoPosition={pdfSchema.header.logoPosition || 'left'}
                        onPositionChange={(value) => updatePdfSchema('header.logoPosition', value)}
                        logoSize={pdfSchema.header.logoSize || 80}
                        onSizeChange={(value) => updatePdfSchema('header.logoSize', value)}
                        showLogo={pdfSchema.header.showLogo}
                        onShowLogoChange={(value) => updatePdfSchema('header.showLogo', value)}
                      />
                    </div>
                    
                    {/* Company Info Settings */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🏢</span>
                          <Label className="text-xs font-semibold text-gray-800">Şirket Bilgileri</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Switch
                            id="show-company-info"
                            checked={pdfSchema.header.showCompanyInfo}
                            onCheckedChange={(checked) => updatePdfSchema('header.showCompanyInfo', checked)}
                            className="scale-75"
                          />
                          <Label htmlFor="show-company-info" className="text-xs text-gray-600">Göster</Label>
                        </div>
                      </div>

                      {pdfSchema.header.showCompanyInfo && (
                        <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-1.5">
                          <div className="p-1 bg-blue-50/80 border border-blue-200/50 rounded text-xs text-blue-700 flex items-center gap-1">
                            <span>💡</span>
                            <span>Sistem Ayarları'ndan otomatik yüklenir</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Şirket Adı</Label>
                              <Input 
                                value={pdfSchema.header.companyName || ''}
                                onChange={(e) => updatePdfSchema('header.companyName', e.target.value)}
                                placeholder="Şirket adı" 
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Font</Label>
                              <Input
                                type="number"
                                value={pdfSchema.header.companyInfoFontSize || 10}
                                onChange={(e) => updatePdfSchema('header.companyInfoFontSize', Number(e.target.value))}
                                min="8"
                                max="15"
                                placeholder="10"
                                className="h-7 w-14 text-center text-xs"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-gray-600 mb-0.5 block">Adres</Label>
                            <Input 
                              value={pdfSchema.header.companyAddress || ''}
                              onChange={(e) => updatePdfSchema('header.companyAddress', e.target.value)}
                              placeholder="Şirket adresi" 
                              className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Telefon</Label>
                              <Input 
                                value={pdfSchema.header.companyPhone || ''}
                                onChange={(e) => updatePdfSchema('header.companyPhone', e.target.value)}
                                placeholder="Telefon" 
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">E-posta</Label>
                              <Input 
                                value={pdfSchema.header.companyEmail || ''}
                                onChange={(e) => updatePdfSchema('header.companyEmail', e.target.value)}
                                placeholder="E-posta" 
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Website</Label>
                              <Input 
                                value={pdfSchema.header.companyWebsite || ''}
                                onChange={(e) => updatePdfSchema('header.companyWebsite', e.target.value)}
                                placeholder="Website" 
                                className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600 mb-0.5 block">Diğer</Label>
                              <Input 
                                value={pdfSchema.header.companyTaxNumber || ''}
                                onChange={(e) => updatePdfSchema('header.companyTaxNumber', e.target.value)}
                                placeholder="İstediğiniz metni yazın" 
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

              {/* Service Info Settings */}
              <Accordion type="single" collapsible defaultValue="serviceInfo">
                <AccordionItem value="serviceInfo" className="border border-gray-200 rounded-lg">
                  <AccordionTrigger className="bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">🔧</span>
                      <span>Servis Bilgileri Görünümü</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2 pt-1.5">
                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md mb-2">
                      <div className="font-medium text-blue-800 mb-1">Servis Bilgileri</div>
                      <div className="space-y-0.5 text-blue-700 text-xs">
                        <div>• Servis bilgileri otomatik gösterilir</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="border rounded-md p-1.5 bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">1</span>
                            <Label className="text-xs font-medium text-gray-700">Servis No</Label>
                          </div>
                          <Switch
                            id="show-service-number"
                            checked={pdfSchema.serviceInfo.showServiceNumber ?? true}
                            onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showServiceNumber', checked)}
                            className="scale-[0.65]"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md p-1.5 bg-purple-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">2</span>
                            <Label className="text-xs font-medium text-gray-700">Servis Durumu</Label>
                          </div>
                          <Switch
                            id="show-service-status"
                            checked={pdfSchema.serviceInfo.showServiceStatus ?? true}
                            onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showServiceStatus', checked)}
                            className="scale-[0.65]"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md p-1.5 bg-yellow-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">3</span>
                            <Label className="text-xs font-medium text-gray-700">Servis Tipi</Label>
                          </div>
                          <Switch
                            id="show-service-type"
                            checked={pdfSchema.serviceInfo.showServiceType}
                            onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showServiceType', checked)}
                            className="scale-[0.65]"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md p-1.5 bg-green-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">4</span>
                            <Label className="text-xs font-medium text-gray-700">Teknisyen</Label>
                          </div>
                          <Switch
                            id="show-technician"
                            checked={pdfSchema.serviceInfo.showTechnician}
                            onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showTechnician', checked)}
                            className="scale-[0.65]"
                          />
                        </div>
                      </div>

                      <div className="border rounded-md p-1.5 bg-pink-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">5</span>
                            <Label className="text-xs font-medium text-gray-700">Tarihler</Label>
                          </div>
                          <Switch
                            id="show-dates"
                            checked={pdfSchema.serviceInfo.showDates}
                            onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showDates', checked)}
                            className="scale-[0.65]"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Font Ayarları - Servis ve Müşteri Bilgileri için Ortak */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="text-xs text-muted-foreground bg-purple-50 p-2 rounded-md mb-2">
                        <div className="font-medium text-purple-800 mb-1">Font Ayarları</div>
                        <div className="space-y-0.5 text-purple-700 text-xs">
                          <div>• Servis ve Müşteri bilgileri için ortak font ayarları</div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50/80 border border-gray-200 rounded-md p-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-600 whitespace-nowrap">Başlık Font:</Label>
                          <Input
                            type="number"
                            value={pdfSchema.serviceInfo?.titleFontSize || 14}
                            onChange={(e) => updatePdfSchema('serviceInfo.titleFontSize', Number(e.target.value))}
                            min="8"
                            max="25"
                            placeholder="14"
                            className="h-7 w-16 text-center text-xs"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-600 whitespace-nowrap">Bilgi Font:</Label>
                          <Input
                            type="number"
                            value={pdfSchema.serviceInfo?.infoFontSize || 10}
                            onChange={(e) => updatePdfSchema('serviceInfo.infoFontSize', Number(e.target.value))}
                            min="8"
                            max="15"
                            placeholder="10"
                            className="h-7 w-16 text-center text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Customer Info Settings */}
              <Accordion type="single" collapsible defaultValue="customer">
                <AccordionItem value="customer" className="border border-gray-200 rounded-lg">
                  <AccordionTrigger className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">👥</span>
                      <span>Müşteri Bilgileri</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pb-3 pt-2 space-y-2">
                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md">
                      <div className="font-medium text-blue-800 mb-1">Müşteri Bilgileri</div>
                      <div className="space-y-0.5 text-blue-700 text-xs">
                        <div>• Müşteri bilgileri otomatik gösterilir</div>
                        <div>• Font ayarları "Servis Bilgileri Görünümü" bölümünden yönetilir</div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Parts Table Settings */}
              <Accordion type="single" collapsible defaultValue="partsTable">
                <AccordionItem value="partsTable" className="border border-gray-200 rounded-lg">
                  <AccordionTrigger className="bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">📦</span>
                      <span>Parça Tablosu</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2 pt-1.5">
                    <div className="text-xs text-muted-foreground bg-orange-50 p-2 rounded-md mb-2">
                      <div className="font-medium text-orange-800 mb-1">Parça Tablosu</div>
                      <div className="space-y-0.5 text-orange-700 text-xs">
                        <div>• Parça tablosu kolonları otomatik gösterilir</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Sıra Numarası */}
                      <div className="border rounded-md p-1.5 bg-amber-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">1</span>
                            <Label className="text-xs font-medium text-gray-700">Sıra Numarası</Label>
                          </div>
                          <Switch
                            id="show-row-number"
                            checked={pdfSchema.partsTable?.showRowNumber ?? true}
                            onCheckedChange={(checked) => updatePdfSchema('partsTable.showRowNumber', checked)}
                            className="scale-[0.65]"
                          />
                        </div>
                      </div>

                      {/* Parça Adı */}
                      {pdfSchema.partsTable?.columns?.find(col => col.key === 'name') && (
                        <div className="border rounded-md p-1.5 bg-orange-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">2</span>
                              <Label className="text-xs font-medium text-gray-700">Parça Adı</Label>
                            </div>
                            <Switch
                              id="show-column-name"
                              checked={pdfSchema.partsTable.columns.find(col => col.key === 'name')?.show ?? true}
                              onCheckedChange={(checked) => {
                                const updatedColumns = pdfSchema.partsTable.columns.map((col) =>
                                  col.key === 'name' ? { ...col, show: checked } : col
                                );
                                updatePdfSchema('partsTable.columns', updatedColumns);
                              }}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Miktar */}
                      {pdfSchema.partsTable?.columns?.find(col => col.key === 'quantity') && (
                        <div className="border rounded-md p-1.5 bg-yellow-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">3</span>
                              <Label className="text-xs font-medium text-gray-700">Miktar</Label>
                            </div>
                            <Switch
                              id="show-column-quantity"
                              checked={pdfSchema.partsTable.columns.find(col => col.key === 'quantity')?.show ?? true}
                              onCheckedChange={(checked) => {
                                const updatedColumns = pdfSchema.partsTable.columns.map((col) =>
                                  col.key === 'quantity' ? { ...col, show: checked } : col
                                );
                                updatePdfSchema('partsTable.columns', updatedColumns);
                              }}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Birim */}
                      {pdfSchema.partsTable?.columns?.find(col => col.key === 'unit') && (
                        <div className="border rounded-md p-1.5 bg-green-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">4</span>
                              <Label className="text-xs font-medium text-gray-700">Birim</Label>
                            </div>
                            <Switch
                              id="show-column-unit"
                              checked={pdfSchema.partsTable.columns.find(col => col.key === 'unit')?.show ?? true}
                              onCheckedChange={(checked) => {
                                const updatedColumns = pdfSchema.partsTable.columns.map((col) =>
                                  col.key === 'unit' ? { ...col, show: checked } : col
                                );
                                updatePdfSchema('partsTable.columns', updatedColumns);
                              }}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Birim Fiyat */}
                      {pdfSchema.partsTable?.columns?.find(col => col.key === 'unitPrice') && (
                        <div className="border rounded-md p-1.5 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">5</span>
                              <Label className="text-xs font-medium text-gray-700">Birim Fiyat</Label>
                            </div>
                            <Switch
                              id="show-column-unitPrice"
                              checked={pdfSchema.partsTable.columns.find(col => col.key === 'unitPrice')?.show ?? true}
                              onCheckedChange={(checked) => {
                                const updatedColumns = pdfSchema.partsTable.columns.map((col) =>
                                  col.key === 'unitPrice' ? { ...col, show: checked } : col
                                );
                                updatePdfSchema('partsTable.columns', updatedColumns);
                              }}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Toplam */}
                      {pdfSchema.partsTable?.columns?.find(col => col.key === 'total') && (
                        <div className="border rounded-md p-1.5 bg-purple-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs">6</span>
                              <Label className="text-xs font-medium text-gray-700">Toplam</Label>
                            </div>
                            <Switch
                              id="show-column-total"
                              checked={pdfSchema.partsTable.columns.find(col => col.key === 'total')?.show ?? true}
                              onCheckedChange={(checked) => {
                                const updatedColumns = pdfSchema.partsTable.columns.map((col) =>
                                  col.key === 'total' ? { ...col, show: checked } : col
                                );
                                updatePdfSchema('partsTable.columns', updatedColumns);
                              }}
                              className="scale-[0.65]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Signatures Settings */}
              <Accordion type="single" collapsible defaultValue="signatures">
                <AccordionItem value="signatures" className="border border-gray-200 rounded-lg">
                  <AccordionTrigger className="bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">✍️</span>
                      <span>İmzalar</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2 pt-1.5 space-y-1.5">
                    <div className="border rounded-md p-1.5 bg-indigo-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">1</span>
                          <Label className="text-xs font-medium text-gray-700">İmza Bölümü</Label>
                        </div>
                        <Switch
                          id="show-signatures"
                          checked={pdfSchema.signatures?.show ?? true}
                          onCheckedChange={(checked) => updatePdfSchema('signatures.show', checked)}
                          className="scale-[0.65]"
                        />
                      </div>
                    </div>

                    {pdfSchema.signatures?.show && (
                      <>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="border rounded-md p-1.5 bg-blue-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">2</span>
                                <Label className="text-xs font-medium text-gray-700">Teknisyen İmzası</Label>
                              </div>
                              <Switch
                                id="show-technician-signature"
                                checked={pdfSchema.signatures?.showTechnician ?? true}
                                onCheckedChange={(checked) => updatePdfSchema('signatures.showTechnician', checked)}
                                className="scale-[0.65]"
                              />
                            </div>
                          </div>

                          <div className="border rounded-md p-1.5 bg-green-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">3</span>
                                <Label className="text-xs font-medium text-gray-700">Müşteri İmzası</Label>
                              </div>
                              <Switch
                                id="show-customer-signature"
                                checked={pdfSchema.signatures?.showCustomer ?? true}
                                onCheckedChange={(checked) => updatePdfSchema('signatures.showCustomer', checked)}
                                className="scale-[0.65]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div>
                            <Label className="text-xs text-gray-600 mb-0.5 block">Teknisyen Etiketi</Label>
                            <Input
                              value={pdfSchema.signatures?.technicianLabel || 'Teknisyen'}
                              onChange={(e) => updatePdfSchema('signatures.technicianLabel', e.target.value)}
                              placeholder="Teknisyen"
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 mb-0.5 block">Müşteri Etiketi</Label>
                            <Input
                              value={pdfSchema.signatures?.customerLabel || 'Müşteri'}
                              onChange={(e) => updatePdfSchema('signatures.customerLabel', e.target.value)}
                              placeholder="Müşteri"
                              className="h-7 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 mb-0.5 block">Font Boyutu</Label>
                            <Input
                              type="number"
                              value={pdfSchema.signatures?.fontSize || 10}
                              onChange={(e) => updatePdfSchema('signatures.fontSize', Number(e.target.value))}
                              min="8"
                              max="14"
                              placeholder="10"
                              className="h-7 w-14 text-center text-xs"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Notes Settings */}
              <Accordion type="single" collapsible defaultValue="notes">
                <AccordionItem value="notes" className="border border-gray-200 rounded-lg">
                  <AccordionTrigger className="bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 px-2 py-1.5 rounded-t-lg border-b border-gray-200 font-semibold text-xs text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">📝</span>
                      <span>Alt Bilgi</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2 pb-2 pt-1.5 space-y-1.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-semibold text-gray-800">Alt Bilgi Metni</Label>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2 pb-2 border-b border-gray-200">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs text-gray-600">Font:</Label>
                          <Input
                            type="number"
                            value={pdfSchema.notes.footerFontSize || 10}
                            onChange={(e) => updatePdfSchema('notes.footerFontSize', Number(e.target.value))}
                            min="6"
                            max="14"
                            placeholder="10"
                            className="h-6 w-14 text-center text-xs"
                          />
                        </div>
                      </div>

                      <Textarea
                        value={pdfSchema.notes.footer || ''}
                        onChange={(e) => updatePdfSchema('notes.footer', e.target.value)}
                        rows={3}
                        className="text-xs"
                        placeholder="Alt bilgi metnini buraya yazın."
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* PDF Preview */}
        <ResizablePanel defaultSize={72} minSize={60} className="min-w-0">
          <div className="h-full flex flex-col">
            <div className="pb-2 px-4 pt-2 border-b sticky top-0 bg-background z-10">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="h-4 w-4" />
                PDF Önizleme
              </div>
            </div>
            <div className="flex-1 w-full">
              {previewData && pdfSchema ? (
                <PDFViewer className="w-full h-full border-0">
                  <ServicePdfRenderer data={previewData} schema={pdfSchema} />
                </PDFViewer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  PDF önizlemesi yükleniyor...
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}