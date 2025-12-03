import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CreditCardExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cardId: string;
  cardName: string;
  currency: string;
}

interface ExpenseFormData {
  amount: number;
  description: string;
  category: string;
  reference: string;
  transaction_date: Date | null;
}

const CreditCardExpenseModal = ({ isOpen, onClose, onSuccess, cardId, cardName, currency }: CreditCardExpenseModalProps) => {
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
        .from('credit_card_transactions')
        .insert({
          card_id: cardId,
          amount: formData.amount,
          type: 'expense',
          description: formData.description,
          category: formData.category || 'Genel',
          reference: formData.reference,
          transaction_date: formData.transaction_date?.toISOString(),
          company_id: profile.company_id
        });

      if (transactionError) throw transactionError;

      // Kredi kartı bakiyesini güncelle
      const { error: balanceError } = await supabase.rpc('update_credit_card_balance', {
        card_id: cardId,
        amount: formData.amount,
        transaction_type: 'expense'
      });

      if (balanceError) throw balanceError;

      toast.success("Harcama işlemi eklendi");

      // Formu sıfırla
      setFormData({
        amount: 0,
        description: "",
        category: "",
        reference: "",
        transaction_date: new Date()
      });

      onSuccess();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error("Harcama işlemi eklenirken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Kredi Kartından Harcama Ekle</DialogTitle>
          <p className="text-sm text-gray-600">Kart: {cardName}</p>
        </DialogHeader>
        
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Ekleniyor..." : "Harcama Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreditCardExpenseModal;
