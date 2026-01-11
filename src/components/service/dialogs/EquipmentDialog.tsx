import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceEquipment, ServiceEquipment } from '@/hooks/useServiceEquipment';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: ServiceEquipment | null;
}

export function EquipmentDialog({ open, onOpenChange, equipment }: EquipmentDialogProps) {
  const { userData } = useCurrentUser();
  const { createEquipment, updateEquipment } = useServiceEquipment();
  const isEdit = !!equipment;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      equipment_name: '',
      brand: '',
      model: '',
      serial_number: '',
      category: '',
      customer_id: '',
      purchase_date: '',
      purchase_price: '',
      supplier: '',
      status: 'active',
      condition: '',
      location: '',
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
        
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id && open,
  });

  useEffect(() => {
    if (equipment) {
      reset({
        equipment_name: equipment.equipment_name || '',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        category: equipment.category || '',
        customer_id: equipment.customer_id || '',
        purchase_date: equipment.purchase_date || '',
        purchase_price: equipment.purchase_price?.toString() || '',
        supplier: equipment.supplier || '',
        status: equipment.status || 'active',
        condition: equipment.condition || '',
        location: equipment.location || '',
        notes: equipment.notes || '',
      });
    } else {
      reset({
        equipment_name: '',
        brand: '',
        model: '',
        serial_number: '',
        category: '',
        customer_id: '',
        purchase_date: '',
        purchase_price: '',
        supplier: '',
        status: 'active',
        condition: '',
        location: '',
        notes: '',
      });
    }
  }, [equipment, reset]);

  const onSubmit = async (data: any) => {
    const payload = {
      ...data,
      purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
      customer_id: data.customer_id || null,
    };

    if (isEdit) {
      await updateEquipment.mutateAsync({ id: equipment.id, ...payload });
    } else {
      await createEquipment.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Cihaz Düzenle' : 'Yeni Cihaz Ekle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="equipment_name">Cihaz Adı *</Label>
              <Input id="equipment_name" {...register('equipment_name', { required: true })} />
              {errors.equipment_name && <span className="text-xs text-red-500">Bu alan zorunludur</span>}
            </div>

            <div>
              <Label htmlFor="brand">Marka</Label>
              <Input id="brand" {...register('brand')} />
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...register('model')} />
            </div>

            <div>
              <Label htmlFor="serial_number">Seri No</Label>
              <Input id="serial_number" {...register('serial_number')} />
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" placeholder="Bilgisayar, Yazıcı, Sunucu..." {...register('category')} />
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
              <Label htmlFor="purchase_date">Satın Alma Tarihi</Label>
              <Input id="purchase_date" type="date" {...register('purchase_date')} />
            </div>

            <div>
              <Label htmlFor="purchase_price">Satın Alma Fiyatı</Label>
              <Input id="purchase_price" type="number" step="0.01" {...register('purchase_price')} />
            </div>

            <div className="col-span-2">
              <Label htmlFor="supplier">Tedarikçi</Label>
              <Input id="supplier" {...register('supplier')} />
            </div>

            <div>
              <Label htmlFor="status">Durum</Label>
              <Select value={watch('status')} onValueChange={(value) => setValue('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="in_repair">Bakımda</SelectItem>
                  <SelectItem value="retired">Kullanım Dışı</SelectItem>
                  <SelectItem value="disposed">İmha Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition">Kondisyon</Label>
              <Select value={watch('condition')} onValueChange={(value) => setValue('condition', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Mükemmel</SelectItem>
                  <SelectItem value="good">İyi</SelectItem>
                  <SelectItem value="fair">Orta</SelectItem>
                  <SelectItem value="poor">Kötü</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="location">Konum</Label>
              <Input id="location" {...register('location')} placeholder="Ofis, Depo, vb." />
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
            <Button type="submit" disabled={createEquipment.isPending || updateEquipment.isPending}>
              {isEdit ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
