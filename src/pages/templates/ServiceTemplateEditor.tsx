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
import { Save, FileText, Loader2 } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
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
  service_title: z.string().min(1, 'Servis başlığı gereklidir'),
  service_request_description: z.string().optional(),
  service_type: z.string().optional(),
  service_priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimated_duration: z.number().optional(),
  default_location: z.string().optional(),
  default_technician_id: z.string().optional(),
});

type ServiceTemplateFormData = z.infer<typeof serviceTemplateFormSchema>;

export default function ServiceTemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const [pdfSchema, setPdfSchema] = useState<ServiceTemplateSchema>(defaultServiceTemplateSchema);
  const [previewData, setPreviewData] = useState<ServicePdfData>(sampleServicePdfData);

  const form = useForm<ServiceTemplateFormData>({
    resolver: zodResolver(serviceTemplateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      service_title: '',
      service_request_description: '',
      service_type: '',
      service_priority: 'medium',
      estimated_duration: undefined,
      default_location: '',
      default_technician_id: '',
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

  // Load technicians
  const { data: technicians } = useQuery({
    queryKey: ['technicians', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('company_id', userData.company_id)
        .eq('status', 'aktif')
        .order('first_name');
      if (error) return [];
      return data || [];
    },
    enabled: !!userData?.company_id,
  });

  // Load company info on mount
  useEffect(() => {
    const loadCompanyInfo = async () => {
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
        }
      } catch (error) {
        console.error('Error loading company info:', error);
      }
    };
    loadCompanyInfo();
  }, []);

  // Load form data for editing
  useEffect(() => {
    if (existingTemplate) {
      form.reset({
        name: existingTemplate.name || '',
        description: existingTemplate.description || '',
        service_title: existingTemplate.service_title || '',
        service_request_description: existingTemplate.service_request_description || '',
        service_type: existingTemplate.service_type || '',
        service_priority: existingTemplate.service_priority || 'medium',
        estimated_duration: existingTemplate.estimated_duration || undefined,
        default_location: existingTemplate.default_location || '',
        default_technician_id: existingTemplate.default_technician_id || '',
      });

      // Update preview data with template values
      setPreviewData(prev => ({
        ...prev,
        serviceTitle: existingTemplate.service_title || prev.serviceTitle,
        serviceDescription: existingTemplate.service_request_description || prev.serviceDescription,
        serviceType: existingTemplate.service_type || prev.serviceType,
        priority: existingTemplate.service_priority || prev.priority,
        estimatedDuration: existingTemplate.estimated_duration || prev.estimatedDuration,
        location: existingTemplate.default_location || prev.location,
      }));
    }
  }, [existingTemplate, form]);

  // Watch form changes and update preview
  const watchedValues = form.watch();
  useEffect(() => {
    setPreviewData(prev => ({
      ...prev,
      serviceTitle: watchedValues.service_title || prev.serviceTitle,
      serviceDescription: watchedValues.service_request_description || prev.serviceDescription,
      serviceType: watchedValues.service_type || prev.serviceType,
      priority: watchedValues.service_priority || prev.priority,
      estimatedDuration: watchedValues.estimated_duration || prev.estimatedDuration,
      location: watchedValues.default_location || prev.location,
    }));
  }, [watchedValues.service_title, watchedValues.service_request_description, watchedValues.service_type, watchedValues.service_priority, watchedValues.estimated_duration, watchedValues.default_location]);

  const createMutation = useMutation({
    mutationFn: async (data: ServiceTemplateFormData) => {
      if (!userData?.company_id || !userData?.id) {
        throw new Error('Kullanıcı bilgileri bulunamadı');
      }
      const templateData: CreateServiceTemplateData = {
        name: data.name,
        description: data.description,
        service_title: data.service_title,
        service_request_description: data.service_request_description,
        service_type: data.service_type,
        service_priority: data.service_priority,
        estimated_duration: data.estimated_duration,
        default_location: data.default_location,
        default_technician_id: data.default_technician_id || undefined,
      };
      return ServiceTemplateService.createTemplate(userData.company_id, userData.id, templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-templates'] });
      toast.success('Servis şablonu başarıyla oluşturuldu');
      navigate('/pdf-templates');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Şablon oluşturulurken bir hata oluştu');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceTemplateFormData) => {
      if (!id || id === 'new') throw new Error('Template ID bulunamadı');
      const templateData: Partial<CreateServiceTemplateData> = {
        name: data.name,
        description: data.description,
        service_title: data.service_title,
        service_request_description: data.service_request_description,
        service_type: data.service_type,
        service_priority: data.service_priority,
        estimated_duration: data.estimated_duration,
        default_location: data.default_location,
        default_technician_id: data.default_technician_id || undefined,
      };
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
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSchema;
    });
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background rounded-md border shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate("/pdf-templates")}
              variant="ghost"
              size="sm"
            >
              Şablonlar
            </BackButton>
            
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight">
                  {isNew ? 'Yeni Servis Şablonu' : 'Servis Şablonu Düzenle'}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {isNew ? 'Yeni bir servis şablonu oluşturun' : `${existingTemplate?.name || 'Şablon'} düzenleniyor`}
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isLoading ? "Kaydediliyor..." : "Kaydet"}</span>
          </Button>
        </div>
      </div>

      {/* Main Content - Resizable Panels */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
        {/* Left Panel - Form */}
        <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
          <div className="h-full overflow-y-auto p-4 space-y-4">
            {/* Template Info */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Şablon Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs">Şablon Adı *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Örn: Bakım Şablonu"
                    className="h-8 text-sm"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs">Açıklama</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Şablon hakkında açıklama"
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Service Details */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Servis Detayları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="service_title" className="text-xs">Servis Başlığı *</Label>
                  <Input
                    id="service_title"
                    {...form.register('service_title')}
                    placeholder="Örn: Yıllık Bakım"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_request_description" className="text-xs">Servis Açıklaması</Label>
                  <Textarea
                    id="service_request_description"
                    {...form.register('service_request_description')}
                    placeholder="Servis talebi detayları"
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Servis Tipi</Label>
                    <Input
                      {...form.register('service_type')}
                      placeholder="Örn: Bakım"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Öncelik</Label>
                    <Select
                      value={form.watch('service_priority')}
                      onValueChange={(value) => form.setValue('service_priority', value as any)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Düşük</SelectItem>
                        <SelectItem value="medium">Orta</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="urgent">Acil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Tahmini Süre (dk)</Label>
                    <Input
                      type="number"
                      {...form.register('estimated_duration', { valueAsNumber: true })}
                      placeholder="60"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Varsayılan Konum</Label>
                    <Input
                      {...form.register('default_location')}
                      placeholder="Konum"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Varsayılan Teknisyen</Label>
                  <Select
                    value={form.watch('default_technician_id') || undefined}
                    onValueChange={(value) => form.setValue('default_technician_id', value || undefined)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Teknisyen seçin (opsiyonel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {technicians?.map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          {tech.first_name} {tech.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* PDF Settings */}
            <Accordion type="multiple" defaultValue={['header', 'serviceInfo']} className="space-y-2">
              {/* Header Settings */}
              <AccordionItem value="header" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline">
                  Başlık Ayarları
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Logo Göster</Label>
                    <Switch
                      checked={pdfSchema.header.showLogo}
                      onCheckedChange={(checked) => updatePdfSchema('header.showLogo', checked)}
                    />
                  </div>
                  {pdfSchema.header.showLogo && (
                    <LogoUploadField
                      logoUrl={pdfSchema.header.logoUrl}
                      onLogoChange={(url) => updatePdfSchema('header.logoUrl', url)}
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Başlık Göster</Label>
                    <Switch
                      checked={pdfSchema.header.showTitle}
                      onCheckedChange={(checked) => updatePdfSchema('header.showTitle', checked)}
                    />
                  </div>
                  {pdfSchema.header.showTitle && (
                    <div className="space-y-2">
                      <Label className="text-xs">Başlık Metni</Label>
                      <Input
                        value={pdfSchema.header.title}
                        onChange={(e) => updatePdfSchema('header.title', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Şirket Bilgisi Göster</Label>
                    <Switch
                      checked={pdfSchema.header.showCompanyInfo}
                      onCheckedChange={(checked) => updatePdfSchema('header.showCompanyInfo', checked)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Service Info Settings */}
              <AccordionItem value="serviceInfo" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline">
                  Servis Bilgileri Görünümü
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Öncelik Göster</Label>
                    <Switch
                      checked={pdfSchema.serviceInfo.showPriority}
                      onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showPriority', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Tahmini Süre Göster</Label>
                    <Switch
                      checked={pdfSchema.serviceInfo.showEstimatedDuration}
                      onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showEstimatedDuration', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Teknisyen Göster</Label>
                    <Switch
                      checked={pdfSchema.serviceInfo.showTechnician}
                      onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showTechnician', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Konum Göster</Label>
                    <Switch
                      checked={pdfSchema.serviceInfo.showLocation}
                      onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showLocation', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Servis Tipi Göster</Label>
                    <Switch
                      checked={pdfSchema.serviceInfo.showServiceType}
                      onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showServiceType', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Tarihler Göster</Label>
                    <Switch
                      checked={pdfSchema.serviceInfo.showDates}
                      onCheckedChange={(checked) => updatePdfSchema('serviceInfo.showDates', checked)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Parts Table Settings */}
              <AccordionItem value="partsTable" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline">
                  Parça Tablosu
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Parça Tablosu Göster</Label>
                    <Switch
                      checked={pdfSchema.partsTable.show}
                      onCheckedChange={(checked) => updatePdfSchema('partsTable.show', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Sıra Numarası Göster</Label>
                    <Switch
                      checked={pdfSchema.partsTable.showRowNumber}
                      onCheckedChange={(checked) => updatePdfSchema('partsTable.showRowNumber', checked)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Instructions Settings */}
              <AccordionItem value="instructions" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline">
                  Yapılacak İşlemler
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">İşlemler Göster</Label>
                    <Switch
                      checked={pdfSchema.instructions.show}
                      onCheckedChange={(checked) => updatePdfSchema('instructions.show', checked)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Footer Settings */}
              <AccordionItem value="footer" className="border rounded-lg">
                <AccordionTrigger className="px-4 py-2 text-sm font-medium hover:no-underline">
                  Alt Bilgi
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Alt Bilgi Metni</Label>
                    <Textarea
                      value={pdfSchema.notes.footer || ''}
                      onChange={(e) => updatePdfSchema('notes.footer', e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - PDF Preview */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full bg-muted/30 p-4">
            <div className="h-full rounded-lg overflow-hidden border bg-background shadow-inner">
              <PDFViewer
                style={{ width: '100%', height: '100%', border: 'none' }}
                showToolbar={true}
              >
                <ServicePdfRenderer data={previewData} schema={pdfSchema} />
              </PDFViewer>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
