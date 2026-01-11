import { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { sortCategoriesByOrder } from "@/utils/categorySort";

interface CashIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
  accountName: string;
  currency: string;
}

interface IncomeFormData {
  amount: number;
  description: string;
  category: string;
  reference: string;
  transaction_date: Date | null;
}

const CashIncomeModal = ({ isOpen, onClose, onSuccess, accountId, accountName, currency }: CashIncomeModalProps) => {
  const [formData, setFormData] = useState<IncomeFormData>({
    amount: 0,
    description: "",
    category: "",
    reference: "",
    transaction_date: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('id, name, is_default')
        .eq('company_id', profile.company_id)
        .eq('type', 'income');

      if (error) throw error;
      
      // Kategorileri belirli sıraya göre sırala
      const sorted = sortCategoriesByOrder(data || [], 'income');
      setCategories(sorted.map(cat => ({ id: cat.id, name: cat.name })));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (field: keyof IncomeFormData, value: string | number | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      toast.error("Geçerli bir tutar giriniz");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Açıklama zorunludur");
      return;
    }

    if (!formData.transaction_date) {
      toast.error("Tarih seçiniz");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      // İşlemi ekle
      const { data: transactionData, error: transactionError } = await supabase
        .from('cash_transactions')
        .insert({
          account_id: accountId,
          amount: formData.amount,
          type: 'income',
          description: formData.description.trim(),
          category: formData.category || null,
          reference: formData.reference.trim() || null,
          transaction_date: formData.transaction_date.toISOString(),
          company_id: profile.company_id
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Audit log ekle
      if (transactionData?.id) {
        await supabase.from('audit_logs').insert({
          entity_type: 'cash_transactions',
          entity_id: transactionData.id,
          action: 'create',
          user_id: user.id,
          company_id: profile.company_id
        });
      }

      // Hesap bakiyesini güncelle
      const { error: balanceError } = await supabase.rpc('update_cash_account_balance', {
        p_account_id: accountId,
        p_amount: formData.amount,
        p_type: 'income'
      });

      if (balanceError) throw balanceError;

      toast.success("Gelir işlemi eklendi");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error("Gelir işlemi eklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: 0,
      description: "",
      category: "",
      reference: "",
      transaction_date: new Date()
    });
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={(open) => !open && onClose()}
      onClosed={resetForm}
      title={`Gelir Ekle - ${accountName}`}
      headerColor="green"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar *</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pr-8"
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  {currency}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">Tarih *</Label>
              <DatePicker
                date={formData.transaction_date}
                onSelect={(date) => handleInputChange('transaction_date', date)}
                placeholder="Tarih seçin"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Gelir açıklaması giriniz"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referans</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Referans numarası"
              />
            </div>
          </div>

          <UnifiedDialogFooter>
            <UnifiedDialogCancelButton onClick={onClose} disabled={isLoading}>
              İptal
            </UnifiedDialogCancelButton>
            <UnifiedDialogActionButton type="submit" disabled={isLoading}>
              {isLoading ? "Ekleniyor..." : "Gelir Ekle"}
            </UnifiedDialogActionButton>
          </UnifiedDialogFooter>
        </form>
    </UnifiedDialog>
  );
};

export default CashIncomeModal;
