import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Users, 
  Edit, 
  Trash2, 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Eye,
  EyeOff,
  Percent,
  DollarSign
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface PartnerAccount {
  id: string;
  partner_name: string;
  partner_type: "ortak" | "hisse_sahibi" | "yatirimci";
  ownership_percentage: number;
  initial_capital: number;
  current_balance: number;
  profit_share: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  partner_id: string;
  amount: number;
  type: "capital_increase" | "capital_decrease" | "profit_distribution" | "loss_share";
  description: string;
  category: string;
  date: string;
  reference?: string;
}

const PartnerAccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<PartnerAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "capital_increase" | "capital_decrease" | "profit_distribution" | "loss_share">("all");

  useEffect(() => {
    if (id) {
      fetchPartnerDetails();
      fetchTransactions();
    }
  }, [id]);

  const fetchPartnerDetails = async () => {
    try {
      setLoading(true);
      // TODO: Supabase'den ortak detaylarını çek
      // Şimdilik mock data
      const mockPartner: PartnerAccount = {
        id: id!,
        partner_name: "Ahmet Yılmaz",
        partner_type: "ortak",
        ownership_percentage: 25.5,
        initial_capital: 100000,
        current_balance: 125000,
        profit_share: 15000,
        currency: "TRY",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T15:30:00Z"
      };
      setPartner(mockPartner);
    } catch (error) {
      toast.error("Ortak bilgileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      // TODO: Supabase'den işlem geçmişini çek
      // Şimdilik mock data
      const mockTransactions: Transaction[] = [
        {
          id: "1",
          partner_id: id!,
          amount: 15000,
          type: "profit_distribution",
          description: "Kar payı dağıtımı",
          category: "Kar Payı",
          date: "2024-01-20T14:30:00Z",
          reference: "KAR-2024-001"
        },
        {
          id: "2",
          partner_id: id!,
          amount: 25000,
          type: "capital_increase",
          description: "Sermaye artırımı",
          category: "Sermaye",
          date: "2024-01-15T10:15:00Z",
          reference: "SRM-2024-001"
        },
        {
          id: "3",
          partner_id: id!,
          amount: 5000,
          type: "loss_share",
          description: "Zarar paylaşımı",
          category: "Zarar",
          date: "2024-01-10T16:45:00Z",
          reference: "ZAR-2024-001"
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast.error("İşlem geçmişi yüklenirken hata oluştu");
    }
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

  const getTransactionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'capital_increase': 'Sermaye Artırımı',
      'capital_decrease': 'Sermaye Azaltımı',
      'profit_distribution': 'Kar Payı',
      'loss_share': 'Zarar Paylaşımı'
    };
    return types[type] || type;
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'capital_increase': 'bg-green-100 text-green-800',
      'capital_decrease': 'bg-red-100 text-red-800',
      'profit_distribution': 'bg-blue-100 text-blue-800',
      'loss_share': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  const totalCapitalIncrease = transactions
    .filter(t => t.type === "capital_increase")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCapitalDecrease = transactions
    .filter(t => t.type === "capital_decrease")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalProfitDistribution = transactions
    .filter(t => t.type === "profit_distribution")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCapitalChange = totalCapitalIncrease - totalCapitalDecrease;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Ortak bulunamadı</h2>
        <p className="text-gray-600 mb-4">Aradığınız ortak hesabı bulunamadı.</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{partner.partner_name}</h1>
            <p className="text-gray-600">{getPartnerTypeLabel(partner.partner_type)} • %{partner.ownership_percentage} hisse</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      {/* Partner Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Güncel Değer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showBalances ? formatCurrency(partner.current_balance, partner.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sermaye</p>
                <p className="text-2xl font-bold text-blue-600">
                  {showBalances ? formatCurrency(partner.initial_capital, partner.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kar Payı</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? formatCurrency(partner.profit_share, partner.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hisse Oranı</p>
                <p className="text-2xl font-bold text-purple-600">
                  %{partner.ownership_percentage}
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Percent className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ortak Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Ortak Türü</p>
              <Badge className={getPartnerTypeColor(partner.partner_type)}>
                {getPartnerTypeLabel(partner.partner_type)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Hisse Oranı</p>
              <p className="text-lg font-semibold">%{partner.ownership_percentage}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Başlangıç Sermayesi</p>
              <p className="text-lg font-mono">
                {showBalances ? formatCurrency(partner.initial_capital, partner.currency) : "••••••"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Para Birimi</p>
              <p className="text-lg">{partner.currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performans Özeti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Sermaye Artışı</p>
              <p className="text-2xl font-bold text-green-600">
                {showBalances ? formatCurrency(totalCapitalIncrease, partner.currency) : "••••••"}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Sermaye Azalışı</p>
              <p className="text-2xl font-bold text-red-600">
                {showBalances ? formatCurrency(totalCapitalDecrease, partner.currency) : "••••••"}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Toplam Kar Payı</p>
              <p className="text-2xl font-bold text-blue-600">
                {showBalances ? formatCurrency(totalProfitDistribution, partner.currency) : "••••••"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Sermaye Artır
            </Button>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              <Minus className="h-4 w-4 mr-2" />
              Sermaye Azalt
            </Button>
            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <DollarSign className="h-4 w-4 mr-2" />
              Kar Payı Dağıt
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Rapor Al
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">İşlem Geçmişi</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                Tümü
              </Button>
              <Button
                variant={filterType === "capital_increase" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("capital_increase")}
              >
                Sermaye Artışı
              </Button>
              <Button
                variant={filterType === "profit_distribution" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("profit_distribution")}
              >
                Kar Payı
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Henüz işlem bulunmuyor</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>İşlem Türü</TableHead>
                  <TableHead>Referans</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString('tr-TR')}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{transaction.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTransactionTypeColor(transaction.type)}>
                        {getTransactionTypeLabel(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {transaction.reference || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-semibold ${
                        transaction.type === "capital_increase" || transaction.type === "profit_distribution" ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.type === "capital_increase" || transaction.type === "profit_distribution" ? "+" : "-"}
                        {showBalances ? formatCurrency(transaction.amount, partner.currency) : "••••••"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerAccountDetail;
