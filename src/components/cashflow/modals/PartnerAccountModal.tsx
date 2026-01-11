import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogCancelButton, UnifiedDialogActionButton, UnifiedDatePicker } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PartnerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  accountId?: string; // edit modunda kullanılacak
}

interface PartnerAccountFormData {
  partner_name: string;
  partner_type: string;
  ownership_percentage: string;
  initial_capital: string;
  currency: string;
  investment_date: string;
  investment_date_date?: Date;
}

const PartnerAccountModal = ({ isOpen, onClose, onSuccess, mode = 'create', accountId }: PartnerAccountModalProps) => {
  const [formData, setFormData] = useState<PartnerAccountFormData>({
    partner_name: "",
    partner_type: "ortak",
    ownership_percentage: "",
    initial_capital: "",
    currency: "TRY",
    investment_date: ""
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
          .from('partner_accounts')
          .select('partner_name, partner_type, ownership_percentage, initial_capital, currency, investment_date')
          .eq('id', accountId)
          .single();

        if (error) throw error;
        if (data) {
          const investmentDate = data.investment_date ? new Date(data.investment_date) : undefined;
          setFormData({
            partner_name: data.partner_name || "",
            partner_type: data.partner_type || 'ortak',
            ownership_percentage: data.ownership_percentage != null ? String(data.ownership_percentage) : "",
            initial_capital: data.initial_capital != null ? String(data.initial_capital) : "",
            currency: data.currency || 'TRY',
            investment_date: data.investment_date || "",
            investment_date_date: investmentDate,
          });
        }
      } catch (e) {
        logger.error('Error pre-filling partner account:', e);
      } finally {
        setIsPrefilling(false);
      }
    };
    prefill();
  }, [isOpen, mode, accountId]);

  const handleInputChange = (field: keyof PartnerAccountFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partner_name.trim()) {
      toast.error("Ortak adı zorunludur");
      return;
    }

    if (formData.ownership_percentage && (parseFloat(formData.ownership_percentage) < 0 || parseFloat(formData.ownership_percentage) > 100)) {
      toast.error("Hisse yüzdesi 0-100 arasında olmalıdır");
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
          .from('partner_accounts')
          .update({
            partner_name: formData.partner_name.trim(),
            partner_type: formData.partner_type,
            ownership_percentage: formData.ownership_percentage ? parseFloat(formData.ownership_percentage) : null,
            initial_capital: formData.initial_capital ? parseFloat(formData.initial_capital) : null,
            currency: formData.currency,
            investment_date: formData.investment_date || null,
          })
          .eq('id', accountId);

        if (error) throw error;
        toast.success('Ortak hesabı güncellendi');
      } else {
        const { error } = await supabase
          .from('partner_accounts')
          .insert({
            partner_name: formData.partner_name.trim(),
            partner_type: formData.partner_type,
            ownership_percentage: formData.ownership_percentage ? parseFloat(formData.ownership_percentage) : null,
            initial_capital: formData.initial_capital ? parseFloat(formData.initial_capital) : null,
            currency: formData.currency,
            investment_date: formData.investment_date || null,
            company_id: profile.company_id
          });

        if (error) throw error;
        toast.success('Ortak hesabı oluşturuldu');
      }

      onSuccess();
      onClose();
      setFormData({
        partner_name: "",
        partner_type: "ortak",
        ownership_percentage: "",
        initial_capital: "",
        currency: "TRY",
        investment_date: "",
        investment_date_date: undefined
      });
    } catch (error) {
      logger.error('Error creating partner account:', error);
      toast.error("Ortak hesabı oluşturulurken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      partner_name: "",
      partner_type: "ortak",
      ownership_percentage: "",
      initial_capital: "",
      currency: "TRY",
      investment_date: "",
      investment_date_date: undefined
    });
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      onClosed={resetForm}
      title={mode === 'edit' ? 'Ortak Hesabı Düzenle' : 'Yeni Ortak Hesabı'}
      maxWidth="md"
      headerColor="yellow"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="partner_name" className="text-sm font-medium text-gray-700">
              Ortak Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              id="partner_name"
              value={formData.partner_name}
              onChange={(e) => handleInputChange('partner_name', e.target.value)}
              placeholder="Ortak adı veya şirket adı"
              required
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner_type" className="text-sm font-medium text-gray-700">Ortak Türü</Label>
            <Select value={formData.partner_type} onValueChange={(value) => handleInputChange('partner_type', value)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ortak">Ortak</SelectItem>
                <SelectItem value="hisse_sahibi">Hisse Sahibi</SelectItem>
                <SelectItem value="yatirimci">Yatırımcı</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ownership_percentage" className="text-sm font-medium text-gray-700">Hisse Yüzdesi (%)</Label>
            <Input
              id="ownership_percentage"
              type="number"
              value={formData.ownership_percentage}
              onChange={(e) => handleInputChange('ownership_percentage', e.target.value)}
              placeholder="0.00"
              min="0"
              max="100"
              step="0.01"
              className="h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initial_capital" className="text-sm font-medium text-gray-700">Başlangıç Sermayesi</Label>
            <Input
              id="initial_capital"
              type="number"
              value={formData.initial_capital}
              onChange={(e) => handleInputChange('initial_capital', e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="h-9"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

          <UnifiedDatePicker
            label="Yatırım Tarihi"
            date={formData.investment_date_date}
            onSelect={(date) => {
              if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                handleInputChange('investment_date', `${year}-${month}-${day}`);
                setFormData(prev => ({ ...prev, investment_date_date: date }));
              } else {
                handleInputChange('investment_date', '');
                setFormData(prev => ({ ...prev, investment_date_date: undefined }));
              }
            }}
            placeholder="Yatırım tarihi seçin"
          />
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={onClose} disabled={isLoading || isPrefilling} />
          <UnifiedDialogActionButton
            type="submit"
            disabled={isLoading || isPrefilling}
            loading={isLoading}
            variant="primary"
          >
            {mode === 'edit' ? 'Kaydet' : 'Oluştur'}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default PartnerAccountModal;
