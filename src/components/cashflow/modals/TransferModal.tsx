import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
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
  fromAccountType: string;
  fromAccountId: string;
  toAccountType: string;
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
    fromAccountType: "",
    fromAccountId: "",
    toAccountType: "",
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
      fromAccountType: prev.toAccountType,
      fromAccountId: prev.toAccountId,
      toAccountType: prev.fromAccountType,
      toAccountId: prev.fromAccountId,
      amount: prev.amount,
      currency: prev.currency,
      description: prev.description,
      transferDate: prev.transferDate
    }));
    toast({
      title: "Değiştirildi",
      description: "Kaynak ve hedef hesaplar yer değiştirildi"
    });
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
        toast({
          title: "Hata",
          description: "Hesaplar yüklenirken hata oluştu",
          variant: "destructive"
        });
      }
    };

    loadAccounts();
  }, [isOpen]);

  // Kaynak hesap değiştiğinde hedef hesapları güncelle
  useEffect(() => {
    if (formData.fromAccountType && formData.fromAccountId) {
      const filtered = accounts.filter(acc => 
        !(acc.type === formData.fromAccountType && acc.id === formData.fromAccountId)
      );
      setToAccounts(filtered);
      // Hedef hesap seçimini sıfırla
      setFormData(prev => ({
        ...prev,
        toAccountType: "",
        toAccountId: ""
      }));
    } else {
      setToAccounts(accounts);
    }
  }, [formData.fromAccountType, formData.fromAccountId, accounts]);

  // Hedef hesap tipi değiştiğinde hedef hesap seçimini sıfırla
  useEffect(() => {
    if (formData.toAccountType) {
      setFormData(prev => ({
        ...prev,
        toAccountId: ""
      }));
    }
  }, [formData.toAccountType]);

  const handleInputChange = (field: keyof TransferFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromAccountType || !formData.fromAccountId || 
        !formData.toAccountType || !formData.toAccountId) {
      toast({
        title: "Hata",
        description: "Kaynak ve hedef hesap seçimi zorunludur",
        variant: "destructive"
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Hata",
        description: "Geçerli bir tutar giriniz",
        variant: "destructive"
      });
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

      // Transfer kaydını oluştur
      const { error: transferError } = await supabase
        .from('account_transfers')
        .insert({
          from_account_type: formData.fromAccountType,
          from_account_id: formData.fromAccountId,
          to_account_type: formData.toAccountType,
          to_account_id: formData.toAccountId,
          amount: amount,
          currency: formData.currency,
          description: formData.description,
          transfer_date: formData.transferDate,
          company_id: profile.company_id
        });

      if (transferError) throw transferError;

      // Kaynak hesaptan para düş
      const fromTable = getTableName(formData.fromAccountType);
      const { error: fromError } = await supabase
        .from(fromTable)
        .update({
          current_balance: supabase.raw(`current_balance - ${amount}`)
        })
        .eq('id', formData.fromAccountId);

      if (fromError) throw fromError;

      // Hedef hesaba para ekle
      const toTable = getTableName(formData.toAccountType);
      const { error: toError } = await supabase
        .from(toTable)
        .update({
          current_balance: supabase.raw(`current_balance + ${amount}`)
        })
        .eq('id', formData.toAccountId);

      if (toError) throw toError;

      toast({
        title: "Başarılı",
        description: "Transfer işlemi tamamlandı"
      });

      onSuccess();
      onClose();
      setFormData({
        fromAccountType: "",
        fromAccountId: "",
        toAccountType: "",
        toAccountId: "",
        amount: "",
        currency: "TRY",
        description: "",
        transferDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast({
        title: "Hata",
        description: "Transfer işlemi sırasında hata oluştu",
        variant: "destructive"
      });
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
      case 'partner': return 'Ortak Hesabı';
      default: return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Hesap Arası Transfer</DialogTitle>
          <p className="text-sm text-gray-500">Hesaplarınız arasında para transferi yapın</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kaynak ve Hedef Hesap - Görsel Akış */}
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
              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={formData.fromAccountType}
                  onValueChange={(value) => {
                    handleInputChange('fromAccountType', value);
                    handleInputChange('fromAccountId', '');
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Hesap tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Nakit Kasa</SelectItem>
                    <SelectItem value="bank">🏦 Banka Hesabı</SelectItem>
                    <SelectItem value="credit_card">💳 Kredi Kartı</SelectItem>
                    <SelectItem value="partner">👥 Ortak Hesabı</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={formData.fromAccountId}
                  onValueChange={(value) => handleInputChange('fromAccountId', value)}
                  disabled={!formData.fromAccountType}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Hesap seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {fromAccounts
                      .filter(acc => acc.type === formData.fromAccountType)
                      .map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} • {formatCurrency(acc.balance, acc.currency)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Yer Değiştir Butonu (Google Maps tarzı) */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={handleSwapAccounts}
                variant="outline"
                className="rounded-full h-10 w-10 p-0 shadow-sm hover:bg-gray-50 border-gray-300"
                title="Nereden ve Nereye konumlarını yer değiştir"
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
              <div className="grid grid-cols-2 gap-3">
                <Select 
                  value={formData.toAccountType} 
                  onValueChange={(value) => {
                    handleInputChange('toAccountType', value);
                    handleInputChange('toAccountId', '');
                  }}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Hesap tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Nakit Kasa</SelectItem>
                    <SelectItem value="bank">🏦 Banka Hesabı</SelectItem>
                    <SelectItem value="credit_card">💳 Kredi Kartı</SelectItem>
                    <SelectItem value="partner">👥 Ortak Hesabı</SelectItem>
                  </SelectContent>
                </Select>

                <Select 
                  value={formData.toAccountId} 
                  onValueChange={(value) => handleInputChange('toAccountId', value)}
                  disabled={!formData.toAccountType}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Hesap seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {toAccounts
                      .filter(acc => {
                        const isSameAccount = acc.type === formData.fromAccountType && acc.id === formData.fromAccountId;
                        const isCorrectType = acc.type === formData.toAccountType;
                        return !isSameAccount && isCorrectType;
                      })
                      .map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} • {formatCurrency(acc.balance, acc.currency)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
              İptal
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {isLoading ? "Transfer Yapılıyor..." : "✓ Transferi Onayla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;
