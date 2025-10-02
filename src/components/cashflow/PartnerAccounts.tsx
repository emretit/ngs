import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import PartnerAccountModal from "./modals/PartnerAccountModal";
import { usePartnerAccounts } from "@/hooks/useAccountsData";
import AccountsSkeleton from "./AccountsSkeleton";

interface PartnerAccount {
  id: string;
  partner_name: string;
  partner_type: "ortak" | "hisse_sahibi" | "yatirimci";
  ownership_percentage: number;
  initial_capital: number;
  current_balance: number;
  profit_share: number;
  last_profit_distribution: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PartnerAccountsProps {
  showBalances: boolean;
}

const PartnerAccounts = ({ showBalances }: PartnerAccountsProps) => {
  const [partnerAccounts, setPartnerAccounts] = useState<PartnerAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchPartnerAccounts = async () => {
    try {
      setLoading(true);
      // TODO: Supabase'den ortak hesaplarını çek
      // Şimdilik mock data
      const mockData: PartnerAccount[] = [
        {
          id: "1",
          partner_name: "Ahmet Yılmaz",
          partner_type: "ortak",
          ownership_percentage: 60,
          initial_capital: 300000,
          current_balance: 450000,
          profit_share: 18000,
          last_profit_distribution: "2024-01-15",
          currency: "TRY",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          partner_name: "Mehmet Demir",
          partner_type: "ortak",
          ownership_percentage: 40,
          initial_capital: 200000,
          current_balance: 300000,
          profit_share: 12000,
          last_profit_distribution: "2024-01-15",
          currency: "TRY",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setPartnerAccounts(mockData);
    } catch (error) {
      console.error('Error fetching partner accounts:', error);
      toast({
        title: "Hata",
        description: "Ortak hesapları yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerAccounts();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getPartnerTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'ortak': 'Ortak',
      'hisse_sahibi': 'Hisse Sahibi',
      'yatirimci': 'Yatırımcı'
    };
    return types[type] || type;
  };

  const getPartnerTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'ortak': 'bg-blue-100 text-blue-800',
      'hisse_sahibi': 'bg-green-100 text-green-800',
      'yatirimci': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handlePartnerClick = (partnerId: string) => {
    navigate(`/cashflow/partner-accounts/${partnerId}`);
  };

  const handleModalSuccess = () => {
    fetchPartnerAccounts();
  };

  const totalCapital = partnerAccounts.reduce((sum, partner) => sum + partner.initial_capital, 0);
  const totalCurrentBalance = partnerAccounts.reduce((sum, partner) => sum + partner.current_balance, 0);
  const totalProfitShare = partnerAccounts.reduce((sum, partner) => sum + partner.profit_share, 0);
  const totalOwnership = partnerAccounts.reduce((sum, partner) => sum + partner.ownership_percentage, 0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-100">
          <div className="text-sm font-bold text-orange-700">
            {showBalances ? formatCurrency(totalCapital, "TRY") : "••••••"}
          </div>
          <div className="text-xs text-orange-600">Sermaye</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
          <div className="text-sm font-bold text-green-700">
            {showBalances ? formatCurrency(totalCurrentBalance, "TRY") : "••••••"}
          </div>
          <div className="text-xs text-green-600">Değer</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-100">
          <div className="text-sm font-bold text-purple-700">
            {showBalances ? formatCurrency(totalProfitShare, "TRY") : "••••••"}
          </div>
          <div className="text-xs text-purple-600">Kar Payı</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button 
          size="sm" 
          className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-3 w-3" />
          Yeni
        </Button>
        <Button variant="outline" size="sm" className="border-orange-200 text-orange-700 hover:bg-orange-50 text-xs px-2 py-1">
          Dağıt
        </Button>
      </div>

      {/* Partners List */}
      <div className="space-y-3">
        {partnerAccounts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Users className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-700 mb-1">Henüz ortak hesabı yok</p>
            <p className="text-xs text-gray-500 mb-2">İlk ortak hesabınızı oluşturun</p>
            <Button 
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Oluştur
            </Button>
          </div>
        ) : (
          partnerAccounts.map((partner) => (
            <div 
              key={partner.id} 
              className="flex items-center justify-between p-2 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition-colors duration-200 cursor-pointer group"
              onClick={() => handlePartnerClick(partner.id)}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500 rounded-lg text-white">
                  <Users className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">{partner.partner_name}</div>
                  <div className="text-xs text-gray-600">
                    %{partner.ownership_percentage} hisse • {getPartnerTypeLabel(partner.partner_type)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-gray-900">
                    {showBalances ? formatCurrency(partner.current_balance, partner.currency) : "••••••"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Kar: {showBalances ? formatCurrency(partner.profit_share, partner.currency) : "••••••"}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-orange-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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

      <PartnerAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default PartnerAccounts;
