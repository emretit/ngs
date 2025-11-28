import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceWarranties, ServiceWarranty } from '@/hooks/useServiceWarranties';
import { ServiceEquipment } from '@/hooks/useServiceEquipment';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface WarrantyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warranty: ServiceWarranty | null;
  equipment: ServiceEquipment[];
}

export function WarrantyDialog({ open, onOpenChange, warranty, equipment }: WarrantyDialogProps) {
  const { userData } = useCurrentUser();
  const { createWarranty, updateWarranty } = useServiceWarranties();
  const isEdit = !!warranty;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      equipment_id: '',
      customer_id: '',
      warranty_type: 'manufacturer' as 'manufacturer' | 'extended' | 'service_contract',
      warranty_provider: '',
      warranty_number: '',
      start_date: '',
      end_date: '',
      coverage_description: '',
      terms_conditions: '',
      warranty_cost: '',
      support_phone: '',
      support_email: '',
      notes: '',
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company')
        .eq('company_id', userData.company_id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id && open,
  });

  useEffect(() => {
    if (warranty) {
      reset({
        equipment_id: warranty.equipment_id || '',
        customer_id: warranty.customer_id || '',
        warranty_type: warranty.warranty_type || 'manufacturer',
        warranty_provider: warranty.warranty_provider || '',
        warranty_number: warranty.warranty_number || '',
        start_date: warranty.start_date || '',
        end_date: warranty.end_date || '',
        coverage_description: warranty.coverage_description || '',
        terms_conditions: warranty.terms_conditions || '',
        warranty_cost: warranty.warranty_cost?.toString() || '',
        support_phone: warranty.support_phone || '',
        support_email: warranty.support_email || '',
        notes: warranty.notes || '',
      });
    } else {
      reset({
        equipment_id: '',
        customer_id: '',
        warranty_type: 'manufacturer',
        warranty_provider: '',
        warranty_number: '',
        start_date: '',
        end_date: '',
        coverage_description: '',
        terms_conditions: '',
        warranty_cost: '',
        support_phone: '',
        support_email: '',
        notes: '',
      });
    }
  }, [warranty, reset]);

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      warranty_cost: data.warranty_cost ? parseFloat(data.warranty_cost) : null,
      customer_id: data.customer_id || null,
    };

    if (isEdit) {
      await updateWarranty.mutateAsync({ id: warranty.id, ...payload });
    } else {
      await createWarranty.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Garanti Düzenle' : 'Yeni Garanti Ekle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="equipment_id">Cihaz *</Label>
              <Select value={watch('equipment_id')} onValueChange={(value) => setValue('equipment_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Cihaz seçin" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.equipment_name} {eq.brand && `- ${eq.brand}`} {eq.model && `(${eq.model})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.equipment_id && <span className="text-xs text-red-500">Bu alan zorunludur</span>}
            </div>

            <div className="col-span-2">
              <Label htmlFor="customer_id">Müşteri</Label>
              <Select value={watch('customer_id')} onValueChange={(value) => setValue('customer_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company || customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="warranty_type">Garanti Tipi *</Label>
              <Select value={watch('warranty_type')} onValueChange={(value) => setValue('warranty_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Üretici Garantisi</SelectItem>
                  <SelectItem value="extended">Uzatılmış Garanti</SelectItem>
                  <SelectItem value="service_contract">Servis Sözleşmesi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="warranty_provider">Garanti Sağlayıcı</Label>
              <Input id="warranty_provider" {...register('warranty_provider')} placeholder="Şirket adı" />
            </div>

            <div className="col-span-2">
              <Label htmlFor="warranty_number">Garanti Numarası</Label>
              <Input id="warranty_number" {...register('warranty_number')} placeholder="WAR-2024-001" />
            </div>

            <div>
              <Label htmlFor="start_date">Başlangıç Tarihi *</Label>
              <Input id="start_date" type="date" {...register('start_date', { required: true })} />
              {errors.start_date && <span className="text-xs text-red-500">Bu alan zorunludur</span>}
            </div>

            <div>
              <Label htmlFor="end_date">Bitiş Tarihi *</Label>
              <Input id="end_date" type="date" {...register('end_date', { required: true })} />
              {errors.end_date && <span className="text-xs text-red-500">Bu alan zorunludur</span>}
            </div>

            <div className="col-span-2">
              <Label htmlFor="coverage_description">Kapsam Açıklaması</Label>
              <Textarea
                id="coverage_description"
                {...register('coverage_description')}
                rows={2}
                placeholder="Garantinin neleri kapsadığını açıklayın..."
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="terms_conditions">Şartlar ve Koşullar</Label>
              <Textarea
                id="terms_conditions"
                {...register('terms_conditions')}
                rows={2}
                placeholder="Garanti şartları ve koşulları..."
              />
            </div>

            <div>
              <Label htmlFor="warranty_cost">Garanti Maliyeti</Label>
              <Input
                id="warranty_cost"
                type="number"
                step="0.01"
                {...register('warranty_cost')}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="support_phone">Destek Telefonu</Label>
              <Input
                id="support_phone"
                type="tel"
                {...register('support_phone')}
                placeholder="+90 xxx xxx xx xx"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="support_email">Destek E-posta</Label>
              <Input
                id="support_email"
                type="email"
                {...register('support_email')}
                placeholder="support@example.com"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea id="notes" {...register('notes')} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={createWarranty.isPending || updateWarranty.isPending}>
              {isEdit ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
