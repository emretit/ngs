import { useState, useRef } from "react";
import { logger } from '@/utils/logger';
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface CreditCardExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardId?: string;
  cardName?: string;
  accountId?: string;
  accountName?: string;
  currency: string;
}

interface ExpenseFormData {
  amount: number;
  description: string;
  transaction_date: Date | null;
}

const CreditCardExpenseModal = ({ isOpen, onClose, onSuccess, cardId, cardName, accountId, accountName, currency }: CreditCardExpenseModalProps) => {
  const effectiveCardId = cardId || accountId || '';
  const effectiveCardName = cardName || accountName || '';
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: 0,
    description: "",
    transaction_date: new Date()
  });
  const [isLoading, setIsLoading] = useState(false);

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

      // Kredi kartına harcama ekle
      const { error: transactionError } = await supabase
        .from('card_transactions')
        .insert({
          card_id: effectiveCardId,
          amount: formData.amount,
          transaction_type: 'purchase',
          description: formData.description,
          transaction_date: formData.transaction_date?.toISOString() || new Date().toISOString(),
          currency: currency,
          company_id: profile.company_id
        });

      if (transactionError) throw transactionError;

      // Kredi kartı bakiyesini güncelle
      const { error: balanceError } = await supabase.rpc('update_credit_card_balance', {
        card_id: effectiveCardId,
        amount: formData.amount,
        transaction_type: 'expense'
      });

      if (balanceError) throw balanceError;

      toast.success("Harcama işlemi eklendi");

      // Formu sıfırla
      setFormData({
        amount: 0,
        description: "",
        transaction_date: new Date()
      });

      onSuccess();
    } catch (error) {
      logger.error('Error adding expense:', error);
      toast.error("Harcama işlemi eklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div>
          <div className="text-lg font-semibold">Kredi Kartından Harcama Ekle</div>
          <div className="text-xs text-gray-600 font-normal mt-0.5">Kart: {effectiveCardName}</div>
        </div>
      }
      maxWidth="2xl"
      headerColor="red"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="description">Açıklama *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="İşlem açıklaması"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction_date">İşlem Tarihi</Label>
          <DatePicker
            date={formData.transaction_date}
            onSelect={(date) => handleInputChange('transaction_date', date)}
          />
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose} disabled={isLoading}>
            İptal
          </UnifiedDialogCancelButton>
          <UnifiedDialogActionButton
            type="submit"
            loading={isLoading}
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
          >
            Harcama Ekle
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default CreditCardExpenseModal;
