import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Building2, 
  Plus, 
  Edit,
  Trash2,
  ExternalLink
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

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

interface BankAccountsProps {
  showBalances: boolean;
}

const BankAccountsSimple = ({ showBalances }: BankAccountsProps) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
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

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'vadesiz': 'bg-blue-100 text-blue-800',
      'vadeli': 'bg-green-100 text-green-800',
      'kredi': 'bg-red-100 text-red-800',
      'pos': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleAccountClick = (accountId: string) => {
    navigate(`/cashflow/bank-accounts/${accountId}`);
  };

  const totalBankBalance = bankAccounts.reduce((sum, account) => {
    if (account.currency === 'TRY') {
      return sum + (account.current_balance || 0);
    }
    return sum;
  }, 0);

  const activeAccounts = bankAccounts.filter(acc => acc.is_active).length;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-sm font-bold text-blue-700">
            {showBalances ? formatCurrency(totalBankBalance, "TRY") : "••••••"}
          </div>
          <div className="text-xs text-blue-600">Toplam</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
          <div className="text-sm font-bold text-green-700">
            {activeAccounts}
          </div>
          <div className="text-xs text-green-600">Aktif</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-sm font-bold text-purple-700">
            {bankAccounts.length}
          </div>
          <div className="text-xs text-purple-600">Toplam</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button size="sm" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1">
          <Plus className="h-3 w-3" />
          Yeni
        </Button>
        <Button variant="outline" size="sm" className="border-blue-200 text-blue-700 hover:bg-blue-50 text-xs px-2 py-1">
          Geçmiş
        </Button>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {bankAccounts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Building2 className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-700 mb-1">Henüz banka hesabı yok</p>
            <p className="text-xs text-gray-500 mb-2">İlk banka hesabınızı ekleyin</p>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1">
              <Plus className="h-3 w-3 mr-1" />
              Ekle
            </Button>
          </div>
        ) : (
          bankAccounts.map((account) => (
            <div 
              key={account.id} 
              className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors duration-200 cursor-pointer group"
              onClick={() => handleAccountClick(account.id)}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500 rounded-lg text-white">
                  <Building2 className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">{account.account_name}</div>
                  <div className="text-xs text-gray-600">
                    {account.bank_name} • {getAccountTypeLabel(account.account_type)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-gray-900">
                    {showBalances ? formatCurrency(account.current_balance, account.currency) : "••••••"}
                  </div>
                  <Badge className={`text-xs ${getAccountTypeColor(account.account_type)}`}>
                    {getAccountTypeLabel(account.account_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit functionality
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Delete functionality
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BankAccountsSimple;
