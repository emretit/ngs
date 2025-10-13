import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Save, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EInvoiceFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EInvoiceForm = ({ onClose, onSuccess }: EInvoiceFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invoice_number: '',
    supplier_name: '',
    supplier_tax_number: '',
    invoice_date: new Date(),
    due_date: undefined as Date | undefined,
    total_amount: 0,
    tax_amount: 0,
    currency: 'TRY',
    status: 'pending' as const,
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // First try to create invoice via Nilvera
      const { data: nilveraData, error: nilveraError } = await supabase.functions.invoke('nilvera-invoices', {
        body: { 
          action: 'create',
          invoice: {
            invoiceNumber: formData.invoice_number,
            supplierName: formData.supplier_name,
            supplierTaxNumber: formData.supplier_tax_number,
            invoiceDate: format(formData.invoice_date, 'yyyy-MM-dd'),
            dueDate: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
            totalAmount: formData.total_amount,
            taxAmount: formData.tax_amount,
            currency: formData.currency,
            description: formData.description
          }
        }
      });

      let nilveraId = null;
      if (!nilveraError && nilveraData?.success) {
        nilveraId = nilveraData.invoiceId;
      }

      // Save to local database
      const { error: dbError } = await supabase
        .from('einvoices')
        .insert({
          invoice_number: formData.invoice_number,
          supplier_name: formData.supplier_name,
          supplier_tax_number: formData.supplier_tax_number,
          invoice_date: format(formData.invoice_date, 'yyyy-MM-dd'),
          due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
          total_amount: formData.total_amount,
          paid_amount: 0,
          remaining_amount: formData.total_amount,
          tax_amount: formData.tax_amount,
          currency: formData.currency,
          status: formData.status,
          nilvera_id: nilveraId
        });

      if (dbError) throw dbError;

      toast.success('E-Fatura başarıyla oluşturuldu');
      onSuccess();
    } catch (error) {
      console.error('E-Fatura oluşturma hatası:', error);
      toast.error('E-Fatura oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni E-Fatura Ekle</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Fatura Numarası</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Tedarikçi Adı</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_tax_number">Vergi Numarası</Label>
              <Input
                id="supplier_tax_number"
                value={formData.supplier_tax_number}
                onChange={(e) => setFormData({ ...formData, supplier_tax_number: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Para Birimi</Label>
              <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fatura Tarihi</Label>
              <EnhancedDatePicker
                date={formData.invoice_date}
                onSelect={(date) => date && setFormData({ ...formData, invoice_date: date })}
                placeholder="Tarih seçin"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Son Ödeme Tarihi</Label>
              <EnhancedDatePicker
                date={formData.due_date}
                onSelect={(date) => setFormData({ ...formData, due_date: date })}
                placeholder="Seçin"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Toplam Tutar</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tax_amount">KDV Tutarı</Label>
              <Input
                id="tax_amount"
                type="number"
                step="0.01"
                value={formData.tax_amount}
                onChange={(e) => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Durum</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="paid">Ödendi</SelectItem>
                <SelectItem value="partially_paid">Kısmen Ödendi</SelectItem>
                <SelectItem value="overdue">Gecikmiş</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EInvoiceForm;