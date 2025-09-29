import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CreditCardAccount {
  id: string;
  card_name: string;
  card_number: string;
  bank_name: string;
  card_type: "credit" | "debit" | "corporate";
  credit_limit: number;
  current_balance: number;
  available_limit: number;
  currency: string;
  expiry_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreditCardsProps {
  showBalances: boolean;
}

const CreditCards = ({ showBalances }: CreditCardsProps) => {
  const [creditCards, setCreditCards] = useState<CreditCardAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCreditCards = async () => {
    try {
      setLoading(true);
      // TODO: Supabase'den kredi kartı hesaplarını çek
      // Şimdilik mock data
      const mockData: CreditCardAccount[] = [
        {
          id: "1",
          card_name: "İş Bankası Kredi Kartı",
          card_number: "1234-5678-9012-3456",
          bank_name: "Türkiye İş Bankası",
          card_type: "credit",
          credit_limit: 50000,
          current_balance: 15000,
          available_limit: 35000,
          currency: "TRY",
          expiry_date: "12/25",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          card_name: "Garanti Kurumsal Kart",
          card_number: "9876-5432-1098-7654",
          bank_name: "Garanti BBVA",
          card_type: "corporate",
          credit_limit: 100000,
          current_balance: 25000,
          available_limit: 75000,
          currency: "TRY",
          expiry_date: "08/26",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setCreditCards(mockData);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      toast({
        title: "Hata",
        description: "Kredi kartları yüklenirken hata oluştu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditCards();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCardNumber = (number: string) => {
    return number.replace(/(.{4})/g, '$1-').slice(0, -1);
  };

  const getCardTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'credit': 'Kredi Kartı',
      'debit': 'Banka Kartı',
      'corporate': 'Kurumsal Kart'
    };
    return types[type] || type;
  };

  const getCardTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'credit': 'bg-blue-100 text-blue-800',
      'debit': 'bg-green-100 text-green-800',
      'corporate': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleCardClick = (cardId: string) => {
    navigate(`/cashflow/credit-cards/${cardId}`);
  };

  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0);
  const totalCurrentBalance = creditCards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalAvailableLimit = creditCards.reduce((sum, card) => sum + card.available_limit, 0);

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
      {/* Compact Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
          <div className="text-sm font-bold text-blue-700">
            {showBalances ? formatCurrency(totalCreditLimit, "TRY") : "••••••"}
          </div>
          <div className="text-xs text-blue-600">Toplam</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
          <div className="text-sm font-bold text-red-700">
            {showBalances ? formatCurrency(totalCurrentBalance, "TRY") : "••••••"}
          </div>
          <div className="text-xs text-red-600">Kullanılan</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
          <div className="text-sm font-bold text-green-700">
            {showBalances ? formatCurrency(totalAvailableLimit, "TRY") : "••••••"}
          </div>
          <div className="text-xs text-green-600">Kalan</div>
        </div>
      </div>

      {/* Compact Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button size="sm" className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1">
          <Plus className="h-3 w-3" />
          Yeni
        </Button>
        <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50 text-xs px-2 py-1">
          Rapor
        </Button>
      </div>

      {/* Compact Cards List */}
      <div className="space-y-2">
        {creditCards.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <CreditCard className="h-6 w-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-medium text-gray-700 mb-1">Henüz kredi kartı yok</p>
            <p className="text-xs text-gray-500 mb-2">İlk kredi kartınızı ekleyin</p>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1">
              <Plus className="h-3 w-3 mr-1" />
              Ekle
            </Button>
          </div>
        ) : (
          creditCards.map((card) => (
            <div 
              key={card.id} 
              className="flex items-center justify-between p-2 bg-purple-50 border border-purple-100 rounded-lg hover:bg-purple-100 transition-colors duration-200 cursor-pointer group"
              onClick={() => handleCardClick(card.id)}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500 rounded-lg text-white">
                  <CreditCard className="h-3 w-3" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">{card.card_name}</div>
                  <div className="text-xs text-gray-600">
                    {card.bank_name} • {formatCardNumber(card.card_number)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-gray-900">
                    {showBalances ? formatCurrency(card.available_limit, card.currency) : "••••••"}
                  </div>
                  <div className="text-xs text-gray-500">
                    / {showBalances ? formatCurrency(card.credit_limit, card.currency) : "••••••"}
                  </div>
                  <div className="w-12 bg-gray-200 rounded-full h-1 mt-1">
                    <div 
                      className="bg-purple-500 h-1 rounded-full transition-all duration-300" 
                      style={{width: `${(card.current_balance / card.credit_limit) * 100}%`}}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 w-5 p-0 hover:bg-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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

export default CreditCards;
