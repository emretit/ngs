import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building2, 
  Plus, 
  TrendingUp, 
  Wallet,
  PiggyBank,
  ArrowUpRight,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_type: string;
  currency: string;
  current_balance: number;
  available_balance: number;
  is_active: boolean;
}

interface CreditCard {
  id: string;
  card_name: string;
  card_type: string;
  current_balance: number;
  credit_limit: number;
  available_limit: number;
  status: string;
  expiry_date: string;
}


interface BankAccountsProps {
  showBalances: boolean;
}

const BankAccounts = ({ showBalances }: BankAccountsProps) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('bank_name', { ascending: true });

      if (error) throw error;
      setBankAccounts((data as unknown as BankAccount[]) || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Banka hesapları yüklenirken hata oluştu');
    }
  };

  const fetchCreditCards = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('status', 'active')
        .order('card_name', { ascending: true });

      if (error) throw error;
      setCreditCards((data as unknown as CreditCard[]) || []);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      toast.error('Kredi kartları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
    fetchCreditCards();
  }, []);

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'vadesiz': 'Vadesiz',
      'vadeli': 'Vadeli',
      'kredi': 'Kredi',
      'pos': 'POS'
    };
    return types[type] || type;
  };

  const getCardTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'credit': 'Kredi Kartı',
      'debit': 'Banka Kartı',
      'corporate': 'Kurumsal Kart'
    };
    return types[type] || type;
  };

  const formatCardNumber = (number: string | null) => {
    if (!number) return '****-****-****-****';
    return number.replace(/(.{4})/g, '$1-').slice(0, -1);
  };


  const totalBankBalance = bankAccounts.reduce((sum, account) => {
    if (account.currency === 'TRY') {
      return sum + (account.current_balance || 0);
    }
    return sum;
  }, 0);

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0);
  const totalCreditUsed = creditCards.reduce((sum, card) => sum + (card.current_balance || 0), 0);


  return (
    <div className="space-y-8">
      {/* Modern Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Toplam Nakit */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-4 right-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardContent className="relative p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600">Toplam Nakit</p>
              <p className="text-3xl font-bold text-gray-900">
                {showBalances ? formatCurrency(totalBankBalance, 'TRY') : '••••••'}
              </p>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Banka hesapları</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kredi Limiti */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-4 right-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardContent className="relative p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600">Kredi Limiti</p>
              <p className="text-3xl font-bold text-gray-900">
                {showBalances ? formatCurrency(totalCreditLimit, 'TRY') : '••••••'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Kredi kartları</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kullanılan Kredi */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-4 right-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardContent className="relative p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600">Kullanılan Kredi</p>
              <p className="text-3xl font-bold text-gray-900">
                {showBalances ? formatCurrency(totalCreditUsed, 'TRY') : '••••••'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: `${totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0}%`}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Net Pozisyon */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-4 right-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
              <PiggyBank className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardContent className="relative p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-600">Net Pozisyon</p>
              <p className="text-3xl font-bold text-gray-900">
                {showBalances ? formatCurrency(totalBankBalance - totalCreditUsed, 'TRY') : '••••••'}
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Pozitif</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modern Bank Accounts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Banka Hesapları</h2>
              <p className="text-gray-600">Tüm banka hesaplarınızı tek yerden yönetin</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Hesap Ekle
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 font-medium">Banka hesapları yükleniyor...</p>
            </div>
          </div>
        ) : bankAccounts.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Building2 className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz banka hesabı yok</h3>
              <p className="text-gray-500 text-center mb-6">İlk banka hesabınızı ekleyerek başlayabilirsiniz</p>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                İlk Hesabınızı Ekleyin
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bankAccounts.map((account) => (
              <Card key={account.id} className="group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full -translate-y-16 translate-x-16"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{account.account_name}</h3>
                        <p className="text-sm text-gray-600">{account.bank_name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Hesap Tipi</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        {getAccountTypeLabel(account.account_type)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Para Birimi</span>
                      <span className="font-medium text-gray-900">{account.currency}</span>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Güncel Bakiye</span>
                        <span className="text-lg font-bold text-gray-900">
                          {showBalances
                            ? formatCurrency(account.current_balance || 0, account.currency)
                            : '••••••'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Kullanılabilir</span>
                        <span className="font-medium text-green-600">
                          {showBalances
                            ? formatCurrency(account.available_balance || 0, account.currency)
                            : '••••••'
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <Badge 
                        variant={account.is_active ? "default" : "secondary"} 
                        className={account.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600"}
                      >
                        {account.is_active ? '✅ Aktif' : '❌ Pasif'}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modern Credit Cards Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kredi Kartları</h2>
              <p className="text-gray-600">Kredi kartlarınızı takip edin ve yönetin</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Kart Ekle
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-gray-600 font-medium">Kredi kartları yükleniyor...</p>
            </div>
          </div>
        ) : creditCards.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Building2 className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz kredi kartı yok</h3>
              <p className="text-gray-500 text-center mb-6">İlk kredi kartınızı ekleyerek başlayabilirsiniz</p>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                İlk Kartınızı Ekleyin
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditCards.map((card) => (
              <Card key={card.id} className="group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -translate-y-16 translate-x-16"></div>
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{card.card_name}</h3>
                        <p className="text-sm text-gray-600">{card.card_name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Kart Tipi</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        {getCardTypeLabel(card.card_type)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Son Kullanma</span>
                      <span className="font-medium text-gray-900">
                        {new Date(card.expiry_date).toLocaleDateString('tr-TR')}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Güncel Bakiye</span>
                        <span className="text-lg font-bold text-orange-600">
                          {showBalances
                            ? formatCurrency(card.current_balance || 0, 'TRY')
                            : '••••••'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Kredi Limiti</span>
                        <span className="font-semibold text-green-600">
                          {showBalances
                            ? formatCurrency(card.credit_limit || 0, 'TRY')
                            : '••••••'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Kullanılabilir</span>
                        <span className="font-medium text-blue-600">
                          {showBalances
                            ? formatCurrency(card.available_limit || 0, 'TRY')
                            : '••••••'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Kullanım Oranı</span>
                        <span>{Math.round(((card.current_balance || 0) / (card.credit_limit || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full transition-all duration-300" 
                          style={{width: `${Math.min(((card.current_balance || 0) / (card.credit_limit || 1)) * 100, 100)}%`}}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <Badge 
                        variant={card.status === 'active' ? "default" : "secondary"} 
                        className={card.status === 'active' ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600"}
                      >
                        {card.status === 'active' ? '✅ Aktif' : '❌ Pasif'}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default BankAccounts;