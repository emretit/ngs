import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface BankAccountFormData {
  account_name: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  iban: string;
  swift_code: string;
  account_type: string;
  currency: string;
  notes: string;
}

const BankAccountModal = ({ isOpen, onClose, onSuccess }: BankAccountModalProps) => {
  const [formData, setFormData] = useState<BankAccountFormData>({
    account_name: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    iban: "",
    swift_code: "",
    account_type: "vadesiz",
    currency: "TRY",
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof BankAccountFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_name.trim() || !formData.bank_name.trim()) {
      toast.error("Hesap adı ve banka adı zorunludur");
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
        .from('bank_accounts')
        .insert({
          account_name: formData.account_name.trim(),
          bank_name: formData.bank_name.trim(),
          branch_name: formData.branch_name.trim() || null,
          account_number: formData.account_number.trim() || null,
          iban: formData.iban.trim() || null,
          swift_code: formData.swift_code.trim() || null,
          account_type: formData.account_type,
          currency: formData.currency,
          notes: formData.notes.trim() || null,
          company_id: profile.company_id
        });

      if (error) throw error;

      toast.success("Banka hesabı oluşturuldu");

      onSuccess();
      onClose();
      setFormData({
        account_name: "",
        bank_name: "",
        branch_name: "",
        account_number: "",
        iban: "",
        swift_code: "",
        account_type: "vadesiz",
        currency: "TRY",
        notes: ""
      });
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast.error("Banka hesabı oluşturulurken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Banka Hesabı</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_name">Hesap Adı *</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => handleInputChange('account_name', e.target.value)}
                placeholder="Örn: Ana Hesap"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="branch_name">Şube Adı</Label>
              <Input
                id="branch_name"
                value={formData.branch_name}
                onChange={(e) => handleInputChange('branch_name', e.target.value)}
                placeholder="Şube adı"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Hesap Numarası</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => handleInputChange('account_number', e.target.value)}
                placeholder="Hesap numarası"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => handleInputChange('iban', e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                maxLength={34}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swift_code">SWIFT Kodu</Label>
              <Input
                id="swift_code"
                value={formData.swift_code}
                onChange={(e) => handleInputChange('swift_code', e.target.value)}
                placeholder="SWIFT kodu"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_type">Hesap Türü</Label>
              <Select value={formData.account_type} onValueChange={(value) => handleInputChange('account_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vadesiz">Vadesiz</SelectItem>
                  <SelectItem value="vadeli">Vadeli</SelectItem>
                  <SelectItem value="kredi">Kredi</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                </SelectContent>
              </Select>
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
              placeholder="Hesap hakkında notlar"
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

export default BankAccountModal;
