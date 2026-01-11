import React, { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Loader2, Wrench, FileText, MapPin, User } from 'lucide-react';
import { ServiceTemplateService, CreateServiceTemplateData } from '@/services/serviceTemplateService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';
import BackButton from '@/components/ui/back-button';
import ProductServiceCard from '@/components/proposals/cards/ProductServiceCard';
import ProductDetailsModal from '@/components/proposals/form/ProductDetailsModal';
import { Switch } from '@/components/ui/switch';
import { LogoUploadField } from '@/components/templates/LogoUploadField';
import { defaultServiceTemplateSchema, ServiceTemplateSchema } from '@/types/service-template';

const serviceTemplateSchema = z.object({
  name: z.string().min(1, 'Şablon adı gereklidir'),
  description: z.string().optional(),
  estimated_duration: z.number().optional(),
  default_location: z.string().optional(),
  default_technician_id: z.string().optional(),
});

type ServiceTemplateFormData = z.infer<typeof serviceTemplateSchema>;

interface TemplateProductItem {
  id: string;
  row_number: number;
  product_id?: string | null;
  name?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  total_price: number;
  currency?: string;
  image_url?: string;
}


export default function ServiceTemplateEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ServiceTemplateFormData>({
    resolver: zodResolver(serviceTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      estimated_duration: undefined,
      default_location: '',
      default_technician_id: '',
    },
  });

  // Product items state
  const [productItems, setProductItems] = useState<TemplateProductItem[]>([
    {
      id: "1",
      row_number: 1,
      product_id: null,
      name: '',
      description: '',
      quantity: 1,
      unit: 'adet',
      unit_price: 0,
      tax_rate: 20,
      discount_rate: 0,
      total_price: 0,
      currency: 'TRY'
    }
  ]);

  // Product modal state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItemData, setEditingItemData] = useState<any>(null);

  // Header settings state
  const [headerSettings, setHeaderSettings] = useState({
    showTitle: true,
    title: 'SERVİS FORMU',
    titleFontSize: 18,
    showLogo: true,
    logoUrl: undefined as string | undefined,
    logoPosition: 'left' as 'left' | 'center' | 'right',
    logoSize: 80,
    showCompanyInfo: true,
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    companyTaxNumber: '',
    companyInfoFontSize: 10,
  });

  // Mevcut şablonu yükle (düzenleme modu için)
  const { data: existingTemplate, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['service-template', id],
    queryFn: async () => {
      if (!id || id === 'new') return null;
      return ServiceTemplateService.getTemplate(id);
    },
    enabled: !isNew,
  });

  // Teknisyenleri yükle
  const { data: technicians } = useQuery({
    queryKey: ['technicians', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        
        .eq('status', 'aktif')
        .order('first_name');
      if (error) {
        logger.error('Error fetching technicians:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!userData?.company_id,
  });

  // Form verilerini yükle (düzenleme modu için)
  useEffect(() => {
    if (existingTemplate) {
      reset({
        name: existingTemplate.name || '',
        description: existingTemplate.description || '',
      });

      // Product items yükle (parts_list'den)
      if (existingTemplate.parts_list && Array.isArray(existingTemplate.parts_list) && existingTemplate.parts_list.length > 0) {
        setProductItems(existingTemplate.parts_list.map((item: any, index: number) => ({
          id: item.id || `item-${index + 1}`,
          row_number: index + 1,
          product_id: item.product_id || null,
          name: item.name || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'adet',
          unit_price: item.unit_price || 0,
          tax_rate: item.tax_rate || 20,
          discount_rate: item.discount_rate || 0,
          total_price: item.total_price || 0,
          currency: item.currency || 'TRY'
        })));
      }

      // PDF schema yükle (service_details.pdf_schema'dan veya pdf_schema'dan)
      const pdfSchema = existingTemplate.pdf_schema || 
                       existingTemplate.service_details?.pdf_schema;
      if (pdfSchema && typeof pdfSchema === 'object' && pdfSchema.header) {
        // Header settings yükle
        setHeaderSettings(prev => ({
          ...prev,
          showTitle: pdfSchema.header.showTitle ?? true,
          title: pdfSchema.header.title || 'SERVİS FORMU',
          titleFontSize: pdfSchema.header.titleFontSize || 18,
          showLogo: pdfSchema.header.showLogo ?? true,
          logoUrl: pdfSchema.header.logoUrl,
          logoPosition: pdfSchema.header.logoPosition || 'left',
          logoSize: pdfSchema.header.logoSize || 80,
          showCompanyInfo: pdfSchema.header.showCompanyInfo ?? true,
          companyName: pdfSchema.header.companyName || '',
          companyAddress: pdfSchema.header.companyAddress || '',
          companyPhone: pdfSchema.header.companyPhone || '',
          companyEmail: pdfSchema.header.companyEmail || '',
          companyWebsite: pdfSchema.header.companyWebsite || '',
          companyTaxNumber: pdfSchema.header.companyTaxNumber || '',
          companyInfoFontSize: pdfSchema.header.companyInfoFontSize || 10,
        }));

        // Form defaults'u yükle (service_details'den)
        const serviceDetails = existingTemplate.service_details || {};
        if (serviceDetails.estimated_duration) {
          setValue('estimated_duration', serviceDetails.estimated_duration);
        }
        if (serviceDetails.default_location) {
          setValue('default_location', serviceDetails.default_location);
        }
        if (serviceDetails.default_technician_id) {
          setValue('default_technician_id', serviceDetails.default_technician_id);
        }
      }
    }
  }, [existingTemplate, reset]);

  // Product items yönetimi
  const addProductItem = () => {
    setProductItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        row_number: prev.length + 1,
        product_id: null,
        name: '',
        description: '',
        quantity: 1,
        unit: 'adet',
        unit_price: 0,
        tax_rate: 20,
        discount_rate: 0,
        total_price: 0,
        currency: 'TRY'
      }
    ]);
  };

  const removeProductItem = (index: number) => {
    setProductItems(prev => {
      if (prev.length > 1) {
        const updatedItems = prev.filter((_, i) => i !== index);
        return updatedItems.map((item, i) => ({
          ...item,
          row_number: i + 1
        }));
      }
      return prev;
    });
  };

  const handleProductItemChange = (index: number, field: keyof TemplateProductItem, value: any) => {
    setProductItems(prev => {
      const updatedItems = [...prev];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        total_price: field === 'quantity' || field === 'unit_price' 
          ? (field === 'quantity' ? value : updatedItems[index].quantity) * 
            (field === 'unit_price' ? value : updatedItems[index].unit_price)
          : updatedItems[index].total_price
      };
      return updatedItems;
    });
  };

  const handleProductModalSelect = (product: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      setSelectedProduct(product);
      setEditingItemIndex(itemIndex);
      setEditingItemData(product);
      setProductModalOpen(true);
    } else {
      setSelectedProduct(product);
      setEditingItemIndex(undefined);
      setEditingItemData(null);
      setProductModalOpen(true);
    }
  };

  const handleAddProductToItems = (productData: any, itemIndex?: number) => {
    if (itemIndex !== undefined) {
      // Update existing item
      setProductItems(prev => {
        const updatedItems = [...prev];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          product_id: productData.id || productData.product_id || null,
          name: productData.name,
          description: productData.description,
          quantity: productData.quantity,
          unit: productData.unit,
          unit_price: productData.unit_price,
          tax_rate: productData.vat_rate,
          discount_rate: productData.discount_rate,
          total_price: productData.total_price,
          currency: productData.currency || 'TRY'
        };
        return updatedItems;
      });
    } else {
      // Add new item
      setProductItems(prev => {
        const newItem = {
          id: Date.now().toString(),
          row_number: prev.length + 1,
          product_id: productData.id || productData.product_id || null,
          name: productData.name,
          description: productData.description,
          quantity: productData.quantity,
          unit: productData.unit,
          unit_price: productData.unit_price,
          tax_rate: productData.vat_rate,
          discount_rate: productData.discount_rate,
          total_price: productData.total_price,
          currency: productData.currency || 'TRY'
        };
        return [...prev, newItem];
      });
    }
    
    setProductModalOpen(false);
    setEditingItemIndex(undefined);
    setSelectedProduct(null);
    setEditingItemData(null);
  };

  const createMutation = useMutation({
    mutationFn: async (data: ServiceTemplateFormData) => {
      if (!userData?.company_id || !userData?.id) {
        throw new Error('Kullanıcı bilgileri bulunamadı');
      }
      
      // Filter out empty product items
      const validProductItems = productItems.filter(item => 
        (item.name && item.name.trim()) || (item.description && item.description.trim())
      );

      // Tam pdf_schema yapısını oluştur (Flutter uyumlu)
      const pdfSchema: ServiceTemplateSchema = {
        ...defaultServiceTemplateSchema,
        header: {
          ...defaultServiceTemplateSchema.header,
          ...headerSettings,
        },
      };

      // Parts list'i Flutter formatına dönüştür
      const partsList = validProductItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name || '',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'adet',
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        discount_rate: item.discount_rate,
        total_price: item.total_price,
        currency: item.currency || 'TRY',
      }));

      // Defaults oluştur
      const defaults = {
        estimated_duration: data.estimated_duration,
        default_location: data.default_location,
        default_technician_id: data.default_technician_id,
        service_type: undefined,
        service_priority: 'medium' as const,
      };

      const templateData: CreateServiceTemplateData = {
        name: data.name,
        description: data.description,
        service_details: {
          pdf_schema: pdfSchema,
          parts_list: partsList,
          estimated_duration: defaults.estimated_duration,
          default_location: defaults.default_location,
          default_technician_id: defaults.default_technician_id,
          service_priority: defaults.service_priority,
          service_type: defaults.service_type,
        },
      };
      return ServiceTemplateService.createTemplate(
        userData.company_id,
        userData.id,
        templateData
      );
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
      
      // Filter out empty product items
      const validProductItems = productItems.filter(item => 
        (item.name && item.name.trim()) || (item.description && item.description.trim())
      );

      // Mevcut pdf_schema'yı al veya default kullan
      const existingPdfSchema = existingTemplate?.service_details?.pdf_schema || defaultServiceTemplateSchema;
      
      // Tam pdf_schema yapısını oluştur (Flutter uyumlu)
      const pdfSchema: ServiceTemplateSchema = {
        ...defaultServiceTemplateSchema,
        ...existingPdfSchema,
        header: {
          ...defaultServiceTemplateSchema.header,
          ...existingPdfSchema.header,
          ...headerSettings,
        },
      };

      // Parts list'i Flutter formatına dönüştür
      const partsList = validProductItems.map(item => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name || '',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'adet',
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        discount_rate: item.discount_rate,
        total_price: item.total_price,
        currency: item.currency || 'TRY',
      }));

      // Defaults oluştur
      const defaults = {
        estimated_duration: data.estimated_duration,
        default_location: data.default_location,
        default_technician_id: data.default_technician_id,
        service_type: undefined,
        service_priority: 'medium' as const,
      };

      // Mevcut service_details'i al ve migrate et
      const currentServiceDetails = existingTemplate?.service_details || {};
      
      // Eski yapıdan yeni yapıya migrate et
      // Eğer parts_list root seviyede varsa, service_details'e taşı
      const existingPartsList = currentServiceDetails.parts_list || 
                                existingTemplate?.parts_list || 
                                [];
      
      // Mevcut parts_list ile yeni parts_list'i birleştir (yeni olanlar öncelikli)
      const finalPartsList = partsList.length > 0 ? partsList : existingPartsList;
      
      // Eğer defaults root seviyede varsa, service_details'e taşı
      const migratedDefaults = {
        estimated_duration: defaults.estimated_duration ?? 
                           currentServiceDetails.estimated_duration ?? 
                           existingTemplate?.estimated_duration ?? 
                           undefined,
        default_location: defaults.default_location ?? 
                         currentServiceDetails.default_location ?? 
                         existingTemplate?.default_location ?? 
                         undefined,
        default_technician_id: defaults.default_technician_id ?? 
                             currentServiceDetails.default_technician_id ?? 
                             existingTemplate?.default_technician_id ?? 
                             undefined,
        service_type: currentServiceDetails.service_type ?? 
                     existingTemplate?.service_type ?? 
                     undefined,
        service_priority: defaults.service_priority ?? 
                         currentServiceDetails.service_priority ?? 
                         existingTemplate?.service_priority ?? 
                         'medium' as const,
      };
      
      const templateData: Partial<CreateServiceTemplateData> = {
        name: data.name,
        description: data.description,
        service_details: {
          ...currentServiceDetails,
          pdf_schema: pdfSchema,
          parts_list: finalPartsList,
          ...migratedDefaults,
        },
      };
      return ServiceTemplateService.updateTemplate(id, templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-templates'] });
      queryClient.invalidateQueries({ queryKey: ['service-template', id] });
      toast.success('Servis şablonu başarıyla güncellendi');
      navigate('/pdf-templates');
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


  return (
    <div className="space-y-2">
      {/* Enhanced Sticky Header */}
      <div className="sticky top-0 z-20 bg-white rounded-md border border-gray-200 shadow-sm mb-2">
        <div className="flex items-center justify-between p-3 pl-12 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BackButton 
              onClick={() => navigate('/pdf-templates')}
              variant="ghost"
              size="sm"
            >
              Şablonlar
            </BackButton>
            
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {isNew ? 'Yeni Servis Şablonu' : 'Servis Şablonu Düzenle'}
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  {isNew ? 'Yeni servis şablonu oluşturun' : 'Servis şablonunu düzenleyin'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? (isNew ? 'Oluşturuluyor...' : 'Güncelleniyor...') : (isNew ? 'Oluştur' : 'Kaydet')}</span>
            </Button>
          </div>
        </div>

        {/* Başlık Ayarları - Üstte */}
        <div className="p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs">📄</span>
            <Label className="text-xs font-semibold text-gray-800">Başlık Ayarları</Label>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Title Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">T</span>
                  <Label className="text-xs font-semibold text-gray-800">Başlık</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="show-title"
                    checked={headerSettings.showTitle}
                    onCheckedChange={(checked) => setHeaderSettings(prev => ({ ...prev, showTitle: checked }))}
                    className="scale-[0.65]"
                  />
                  <Label htmlFor="show-title" className="text-xs text-gray-600">Göster</Label>
                </div>
              </div>
              {headerSettings.showTitle && (
                <div className="bg-white/80 border border-gray-200 rounded-md p-2 space-y-2">
                  <div>
                    <Label className="text-xs text-gray-600 mb-0.5 block">Başlık Metni</Label>
                    <Input 
                      value={headerSettings.title}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, title: e.target.value }))}
                      className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                      placeholder="Başlık metnini girin"
                    />
                  </div>
                  <div className="pt-1 border-t border-gray-200 flex items-center gap-2">
                    <Label className="text-xs text-gray-600 min-w-fit">Font</Label>
                    <Input
                      type="number"
                      value={headerSettings.titleFontSize}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, titleFontSize: Number(e.target.value) }))}
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
              logoUrl={headerSettings.logoUrl}
              onLogoChange={(url) => setHeaderSettings(prev => ({ ...prev, logoUrl: url || undefined }))}
              logoPosition={headerSettings.logoPosition}
              onPositionChange={(value) => setHeaderSettings(prev => ({ ...prev, logoPosition: value }))}
              logoSize={headerSettings.logoSize}
              onSizeChange={(value) => setHeaderSettings(prev => ({ ...prev, logoSize: value }))}
              showLogo={headerSettings.showLogo}
              onShowLogoChange={(value) => setHeaderSettings(prev => ({ ...prev, showLogo: value }))}
            />
          </div>
          
          {/* Company Info Settings */}
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">🏢</span>
                <Label className="text-xs font-semibold text-gray-800">Şirket Bilgileri</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch
                  id="show-company-info"
                  checked={headerSettings.showCompanyInfo}
                  onCheckedChange={(checked) => setHeaderSettings(prev => ({ ...prev, showCompanyInfo: checked }))}
                  className="scale-75"
                />
                <Label htmlFor="show-company-info" className="text-xs text-gray-600">Göster</Label>
              </div>
            </div>

            {headerSettings.showCompanyInfo && (
              <div className="bg-white/80 border border-gray-200 rounded-md p-2 space-y-2">
                <div className="p-1 bg-blue-50/80 border border-blue-200/50 rounded text-xs text-blue-700 flex items-center gap-1">
                  <span>💡</span>
                  <span>Sistem Ayarları'ndan otomatik yüklenir</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <Label className="text-xs text-gray-600 mb-0.5 block">Şirket Adı</Label>
                    <Input 
                      value={headerSettings.companyName}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Şirket adı" 
                      className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-0.5 block">Font</Label>
                    <Input
                      type="number"
                      value={headerSettings.companyInfoFontSize}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, companyInfoFontSize: Number(e.target.value) }))}
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
                    value={headerSettings.companyAddress}
                    onChange={(e) => setHeaderSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                    placeholder="Şirket adresi" 
                    className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600 mb-0.5 block">Telefon</Label>
                    <Input 
                      value={headerSettings.companyPhone}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                      placeholder="Telefon" 
                      className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-0.5 block">E-posta</Label>
                    <Input 
                      value={headerSettings.companyEmail}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                      placeholder="E-posta" 
                      className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600 mb-0.5 block">Website</Label>
                    <Input 
                      value={headerSettings.companyWebsite}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, companyWebsite: e.target.value }))}
                      placeholder="Website" 
                      className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-0.5 block">Diğer</Label>
                    <Input 
                      value={headerSettings.companyTaxNumber}
                      onChange={(e) => setHeaderSettings(prev => ({ ...prev, companyTaxNumber: e.target.value }))}
                      placeholder="İstediğiniz metni yazın" 
                      className="h-7 text-xs placeholder:text-gray-400 placeholder:italic" 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Kart bazlı yapı */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1 - Genel Bilgiler */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              Genel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 px-3 pb-3">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-1.5 block">
                Şablon Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: Bakım Şablonu, Onarım Şablonu..."
                className="h-8 text-xs"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-1.5 block">
                Açıklama
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Bu şablonun ne için kullanıldığını açıklayın..."
                className="resize-none text-xs"
                rows={3}
                disabled={isLoading}
              />
            </div>
          </CardContent>
        </Card>


        {/* Row 3 - Ürün/Hizmet Listesi */}
        <ProductServiceCard
          items={productItems}
          onAddItem={addProductItem}
          onRemoveItem={removeProductItem}
          onItemChange={handleProductItemChange}
          onProductModalSelect={handleProductModalSelect}
          showMoveButtons={false}
          inputHeight="h-10"
        />

        {/* Row 4 - Varsayılan Değerler */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              Varsayılan Değerler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 px-3 pb-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="estimated_duration" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Tahmini Süre (dakika)
                </Label>
                <Input
                  id="estimated_duration"
                  type="number"
                  {...register('estimated_duration', { valueAsNumber: true })}
                  placeholder="Örn: 60"
                  className="h-8 text-xs"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_location" className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-500" />
                  Varsayılan Konum
                </Label>
                <Input
                  id="default_location"
                  {...register('default_location')}
                  placeholder="Varsayılan servis konumu"
                  className="h-8 text-xs"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_technician_id" className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-1">
                <User className="w-3 h-3 text-blue-500" />
                Varsayılan Teknisyen
              </Label>
              <Select
                value={watch('default_technician_id') || undefined}
                onValueChange={(value) => setValue('default_technician_id', value || undefined)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Teknisyen seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  {technicians && technicians.length > 0 ? (
                    technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.first_name} {tech.last_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-technicians" disabled>
                      Teknisyen bulunamadı
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
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
          onAddToProposal={(productData) => handleAddProductToItems(productData, editingItemIndex)}
          currency="TRY"
          existingData={editingItemData}
        />
      </form>
    </div>
  );
}
