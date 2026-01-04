import { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CashExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
  accountName: string;
  currency: string;
}

interface ExpenseFormData {
  amount: number;
  description: string;
  category: string;
  reference: string;
  transaction_date: Date | null;
}

const CashExpenseModal = ({ isOpen, onClose, onSuccess, accountId, accountName, currency }: CashExpenseModalProps) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
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
        .select('id, name')
        .eq('company_id', profile.company_id)
        .eq('type', 'expense')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string | number | Date | null) => {
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
          type: 'expense',
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
        p_type: 'expense'
      });

      if (balanceError) throw balanceError;

      toast.success("Masraf işlemi eklendi");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error("Masraf işlemi eklenirken hata oluştu");
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
      onClose={onClose}
      onClosed={resetForm}
      title={`Masraf Ekle - ${accountName}`}
      maxWidth="lg"
      headerColor="red"
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

            <UnifiedDatePicker
              label="Tarih"
              date={formData.transaction_date}
              onSelect={(date) => handleInputChange('transaction_date', date)}
              placeholder="Tarih seçin"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Masraf açıklaması giriniz"
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
          <UnifiedDialogCancelButton onClick={onClose} disabled={isLoading} />
          <UnifiedDialogActionButton
            type="submit"
            variant="destructive"
            disabled={isLoading}
            loading={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            Masraf Ekle
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default CashExpenseModal;
