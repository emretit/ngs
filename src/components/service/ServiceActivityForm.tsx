
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ServiceActivityFormProps {
  serviceRequestId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  activity_type: string;
  description: string;
  location: string;
  labor_hours: number;
  materials_used: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
}

export function ServiceActivityForm({ serviceRequestId, onClose, onSuccess }: ServiceActivityFormProps) {
  const [materials, setMaterials] = useState<Array<{ name: string; quantity: number; unit: string }>>([]);
  const form = useForm<FormData>();

  const addMaterial = () => {
    setMaterials([...materials, { name: '', quantity: 0, unit: 'adet' }]);
  };

  const updateMaterial = (index: number, field: keyof typeof materials[0], value: string | number) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    setMaterials(updatedMaterials);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('service_activities')
        .insert({
          service_request_id: serviceRequestId,
          activity_type: data.activity_type,
          description: data.description,
          location: data.location,
          labor_hours: data.labor_hours,
          materials_used: materials,
          start_time: new Date().toISOString(),
          status: 'completed'
        });

      if (error) throw error;

      toast.success("Servis aktivitesi başarıyla kaydedildi");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Servis aktivitesi kayıt hatası:', error);
      toast.error("Servis aktivitesi kaydedilemedi");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="activity_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aktivite Tipi</FormLabel>
              <FormControl>
                <Input placeholder="Bakım, Onarım, vb." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yapılan İşlemler</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Yapılan işlemleri detaylı açıklayınız..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konum</FormLabel>
              <FormControl>
                <Input placeholder="Servis lokasyonu" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="labor_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Çalışma Süresi (Saat)</FormLabel>
              <FormControl>
                <Input type="number" min="0" step="0.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Kullanılan Malzemeler</FormLabel>
            <Button type="button" variant="outline" onClick={addMaterial}>
              Malzeme Ekle
            </Button>
          </div>
          
          {materials.map((material, index) => (
            <div key={index} className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Malzeme adı"
                value={material.name}
                onChange={(e) => updateMaterial(index, 'name', e.target.value)}
              />
              <Input
                type="number"
                min="0"
                placeholder="Miktar"
                value={material.quantity}
                onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value))}
              />
              <Input
                placeholder="Birim"
                value={material.unit}
                onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit">
            Kaydet
          </Button>
        </div>
      </form>
    </Form>
  );
}
