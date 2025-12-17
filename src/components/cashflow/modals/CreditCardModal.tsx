import { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogCancelButton, UnifiedDialogActionButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  cardId?: string;
}

interface CreditCardFormData {
  card_name: string;
  bank_name: string;
  card_number: string;
  card_type: string;
  expiry_date: string;
  expiry_date_date?: Date;
  credit_limit: string;
  currency: string;
  notes: string;
}

const CreditCardModal = ({ isOpen, onClose, onSuccess, mode = 'create', cardId }: CreditCardModalProps) => {
  const [formData, setFormData] = useState<CreditCardFormData>({
    card_name: "",
    bank_name: "",
    card_number: "",
    card_type: "credit",
    expiry_date: "",
    credit_limit: "",
    currency: "TRY",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);

  const formatCardNumber = (value: string) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    // 4'lü gruplar halinde formatla
    return numbers.replace(/(.{4})/g, '$1-').slice(0, -1);
  };

  // Edit modunda formu Supabase'den doldur
  useEffect(() => {
    const prefill = async () => {
      if (!isOpen || mode !== 'edit' || !cardId) return;
      setIsPrefilling(true);
      try {
        const { data, error } = await supabase
          .from('credit_cards')
          .select('card_name, bank_name, card_number, card_type, expiry_date, credit_limit, currency, notes')
          .eq('id', cardId)
          .single();

        if (error) throw error;
        if (data) {
          const expiryDate = data.expiry_date ? new Date(data.expiry_date + '-01') : undefined;
          setFormData({
            card_name: data.card_name || "",
            bank_name: data.bank_name || "",
            card_number: data.card_number ? formatCardNumber(data.card_number) : "",
            card_type: data.card_type || 'credit',
            expiry_date: data.expiry_date || "",
            expiry_date_date: expiryDate,
            credit_limit: data.credit_limit ? String(data.credit_limit) : "",
            currency: data.currency || 'TRY',
            notes: data.notes || ""
          });
        }
      } catch (e) {
        console.error('Error pre-filling credit card:', e);
        toast.error("Kart bilgileri yüklenirken hata oluştu");
      } finally {
        setIsPrefilling(false);
      }
    };
    prefill();
  }, [isOpen, mode, cardId]);

  const handleInputChange = (field: keyof CreditCardFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    handleInputChange('card_number', formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.card_name.trim() || !formData.bank_name.trim()) {
      toast.error("Kart adı ve banka adı zorunludur");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      // Company ID'yi al
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const creditLimit = formData.credit_limit ? parseFloat(formData.credit_limit) : 0;
      
      if (mode === 'edit' && cardId) {
        const { error } = await supabase
          .from('credit_cards')
          .update({
            card_name: formData.card_name.trim(),
            bank_name: formData.bank_name.trim(),
            card_number: formData.card_number.replace(/-/g, '') || null,
            card_type: formData.card_type,
            expiry_date: formData.expiry_date || null,
            credit_limit: creditLimit > 0 ? creditLimit : null,
            currency: formData.currency,
            notes: formData.notes.trim() || null
          })
          .eq('id', cardId);

        if (error) throw error;
        toast.success("Kredi kartı güncellendi");
      } else {
        const { error } = await supabase
          .from('credit_cards')
          .insert({
            card_name: formData.card_name.trim(),
            bank_name: formData.bank_name.trim(),
            card_number: formData.card_number.replace(/-/g, '') || null,
            card_type: formData.card_type,
            expiry_date: formData.expiry_date || null,
            credit_limit: creditLimit > 0 ? creditLimit : null,
            available_limit: creditLimit > 0 ? creditLimit : null,
            current_balance: 0,
            currency: formData.currency,
            notes: formData.notes.trim() || null,
            company_id: profile.company_id
          });

        if (error) throw error;
        toast.success("Kredi kartı oluşturuldu");
      }

      onSuccess();
      onClose();
      setFormData({
        card_name: "",
        bank_name: "",
        card_number: "",
        card_type: "credit",
        expiry_date: "",
        expiry_date_date: undefined,
        credit_limit: "",
        currency: "TRY",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating credit card:', error);
      toast.error("Kredi kartı oluşturulurken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? "Kredi Kartını Düzenle" : "Yeni Kredi Kartı"}
      maxWidth="md"
      headerColor="purple"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="card_name" className="text-sm font-medium text-gray-700">
              Kart Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="card_name"
              value={formData.card_name}
              onChange={(e) => handleInputChange('card_name', e.target.value)}
              placeholder="Örn: İş Bankası Kredi Kartı"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name" className="text-sm font-medium text-gray-700">
              Banka Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              placeholder="Örn: Türkiye İş Bankası"
              required
              className="h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="card_number" className="text-sm font-medium text-gray-700">Kart Numarası</Label>
          <Input
            id="card_number"
            value={formData.card_number}
            onChange={(e) => handleCardNumberChange(e.target.value)}
            placeholder="1234-5678-9012-3456"
            maxLength={19}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="card_type" className="text-sm font-medium text-gray-700">Kart Türü</Label>
            <Select value={formData.card_type} onValueChange={(value) => handleInputChange('card_type', value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Kredi Kartı</SelectItem>
                <SelectItem value="debit">Banka Kartı</SelectItem>
                <SelectItem value="corporate">Kurumsal Kart</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <UnifiedDatePicker
            label="Son Kullanma Tarihi"
            date={formData.expiry_date_date}
            onSelect={(date) => {
              if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                handleInputChange('expiry_date', `${year}-${month}`);
                setFormData(prev => ({ ...prev, expiry_date_date: date }));
              } else {
                handleInputChange('expiry_date', '');
                setFormData(prev => ({ ...prev, expiry_date_date: undefined }));
              }
            }}
            placeholder="Son kullanma tarihi seçin"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="credit_limit" className="text-sm font-medium text-gray-700">Kredi Limiti</Label>
            <Input
              id="credit_limit"
              type="number"
              value={formData.credit_limit}
              onChange={(e) => handleInputChange('credit_limit', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-medium text-gray-700">Para Birimi</Label>
            <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notlar</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Kart hakkında notlar"
            rows={3}
            className="resize-none"
          />
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose} disabled={isLoading} />
          <UnifiedDialogActionButton
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
            disabled={isLoading || isPrefilling}
            loading={isLoading || isPrefilling}
            variant="primary"
          >
            {mode === 'edit' ? 'Kaydet' : 'Oluştur'}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default CreditCardModal;
