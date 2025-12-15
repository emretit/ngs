import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { ReturnType, ReturnReason, returnTypeLabels, returnReasonLabels } from "@/types/returns";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ReturnFormProps {
  open: boolean;
  onClose: () => void;
  orderId?: string;
}

interface ReturnItemInput {
  id: string;
  product_name: string;
  return_quantity: number;
  unit: string;
  condition: string;
  notes: string;
}

const ReturnForm = ({ open, onClose, orderId }: ReturnFormProps) => {
  const queryClient = useQueryClient();
  const { companyId } = useCurrentCompany();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string; company?: string }[]>([]);
  const [items, setItems] = useState<ReturnItemInput[]>([
    { id: '1', product_name: '', return_quantity: 1, unit: 'adet', condition: 'new', notes: '' }
  ]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      customer_id: '',
      return_type: 'product_return' as ReturnType,
      return_reason: 'defective' as ReturnReason,
      reason_description: '',
      refund_amount: 0,
      currency: 'TRY',
      notes: ''
    }
  });

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company')
        .order('name');
      
      if (!error && data) {
        setCustomers(data);
      }
    };
    
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), product_name: '', return_quantity: 1, unit: 'adet', condition: 'new', notes: '' }
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ReturnItemInput, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const onSubmit = async (data: any) => {
    if (!companyId) {
      toast.error('Şirket bilgisi bulunamadı');
      return;
    }

    if (!data.customer_id) {
      toast.error('Lütfen bir müşteri seçin');
      return;
    }

    const validItems = items.filter(item => item.product_name.trim());
    if (validItems.length === 0) {
      toast.error('En az bir ürün ekleyin');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate return number
      const { data: returnNumber, error: numberError } = await supabase
        .rpc('generate_return_number', { p_company_id: companyId });

      if (numberError) throw numberError;

      // Create return
      const { data: newReturn, error: returnError } = await supabase
        .from('returns')
        .insert({
          company_id: companyId,
          return_number: returnNumber,
          customer_id: data.customer_id,
          order_id: orderId || null,
          return_type: data.return_type,
          return_reason: data.return_reason,
          reason_description: data.reason_description || null,
          refund_amount: data.refund_amount || 0,
          currency: data.currency,
          notes: data.notes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items
      const itemsToInsert = validItems.map(item => ({
        return_id: newReturn.id,
        product_name: item.product_name,
        return_quantity: item.return_quantity,
        unit: item.unit,
        condition: item.condition,
        original_quantity: item.return_quantity,
        item_status: 'pending'
      }));

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('İade talebi başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      reset();
      setItems([{ id: '1', product_name: '', return_quantity: 1, unit: 'adet', condition: 'new', notes: '' }]);
      onClose();
    } catch (error: any) {
      console.error('Error creating return:', error);
      toast.error(error.message || 'İade oluşturulurken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni İade Talebi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Müşteri Seçimi */}
          <div className="space-y-2">
            <Label>Müşteri *</Label>
            <Select onValueChange={(value) => setValue('customer_id', value)}>
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

          <div className="grid grid-cols-2 gap-4">
            {/* İade Türü */}
            <div className="space-y-2">
              <Label>İade Türü *</Label>
              <Select 
                defaultValue="product_return"
                onValueChange={(value) => setValue('return_type', value as ReturnType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(returnTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* İade Nedeni */}
            <div className="space-y-2">
              <Label>İade Nedeni *</Label>
              <Select 
                defaultValue="defective"
                onValueChange={(value) => setValue('return_reason', value as ReturnReason)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(returnReasonLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Neden Açıklaması */}
          <div className="space-y-2">
            <Label>Neden Açıklaması</Label>
            <Textarea 
              {...register('reason_description')}
              placeholder="İade nedenini detaylı açıklayın..."
              rows={2}
            />
          </div>

          {/* İade Tutarı */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>İade Tutarı</Label>
              <Input 
                type="number"
                step="0.01"
                {...register('refund_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select 
                defaultValue="TRY"
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ürünler */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>İade Edilecek Ürünler</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" /> Ürün Ekle
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2 p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <Input
                        placeholder="Ürün adı"
                        value={item.product_name}
                        onChange={(e) => updateItem(item.id, 'product_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Miktar"
                        value={item.return_quantity}
                        onChange={(e) => updateItem(item.id, 'return_quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Select 
                        value={item.condition}
                        onValueChange={(value) => updateItem(item.id, 'condition', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Yeni</SelectItem>
                          <SelectItem value="damaged">Hasarlı</SelectItem>
                          <SelectItem value="defective">Defolu</SelectItem>
                          <SelectItem value="used">Kullanılmış</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notlar */}
          <div className="space-y-2">
            <Label>Notlar</Label>
            <Textarea 
              {...register('notes')}
              placeholder="Ek notlar..."
              rows={2}
            />
          </div>

          {/* Butonlar */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              İade Oluştur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnForm;
