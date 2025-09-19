import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Building2, Eye, EyeOff, Banknote } from "lucide-react";
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

const BankAccounts = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBalances, setShowBalances] = useState(false);

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
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-white to-green-50/50 rounded-2xl border border-green-100/50 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Banka Hesapları</h1>
              <p className="text-gray-600 text-base">Banka hesapları ve kredi kartları yönetimi - Finansal varlık takibi</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center gap-2 bg-white border-gray-300 hover:border-green-400 hover:bg-green-50"
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showBalances ? 'Bakiyeleri Gizle' : 'Bakiyeleri Göster'}
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group relative overflow-hidden bg-white border border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardContent className="relative p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Toplam Nakit</p>
              <p className="text-2xl lg:text-3xl font-bold text-blue-600">
                {showBalances ? formatCurrency(totalBankBalance, 'TRY') : '••••••'}
              </p>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-blue-100 rounded-full">
                  <span className="text-xs font-medium text-blue-700">Banka hesapları</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-green-100 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-green-500 rounded-lg shadow-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardContent className="relative p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Kredi Limiti</p>
              <p className="text-2xl lg:text-3xl font-bold text-green-600">
                {showBalances ? formatCurrency(totalCreditLimit, 'TRY') : '••••••'}
              </p>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-green-100 rounded-full">
                  <span className="text-xs font-medium text-green-700">Toplam limit</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-orange-100 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
              <Banknote className="h-5 w-5 text-white" />
            </div>
          </div>
          <CardContent className="relative p-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Kullanılan Kredi</p>
              <p className="text-2xl lg:text-3xl font-bold text-orange-600">
                {showBalances ? formatCurrency(totalCreditUsed, 'TRY') : '••••••'}
              </p>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-orange-100 rounded-full">
                  <span className="text-xs font-medium text-orange-700">Kullanılan</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Bank Accounts */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Banka Hesapları</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Hesap Adı</TableHead>
                  <TableHead className="font-semibold text-gray-700">Banka</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tip</TableHead>
                  <TableHead className="font-semibold text-gray-700">Para Birimi</TableHead>
                  <TableHead className="font-semibold text-gray-700">Bakiye</TableHead>
                  <TableHead className="font-semibold text-gray-700">Kullanılabilir</TableHead>
                  <TableHead className="font-semibold text-gray-700">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600 font-medium">Banka hesapları yükleniyor...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : bankAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <Building2 className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-900 font-medium">Henüz banka hesabı bulunmuyor</p>
                          <p className="text-gray-500 text-sm mt-1">İlk hesabınızı ekleyerek başlayabilirsiniz</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  bankAccounts.map((account) => (
                    <TableRow key={account.id} className="hover:bg-blue-50/30 transition-colors">
                      <TableCell className="font-semibold text-gray-900">{account.account_name}</TableCell>
                      <TableCell className="text-gray-700">{account.bank_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                          {getAccountTypeLabel(account.account_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-gray-700">{account.currency}</TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        {showBalances
                          ? formatCurrency(account.current_balance || 0, account.currency)
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {showBalances
                          ? formatCurrency(account.available_balance || 0, account.currency)
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? "default" : "secondary"} className={account.is_active ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}>
                          {account.is_active ? '✅ Aktif' : '❌ Pasif'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Credit Cards */}
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Kredi Kartları</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Kart Adı</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tip</TableHead>
                  <TableHead className="font-semibold text-gray-700">Bakiye</TableHead>
                  <TableHead className="font-semibold text-gray-700">Limit</TableHead>
                  <TableHead className="font-semibold text-gray-700">Kullanılabilir</TableHead>
                  <TableHead className="font-semibold text-gray-700">Son Kullanma</TableHead>
                  <TableHead className="font-semibold text-gray-700">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="text-gray-600 font-medium">Kredi kartları yükleniyor...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : creditCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-gray-100 rounded-full">
                          <CreditCard className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-900 font-medium">Henüz kredi kartı bulunmuyor</p>
                          <p className="text-gray-500 text-sm mt-1">İlk kartınızı ekleyerek başlayabilirsiniz</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  creditCards.map((card) => (
                    <TableRow key={card.id} className="hover:bg-green-50/30 transition-colors">
                      <TableCell className="font-semibold text-gray-900">{card.card_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                          {getCardTypeLabel(card.card_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {showBalances
                          ? formatCurrency(card.current_balance || 0, 'TRY')
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {showBalances
                          ? formatCurrency(card.credit_limit || 0, 'TRY')
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {showBalances
                          ? formatCurrency(card.available_limit || 0, 'TRY')
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell className="text-gray-700">
                        📅 {new Date(card.expiry_date).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.status === 'active' ? "default" : "secondary"} className={card.status === 'active' ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}>
                          {card.status === 'active' ? '✅ Aktif' : '❌ Pasif'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankAccounts;