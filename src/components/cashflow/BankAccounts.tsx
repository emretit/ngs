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
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Nakit</p>
                <p className="text-2xl font-semibold">
                  {showBalances ? formatCurrency(totalBankBalance, 'TRY') : '••••••'}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kredi Limiti</p>
                <p className="text-2xl font-semibold">
                  {showBalances ? formatCurrency(totalCreditLimit, 'TRY') : '••••••'}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kullanılan Kredi</p>
                <p className="text-2xl font-semibold">
                  {showBalances ? formatCurrency(totalCreditUsed, 'TRY') : '••••••'}
                </p>
              </div>
              <Banknote className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Banka Hesapları
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="gap-2"
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showBalances ? 'Gizle' : 'Göster'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hesap Adı</TableHead>
                  <TableHead>Banka</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Para Birimi</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Kullanılabilir</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : bankAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Henüz banka hesabı bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  bankAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.account_name}</TableCell>
                      <TableCell>{account.bank_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getAccountTypeLabel(account.account_type)}</Badge>
                      </TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell>
                        {showBalances 
                          ? formatCurrency(account.current_balance || 0, account.currency)
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell>
                        {showBalances 
                          ? formatCurrency(account.available_balance || 0, account.currency)
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.is_active ? "default" : "secondary"}>
                          {account.is_active ? 'Aktif' : 'Pasif'}
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

      {/* Credit Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Kredi Kartları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kart Adı</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Bakiye</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Kullanılabilir</TableHead>
                  <TableHead>Son Kullanma</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : creditCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Henüz kredi kartı bulunmuyor
                    </TableCell>
                  </TableRow>
                ) : (
                  creditCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.card_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCardTypeLabel(card.card_type)}</Badge>
                      </TableCell>
                      <TableCell>
                        {showBalances 
                          ? formatCurrency(card.current_balance || 0, 'TRY')
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell>
                        {showBalances 
                          ? formatCurrency(card.credit_limit || 0, 'TRY')
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell>
                        {showBalances 
                          ? formatCurrency(card.available_limit || 0, 'TRY')
                          : '••••••'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(card.expiry_date).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={card.status === 'active' ? "default" : "secondary"}>
                          {card.status === 'active' ? 'Aktif' : 'Pasif'}
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