import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ServiceTemplateService, CreateServiceTemplateData } from '@/services/serviceTemplateService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { supabase } from '@/integrations/supabase/client';

const serviceTemplateSchema = z.object({
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

type ServiceTemplateFormData = z.infer<typeof serviceTemplateSchema>;

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
      service_title: '',
      service_request_description: '',
      service_type: '',
      service_priority: 'medium',
      estimated_duration: undefined,
      default_location: '',
      default_technician_id: '',
    },
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
        .eq('company_id', userData.company_id)
        .eq('status', 'aktif')
        .order('first_name');
      if (error) {
        console.error('Error fetching technicians:', error);
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
        service_title: existingTemplate.service_title || '',
        service_request_description: existingTemplate.service_request_description || '',
        service_type: existingTemplate.service_type || '',
        service_priority: existingTemplate.service_priority || 'medium',
        estimated_duration: existingTemplate.estimated_duration || undefined,
        default_location: existingTemplate.default_location || '',
        default_technician_id: existingTemplate.default_technician_id || '',
      });
    }
  }, [existingTemplate, reset]);

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
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/pdf-templates')}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? 'Yeni Servis Şablonu' : 'Servis Şablonu Düzenle'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Genel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Şablon Adı *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Örn: Bakım Şablonu"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Şablon hakkında açıklama"
                disabled={isLoading}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Servis Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service_title">Servis Başlığı *</Label>
              <Input
                id="service_title"
                {...register('service_title')}
                placeholder="Örn: Yıllık Bakım"
                disabled={isLoading}
              />
              {errors.service_title && (
                <p className="text-sm text-red-500">{errors.service_title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_request_description">Servis Açıklaması</Label>
              <Textarea
                id="service_request_description"
                {...register('service_request_description')}
                placeholder="Servis talebi detayları"
                disabled={isLoading}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Servis Tipi</Label>
                <Input
                  id="service_type"
                  {...register('service_type')}
                  placeholder="Örn: Bakım, Onarım"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_priority">Öncelik</Label>
                <Select
                  value={watch('service_priority')}
                  onValueChange={(value) => setValue('service_priority', value as any)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Öncelik seçin" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_duration">Tahmini Süre (dakika)</Label>
                <Input
                  id="estimated_duration"
                  type="number"
                  {...register('estimated_duration', { valueAsNumber: true })}
                  placeholder="Örn: 60"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_location">Varsayılan Konum</Label>
                <Input
                  id="default_location"
                  {...register('default_location')}
                  placeholder="Varsayılan servis konumu"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_technician_id">Varsayılan Teknisyen</Label>
              <Select
                value={watch('default_technician_id') || undefined}
                onValueChange={(value) => setValue('default_technician_id', value || undefined)}
                disabled={isLoading}
              >
                <SelectTrigger>
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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/pdf-templates')}
            disabled={isLoading}
          >
            İptal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isNew ? 'Oluşturuluyor...' : 'Güncelleniyor...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNew ? 'Oluştur' : 'Kaydet'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
