import { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BankIncomeModalProps {
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

const BankIncomeModal = ({ isOpen, onClose, onSuccess, accountId, accountName, currency }: BankIncomeModalProps) => {
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
        .select('id, name')
        .eq('company_id', profile.company_id)
        .eq('type', 'income')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
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
      toast.error("Açıklama alanı zorunludur");
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

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      // Banka hesabına gelir ekle
      const { data: transactionData, error: transactionError } = await supabase
        .from('bank_transactions')
        .insert({
          account_id: accountId,
          amount: formData.amount,
          type: 'income',
          description: formData.description,
          category: formData.category || 'Genel',
          reference: formData.reference,
          transaction_date: formData.transaction_date?.toISOString(),
          company_id: profile.company_id
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Audit log ekle
      if (transactionData?.id) {
        await supabase.from('audit_logs').insert({
          entity_type: 'bank_transactions',
          entity_id: transactionData.id,
          action: 'create',
          user_id: user.id,
          company_id: profile.company_id
        });
      }

      // Banka hesabı bakiyesini güncelle
      const { error: balanceError } = await supabase.rpc('update_bank_account_balance', {
        account_id: accountId,
        amount: formData.amount,
        transaction_type: 'income'
      });

      if (balanceError) throw balanceError;

      toast.success("Gelir işlemi eklendi");
      onSuccess();
    } catch (error) {
      console.error('Error adding income:', error);
      toast.error("Gelir işlemi eklenirken bir hata oluştu");
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
      title={`Banka Hesabına Gelir Ekle - ${accountName}`}
      headerColor="green"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Tutar ({currency}) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ""}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="İşlem açıklaması"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Referans</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Referans numarası"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_date">İşlem Tarihi</Label>
              <DatePicker
                date={formData.transaction_date}
                onSelect={(date) => handleInputChange('transaction_date', date)}
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

export default BankIncomeModal;
