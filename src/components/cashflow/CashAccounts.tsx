import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import CashAccountModal from "./modals/CashAccountModal";
import { supabase } from "@/integrations/supabase/client";

interface CashAccount {
  id: string;
  name: string;
  description?: string;
  current_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CashAccountsProps {
  showBalances: boolean;
}

const CashAccounts = ({ showBalances }: CashAccountsProps) => {
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchCashAccounts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { data: accountsData, error } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCashAccounts(accountsData || []);
    } catch (error) {
      console.error('Error fetching cash accounts:', error);
      toast({
        title: "Hata",
        description: "Nakit kasa hesapları yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashAccounts();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleAccountClick = (accountId: string) => {
    navigate(`/cashflow/cash-accounts/${accountId}`);
  };

  const handleModalSuccess = () => {
    fetchCashAccounts();
  };

  const totalBalance = cashAccounts.reduce((sum, account) => sum + account.current_balance, 0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
          <div className="text-sm font-bold text-green-700">
            {showBalances ? formatCurrency(totalBalance, "TRY") : "••••••"}
          </div>
          <div className="text-xs text-green-600">Toplam</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-sm font-bold text-blue-700">
            {cashAccounts.filter(acc => acc.is_active).length}
          </div>
          <div className="text-xs text-blue-600">Aktif</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-sm font-bold text-purple-700">
            {showBalances ? "0" : "••••"}
          </div>
          <div className="text-xs text-purple-600">İşlem</div>
        </div>
      </div>

      {/* Compact Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button 
          size="sm" 
          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-3 w-3" />
          Yeni
        </Button>
        <Button variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50 text-xs px-2 py-1">
          Geçmiş
        </Button>
      </div>

      {/* Compact Accounts List */}
      <div className="space-y-2">
        {cashAccounts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Wallet className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-700 mb-1">Henüz kasa hesabı yok</p>
            <p className="text-xs text-gray-500 mb-2">İlk kasa hesabınızı oluşturun</p>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Oluştur
            </Button>
          </div>
        ) : (
          cashAccounts.map((account) => (
            <div 
              key={account.id} 
              className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors duration-200 cursor-pointer group"
              onClick={() => handleAccountClick(account.id)}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-500 rounded-lg text-white">
                  <Wallet className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">{account.name}</div>
                  <div className="text-xs text-gray-600">
                    {account.description || "Nakit kasa"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-gray-900">
                    {showBalances ? formatCurrency(account.current_balance, account.currency) : "••••••"}
                  </div>
                  <Badge variant={account.is_active ? "default" : "secondary"} className={`text-xs ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {account.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-green-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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

      <CashAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default CashAccounts;
