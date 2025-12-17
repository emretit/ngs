import { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogCancelButton, UnifiedDialogActionButton } from "@/components/ui/unified-dialog";
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
  mode?: 'create' | 'edit';
  accountId?: string;
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
  initial_balance: number;
  notes: string;
}

const BankAccountModal = ({ isOpen, onClose, onSuccess, mode = 'create', accountId }: BankAccountModalProps) => {
  const [formData, setFormData] = useState<BankAccountFormData>({
    account_name: "",
    bank_name: "",
    branch_name: "",
    account_number: "",
    iban: "",
    swift_code: "",
    account_type: "vadesiz",
    currency: "TRY",
    initial_balance: 0,
    notes: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);

  // Edit modunda formu Supabase'den doldur
  useEffect(() => {
    const prefill = async () => {
      if (!isOpen || mode !== 'edit' || !accountId) return;
      setIsPrefilling(true);
      try {
        const { data, error } = await supabase
          .from('bank_accounts')
          .select('account_name, bank_name, branch_name, account_number, iban, swift_code, account_type, currency, notes')
          .eq('id', accountId)
          .single();

        if (error) throw error;
        if (data) {
          setFormData({
            account_name: data.account_name || "",
            bank_name: data.bank_name || "",
            branch_name: data.branch_name || "",
            account_number: data.account_number || "",
            iban: data.iban || "",
            swift_code: data.swift_code || "",
            account_type: data.account_type || 'vadesiz',
            currency: data.currency || 'TRY',
            initial_balance: 0,
            notes: data.notes || ""
          });
        }
      } catch (e) {
        console.error('Error pre-filling bank account:', e);
        toast.error("Hesap bilgileri yüklenirken hata oluştu");
      } finally {
        setIsPrefilling(false);
      }
    };
    prefill();
  }, [isOpen, mode, accountId]);

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

      if (mode === 'edit' && accountId) {
        const { error } = await supabase
          .from('bank_accounts')
          .update({
            account_name: formData.account_name.trim(),
            bank_name: formData.bank_name.trim(),
            branch_name: formData.branch_name.trim() || null,
            account_number: formData.account_number.trim() || null,
            iban: formData.iban.trim() || null,
            swift_code: formData.swift_code.trim() || null,
            account_type: formData.account_type,
            currency: formData.currency,
            notes: formData.notes.trim() || null
          })
          .eq('id', accountId);

        if (error) throw error;
        toast.success("Banka hesabı güncellendi");
      } else {
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
            current_balance: formData.initial_balance,
            available_balance: formData.initial_balance,
            notes: formData.notes.trim() || null,
            company_id: profile.company_id
          });

        if (error) throw error;
        toast.success("Banka hesabı oluşturuldu");
      }

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
        initial_balance: 0,
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
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'edit' ? "Banka Hesabını Düzenle" : "Yeni Banka Hesabı"}
      maxWidth="lg"
      headerColor="blue"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account_name" className="text-sm font-medium text-gray-700">
              Hesap Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="account_name"
              value={formData.account_name}
              onChange={(e) => handleInputChange('account_name', e.target.value)}
              placeholder="Örn: Ana Hesap"
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="branch_name" className="text-sm font-medium text-gray-700">Şube Adı</Label>
            <Input
              id="branch_name"
              value={formData.branch_name}
              onChange={(e) => handleInputChange('branch_name', e.target.value)}
              placeholder="Şube adı"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_number" className="text-sm font-medium text-gray-700">Hesap Numarası</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={(e) => handleInputChange('account_number', e.target.value)}
              placeholder="Hesap numarası"
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="iban" className="text-sm font-medium text-gray-700">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => handleInputChange('iban', e.target.value)}
              placeholder="TR00 0000 0000 0000 0000 0000 00"
              maxLength={34}
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="swift_code" className="text-sm font-medium text-gray-700">SWIFT Kodu</Label>
            <Input
              id="swift_code"
              value={formData.swift_code}
              onChange={(e) => handleInputChange('swift_code', e.target.value)}
              placeholder="SWIFT kodu"
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="account_type" className="text-sm font-medium text-gray-700">Hesap Türü</Label>
            <Select value={formData.account_type} onValueChange={(value) => handleInputChange('account_type', value)}>
              <SelectTrigger className="h-9">
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

        {mode === 'create' && (
          <div className="space-y-2">
            <Label htmlFor="initial_balance" className="text-sm font-medium text-gray-700">Başlangıç Bakiyesi</Label>
            <Input
              id="initial_balance"
              type="number"
              step="0.01"
              value={formData.initial_balance}
              onChange={(e) => handleInputChange('initial_balance', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="h-9"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notlar</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Hesap hakkında notlar"
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

export default BankAccountModal;
