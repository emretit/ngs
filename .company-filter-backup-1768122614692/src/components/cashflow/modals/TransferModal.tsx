import { useState, useEffect, useRef } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  bankName?: string;
}

interface TransferFormData {
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  currency: string;
  description: string;
  transferDate: string;
}

const TransferModal = ({
  isOpen,
  onClose,
  onSuccess
}: TransferModalProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const isSwapping = useRef(false);
  const [formData, setFormData] = useState<TransferFormData>({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    currency: "TRY",
    description: "",
    transferDate: new Date().toISOString().split('T')[0]
  });

  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fromAccounts, setFromAccounts] = useState<Account[]>([]);
  const [toAccounts, setToAccounts] = useState<Account[]>([]);

  // Kaynak ve hedef hesapları yer değiştir
  const handleSwapAccounts = () => {
    if (!formData.fromAccountId || !formData.toAccountId) {
      return;
    }

    const tempFrom = formData.fromAccountId;
    const tempTo = formData.toAccountId;

    // Swap işlemini başlat
    isSwapping.current = true;

    // Önce toAccounts listesini güncelle (yeni fromAccountId'ye göre)
    const updatedToAccounts = accounts.filter(acc => acc.id !== tempTo);
    setToAccounts(updatedToAccounts);

    // Sonra formData'yı güncelle - callback kullanarak güncel state'i al
    // setTimeout ile toAccounts state'inin güncellenmesini bekleyelim
    // Bu şekilde Select component'i doğru listeyi görecek
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        fromAccountId: tempTo,
        toAccountId: tempFrom
      }));
    }, 0);

    // useEffect'in çalışması için yeterli süre bekle
    setTimeout(() => {
      isSwapping.current = false;
    }, 500);
    toast.info("Kaynak ve hedef hesaplar yer değiştirildi");
  };

  // Tüm hesapları yükle
  useEffect(() => {
    if (!isOpen) return;
    
    const loadAccounts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!profile?.company_id) return;

        // Tüm hesap tiplerini paralel olarak yükle
        const [cashResult, bankResult, creditCardResult, partnerResult] = await Promise.all([
          supabase
            .from('cash_accounts')
            .select('id, name, current_balance, currency')
            .eq('company_id', profile.company_id)
            .eq('is_active', true),
          supabase
            .from('bank_accounts')
            .select('id, account_name, bank_name, current_balance, currency')
            .eq('company_id', profile.company_id)
            .eq('is_active', true),
          supabase
            .from('credit_cards')
            .select('id, card_name, bank_name, current_balance, currency')
            .eq('company_id', profile.company_id)
            .eq('status', 'active'),
          supabase
            .from('partner_accounts')
            .select('id, partner_name, current_balance, currency')
            .eq('company_id', profile.company_id)
            .eq('is_active', true)
        ]);


        // Tüm hesap türlerini birleştir
        const allAccounts: Account[] = [
          ...(cashResult.data || []).map(acc => ({ 
            id: acc.id,
            name: (acc as any).name || '',
            type: 'cash' as const, 
            balance: parseFloat(acc.current_balance?.toString() || '0'),
            currency: acc.currency || 'TRY'
          })),
          ...(bankResult.data || []).map(acc => ({ 
            id: acc.id,
            name: (acc as any).account_name || '',
            type: 'bank' as const, 
            balance: parseFloat(acc.current_balance?.toString() || '0'),
            currency: acc.currency || 'TRY',
            bankName: (acc as any).bank_name || ''
          })),
          ...(creditCardResult.data || []).map(acc => ({ 
            id: acc.id,
            name: (acc as any).card_name || '',
            type: 'credit_card' as const, 
            balance: parseFloat(acc.current_balance?.toString() || '0'),
            currency: acc.currency || 'TRY',
            bankName: (acc as any).bank_name || ''
          })),
          ...(partnerResult.data || []).map(acc => ({ 
            id: acc.id,
            name: (acc as any).partner_name || '',
            type: 'partner' as const, 
            balance: parseFloat(acc.current_balance?.toString() || '0'),
            currency: acc.currency || 'TRY'
          }))
        ];

        setAccounts(allAccounts);
        setFromAccounts(allAccounts);
        setToAccounts(allAccounts);
      } catch (error) {
        toast.error("Hesaplar yüklenirken hata oluştu");
      }
    };

    loadAccounts();
  }, [isOpen]);

  // Kaynak hesap değiştiğinde hedef hesapları güncelle
  useEffect(() => {
    // Swap işlemi sırasında bu effect'i atla
    if (isSwapping.current) {
      return;
    }
    
    if (formData.fromAccountId) {
      const filtered = accounts.filter(acc => acc.id !== formData.fromAccountId);
      setToAccounts(filtered);
      // Eğer hedef hesap kaynak hesapla aynıysa sıfırla (swap sırasında değil)
      if (formData.toAccountId === formData.fromAccountId) {
        setFormData(prev => ({
          ...prev,
          toAccountId: ""
        }));
      }
    } else {
      setToAccounts(accounts);
    }
    setFromAccounts(accounts);
  }, [formData.fromAccountId, accounts]);

  const handleInputChange = (field: keyof TransferFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromAccountId || !formData.toAccountId) {
      toast.error("Kaynak ve hedef hesap seçimi zorunludur");
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      toast.error("Kaynak ve hedef hesap aynı olamaz");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Geçerli bir tutar giriniz");
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

      const amount = parseFloat(formData.amount);

      // Hesap tiplerini bul
      const fromAccount = accounts.find(acc => acc.id === formData.fromAccountId);
      const toAccount = accounts.find(acc => acc.id === formData.toAccountId);

      if (!fromAccount || !toAccount) {
        throw new Error("Hesap bulunamadı");
      }

      // Transfer kaydını oluştur
      const { error: transferError } = await supabase
        .from('account_transfers')
        .insert({
          from_account_type: fromAccount.type,
          from_account_id: formData.fromAccountId,
          to_account_type: toAccount.type,
          to_account_id: formData.toAccountId,
          amount: amount,
          currency: formData.currency,
          description: formData.description,
          transfer_date: formData.transferDate,
          company_id: profile.company_id
        });

      if (transferError) throw transferError;

      // Kaynak hesaptan para düş
      const fromTable = getTableName(fromAccount.type);
      const { error: fromError } = await supabase
        .from(fromTable)
        .update({
          current_balance: supabase.raw(`current_balance - ${amount}`)
        })
        .eq('id', formData.fromAccountId);

      if (fromError) throw fromError;

      // Hedef hesaba para ekle
      const toTable = getTableName(toAccount.type);
      const { error: toError } = await supabase
        .from(toTable)
        .update({
          current_balance: supabase.raw(`current_balance + ${amount}`)
        })
        .eq('id', formData.toAccountId);

      if (toError) throw toError;

      toast.success("Transfer işlemi tamamlandı");

      onSuccess();
      onClose();
      setFormData({
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        currency: "TRY",
        description: "",
        transferDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error("Transfer işlemi sırasında hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const getTableName = (accountType: string) => {
    switch (accountType) {
      case 'cash': return 'cash_accounts';
      case 'bank': return 'bank_accounts';
      case 'credit_card': return 'credit_cards';
      case 'partner': return 'partner_accounts';
      default: return '';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Nakit Kasa';
      case 'bank': return 'Banka Hesabı';
      case 'credit_card': return 'Kredi Kartı';
      case 'partner': return 'Şirket Ortakları Hesabı';
      default: return type;
    }
  };


  const resetForm = () => {
    setFormData({
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      currency: "TRY",
      description: "",
      transferDate: new Date().toISOString().split('T')[0]
    });
    setFromAccounts([]);
    setToAccounts([]);
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      onClosed={resetForm}
      title="Hesap Arası Transfer"
      maxWidth="2xl"
      headerColor="blue"
    >
      
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Kaynak ve Hedef Hesap - İki Sütunlu Kompakt Yapı */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
            {/* Kaynak Hesap - Sol */}
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-semibold text-gray-700">
                Nereden
              </Label>
              <Select
                value={formData.fromAccountId}
                onValueChange={(value) => handleInputChange('fromAccountId', value)}
              >
                <SelectTrigger className="bg-white h-11 w-full">
                  {formData.fromAccountId ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{accounts.find(a => a.id === formData.fromAccountId)?.name}</span>
                      <span className="text-green-600 font-semibold text-sm">{formatCurrency(accounts.find(a => a.id === formData.fromAccountId)?.balance || 0, accounts.find(a => a.id === formData.fromAccountId)?.currency || 'TRY')}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Gönderen hesap</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {fromAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{acc.name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600 text-xs">{getAccountTypeLabel(acc.type)}</span>
                        {acc.bankName && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600 text-xs">{acc.bankName}</span>
                          </>
                        )}
                        <span className="text-gray-500">•</span>
                        <span className="text-green-600 font-semibold text-xs">{formatCurrency(acc.balance, acc.currency)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Yer Değiştir Butonu - Ortada */}
            <div className="flex items-center justify-center pb-1">
              <Button
                type="button"
                onClick={handleSwapAccounts}
                variant="outline"
                size="icon"
                className="rounded-full h-10 w-10 shadow-sm hover:bg-gray-50 border-gray-300 flex-shrink-0"
                title="Hesapları yer değiştir"
                disabled={!formData.fromAccountId || !formData.toAccountId}
              >
                <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </Button>
            </div>

            {/* Hedef Hesap - Sağ */}
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-semibold text-gray-700">
                Nereye
              </Label>
              <Select
                value={formData.toAccountId}
                onValueChange={(value) => handleInputChange('toAccountId', value)}
              >
                <SelectTrigger className="bg-white h-11 w-full">
                  {formData.toAccountId ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{accounts.find(a => a.id === formData.toAccountId)?.name}</span>
                      <span className="text-green-600 font-semibold text-sm">{formatCurrency(accounts.find(a => a.id === formData.toAccountId)?.balance || 0, accounts.find(a => a.id === formData.toAccountId)?.currency || 'TRY')}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">Alıcı hesap</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {toAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{acc.name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600 text-xs">{getAccountTypeLabel(acc.type)}</span>
                        {acc.bankName && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600 text-xs">{acc.bankName}</span>
                          </>
                        )}
                        <span className="text-gray-500">•</span>
                        <span className="text-green-600 font-semibold text-xs">{formatCurrency(acc.balance, acc.currency)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfer Detayları */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold">Tutar *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    className="pr-16"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger className="h-7 w-16 border-0 bg-transparent p-0">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferDate" className="text-sm font-semibold">Tarih</Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) => handleInputChange('transferDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Transfer notu..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

        <UnifiedDialogFooter className="gap-2">
          <UnifiedDialogCancelButton onClick={onClose} disabled={isLoading} className="flex-1" />
          <UnifiedDialogActionButton
            type="submit"
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Transferi Onayla
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default TransferModal;
