import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
}

interface CreditCardFormData {
  card_name: string;
  bank_name: string;
  card_number: string;
  card_type: string;
  expiry_date: string;
  credit_limit: string;
  currency: string;
  notes: string;
}

const CreditCardModal = ({ isOpen, onClose, onSuccess }: CreditCardModalProps) => {
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

  const handleInputChange = (field: keyof CreditCardFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    // 4'lü gruplar halinde formatla
    return numbers.replace(/(.{4})/g, '$1-').slice(0, -1);
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

      const { error } = await supabase
        .from('credit_cards')
        .insert({
          card_name: formData.card_name.trim(),
          bank_name: formData.bank_name.trim(),
          card_number: formData.card_number.replace(/-/g, '') || null,
          card_type: formData.card_type,
          expiry_date: formData.expiry_date || null,
          credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
          currency: formData.currency,
          notes: formData.notes.trim() || null,
          company_id: profile.company_id
        });

      if (error) throw error;

      toast.success("Kredi kartı oluşturuldu");

      onSuccess();
      onClose();
      setFormData({
        card_name: "",
        bank_name: "",
        card_number: "",
        card_type: "credit",
        expiry_date: "",
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Kredi Kartı</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card_name">Kart Adı *</Label>
              <Input
                id="card_name"
                value={formData.card_name}
                onChange={(e) => handleInputChange('card_name', e.target.value)}
                placeholder="Örn: İş Bankası Kredi Kartı"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">Banka Adı *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                placeholder="Örn: Türkiye İş Bankası"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card_number">Kart Numarası</Label>
            <Input
              id="card_number"
              value={formData.card_number}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              placeholder="1234-5678-9012-3456"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="card_type">Kart Türü</Label>
              <Select value={formData.card_type} onValueChange={(value) => handleInputChange('card_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Kredi Kartı</SelectItem>
                  <SelectItem value="debit">Banka Kartı</SelectItem>
                  <SelectItem value="corporate">Kurumsal Kart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">Son Kullanma Tarihi</Label>
              <Input
                id="expiry_date"
                type="month"
                value={formData.expiry_date}
                onChange={(e) => handleInputChange('expiry_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Kredi Limiti</Label>
              <Input
                id="credit_limit"
                type="number"
                value={formData.credit_limit}
                onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                <SelectTrigger>
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
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Kart hakkında notlar"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              İptal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreditCardModal;
