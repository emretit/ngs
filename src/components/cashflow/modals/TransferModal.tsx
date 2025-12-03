import { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

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
    setFormData(prev => ({
      fromAccountId: prev.toAccountId,
      toAccountId: prev.fromAccountId,
      amount: prev.amount,
      currency: prev.currency,
      description: prev.description,
      transferDate: prev.transferDate
    }));
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
        const [cashAccounts, bankAccounts, creditCards, partnerAccounts] = await Promise.all([
          supabase
            .from('cash_accounts')
            .select('id, name, current_balance, currency')
            .eq('company_id', profile.company_id)
            .eq('is_active', true),
          supabase
            .from('bank_accounts')
            .select('id, account_name as name, current_balance, currency')
            .eq('company_id', profile.company_id)
            .eq('is_active', true),
          supabase
            .from('credit_cards')
            .select('id, card_name as name, current_balance, currency')
            .eq('company_id', profile.company_id)
            .eq('is_active', true),
          supabase
            .from('partner_accounts')
            .select('id, partner_name as name, current_balance, currency')
            .eq('company_id', profile.company_id)
            .eq('is_active', true)
        ]);

        const allAccounts: Account[] = [
          ...(cashAccounts.data || []).map(acc => ({ 
            id: acc.id,
            name: acc.name,
            type: 'cash', 
            balance: parseFloat(acc.current_balance?.toString() || '0'),
            currency: acc.currency 
          })),
          ...(bankAccounts.data || []).map(acc => ({ 
            id: acc.id,
            name: acc.name,
            type: 'bank', 
            balance: parseFloat(acc.current_balance?.toString() || '0'),
            currency: acc.currency 
          })),
          ...(creditCards.data || []).map(acc => ({ 
            id: acc.id,
            name: acc.name,
            type: 'credit_card', 
            balance: parseFloat(acc.current_balance?.toString() || '0'),
            currency: acc.currency 
          })),
          ...(partnerAccounts.data || []).map(acc => ({ 
            id: acc.id,
            name: acc.name,
            type: 'partner', 
            balance: parseFloat(acc.current_balance?.toString() || '0'),
            currency: acc.currency 
          }))
        ];

        setAccounts(allAccounts);
        setFromAccounts(allAccounts);
        setToAccounts(allAccounts);
      } catch (error) {
        console.error('Error loading accounts:', error);
        toast.error("Hesaplar yüklenirken hata oluştu");
      }
    };

    loadAccounts();
  }, [isOpen]);

  // Kaynak hesap değiştiğinde hedef hesapları güncelle
  useEffect(() => {
    if (formData.fromAccountId) {
      const filtered = accounts.filter(acc => acc.id !== formData.fromAccountId);
      setToAccounts(filtered);
      // Eğer hedef hesap kaynak hesapla aynıysa sıfırla
      if (formData.toAccountId === formData.fromAccountId) {
        setFormData(prev => ({
          ...prev,
          toAccountId: ""
        }));
      }
    } else {
      setToAccounts(accounts);
    }
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
      console.error('Error creating transfer:', error);
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


  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Hesap Arası Transfer"
      maxWidth="2xl"
      headerColor="blue"
    >
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">Hesaplarınız arasında para transferi yapın</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kaynak ve Hedef Hesap - Basit Seçim */}
          <div className="space-y-4">
            {/* Kaynak Hesap */}
            <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-blue-600">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <Label className="text-base font-semibold text-gray-900">Nereden (Gönderen)</Label>
              </div>
              <Select
                value={formData.fromAccountId}
                onValueChange={(value) => handleInputChange('fromAccountId', value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Gönderilecek hesabı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {fromAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span>
                          {acc.type === 'cash' && '💵'}
                          {acc.type === 'bank' && '🏦'}
                          {acc.type === 'credit_card' && '💳'}
                          {acc.type === 'partner' && '👥'}
                        </span>
                        <span className="font-medium">{acc.name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(acc.balance, acc.currency)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Yer Değiştir Butonu */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={handleSwapAccounts}
                variant="outline"
                className="rounded-full h-10 w-10 p-0 shadow-sm hover:bg-gray-50 border-gray-300"
                title="Nereden ve Nereye konumlarını yer değiştir"
                disabled={!formData.fromAccountId || !formData.toAccountId}
              >
                <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h11m0 0l-4-4m4 4l-4 4M20 17H9m0 0l4-4m-4 4l4 4" />
                </svg>
              </Button>
            </div>

            {/* Hedef Hesap */}
            <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-md bg-green-600">
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <Label className="text-base font-semibold text-gray-900">Nereye (Alıcı)</Label>
              </div>
              <Select
                value={formData.toAccountId}
                onValueChange={(value) => handleInputChange('toAccountId', value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Alıcı hesabı seçin" />
                </SelectTrigger>
                <SelectContent>
                  {toAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <div className="flex items-center gap-2">
                        <span>
                          {acc.type === 'cash' && '💵'}
                          {acc.type === 'bank' && '🏦'}
                          {acc.type === 'credit_card' && '💳'}
                          {acc.type === 'partner' && '👥'}
                        </span>
                        <span className="font-medium">{acc.name}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-green-600 font-semibold">{formatCurrency(acc.balance, acc.currency)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transfer Detayları */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-semibold">Transfer Tutarı *</Label>
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
                    className="text-lg font-semibold pr-16"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Select 
                      value={formData.currency} 
                      onValueChange={(value) => handleInputChange('currency', value)}
                    >
                      <SelectTrigger className="h-8 w-20 border-0 bg-transparent">
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
                <Label htmlFor="transferDate" className="text-sm font-semibold">Transfer Tarihi</Label>
                <Input
                  id="transferDate"
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) => handleInputChange('transferDate', e.target.value)}
                  required
                  className="text-base"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="description" className="text-sm font-semibold">Açıklama (Opsiyonel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Transfer notu ekleyin..."
                rows={2}
                className="resize-none"
              />
            </div>
          </div>

        <UnifiedDialogFooter className="gap-2">
          <UnifiedDialogCancelButton onClick={onClose} disabled={isLoading} className="flex-1" />
          <UnifiedDialogActionButton
            onClick={() => {}}
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            ✓ Transferi Onayla
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </form>
    </UnifiedDialog>
  );
};

export default TransferModal;
