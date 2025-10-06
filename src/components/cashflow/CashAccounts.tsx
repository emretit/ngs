import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Edit, Trash2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CashAccountModal from "./modals/CashAccountModal";
import { useCashAccounts } from "@/hooks/useAccountsData";
import AccountsSkeleton from "./AccountsSkeleton";

interface CashAccountsProps {
  showBalances: boolean;
}

const CashAccounts = ({ showBalances }: CashAccountsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { data: cashAccounts = [], isLoading, refetch } = useCashAccounts();

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
    refetch();
  };

  const totalBalance = cashAccounts.reduce((sum, account) => sum + account.current_balance, 0);

  if (isLoading) {
    return <AccountsSkeleton />;
  }

  return (
    <div className="space-y-4">

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
