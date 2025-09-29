import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  CreditCard, 
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
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  card_id: string;
  amount: number;
  type: "purchase" | "payment" | "refund";
  description: string;
  category: string;
  date: string;
  reference?: string;
}

const CreditCardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<CreditCardAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "purchase" | "payment" | "refund">("all");

  useEffect(() => {
    if (id) {
      fetchCardDetails();
      fetchTransactions();
    }
  }, [id]);

  const fetchCardDetails = async () => {
    try {
      setLoading(true);
      // TODO: Supabase'den kart detaylarını çek
      // Şimdilik mock data
      const mockCard: CreditCardAccount = {
        id: id!,
        card_name: "İş Bankası Kredi Kartı",
        card_number: "1234567890123456",
        bank_name: "Türkiye İş Bankası",
        card_type: "credit",
        credit_limit: 50000,
        current_balance: 12500.75,
        available_limit: 37499.25,
        currency: "TRY",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T15:30:00Z"
      };
      setCard(mockCard);
    } catch (error) {
      toast.error("Kart bilgileri yüklenirken hata oluştu");
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
          card_id: id!,
          amount: 2500,
          type: "purchase",
          description: "Market alışverişi",
          category: "Gıda",
          date: "2024-01-20T14:30:00Z",
          reference: "POS-001"
        },
        {
          id: "2",
          card_id: id!,
          amount: 5000,
          type: "payment",
          description: "Kart ödemesi",
          category: "Ödeme",
          date: "2024-01-19T10:15:00Z",
          reference: "PAY-001"
        },
        {
          id: "3",
          card_id: id!,
          amount: 1200,
          type: "purchase",
          description: "Yakıt",
          category: "Ulaşım",
          date: "2024-01-18T16:45:00Z",
          reference: "POS-002"
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast.error("İşlem geçmişi yüklenirken hata oluştu");
    }
  };

  const formatCardNumber = (number: string) => {
    return number.replace(/(\d{4})(?=\d)/g, '$1 ');
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

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  const totalPurchases = transactions
    .filter(t => t.type === "purchase")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalPayments = transactions
    .filter(t => t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const usagePercentage = card ? (card.current_balance / card.credit_limit) * 100 : 0;

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

  if (!card) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Kart bulunamadı</h2>
        <p className="text-gray-600 mb-4">Aradığınız kredi kartı bulunamadı.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">{card.card_name}</h1>
            <p className="text-gray-600">{card.bank_name} • {formatCardNumber(card.card_number)}</p>
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

      {/* Card Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kullanılabilir Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showBalances ? formatCurrency(card.available_limit, card.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kullanılan</p>
                <p className="text-2xl font-bold text-red-600">
                  {showBalances ? formatCurrency(card.current_balance, card.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Limit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showBalances ? formatCurrency(card.credit_limit, card.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kullanım Oranı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showBalances ? `${usagePercentage.toFixed(1)}%` : "••••"}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${usagePercentage > 80 ? 'bg-red-100' : usagePercentage > 60 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                {usagePercentage > 80 ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : usagePercentage > 60 ? (
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-green-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Limit Kullanımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Kullanılan: {showBalances ? formatCurrency(card.current_balance, card.currency) : "••••••"}</span>
              <span>Toplam: {showBalances ? formatCurrency(card.credit_limit, card.currency) : "••••••"}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  usagePercentage > 80 ? 'bg-red-500' : 
                  usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{width: `${usagePercentage}%`}}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span className={usagePercentage > 80 ? 'text-red-600 font-semibold' : ''}>
                {usagePercentage.toFixed(1)}% kullanıldı
              </span>
              <span>{formatCurrency(card.credit_limit, card.currency)}</span>
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
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ödeme Yap
            </Button>
            <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
              <Minus className="h-4 w-4 mr-2" />
              Limit Artır
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Ekstre İndir
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
                variant={filterType === "purchase" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("purchase")}
              >
                Harcamalar
              </Button>
              <Button
                variant={filterType === "payment" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("payment")}
              >
                Ödemeler
              </Button>
              <Button
                variant={filterType === "refund" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("refund")}
              >
                İadeler
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
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Henüz işlem bulunmuyor</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead>Kategori</TableHead>
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
                    <TableCell className="text-gray-500">
                      {transaction.reference || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-semibold ${
                        transaction.type === "purchase" ? "text-red-600" : 
                        transaction.type === "payment" ? "text-green-600" : "text-blue-600"
                      }`}>
                        {transaction.type === "purchase" ? "-" : 
                         transaction.type === "payment" ? "+" : "+"}
                        {showBalances ? formatCurrency(transaction.amount, card.currency) : "••••••"}
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

export default CreditCardDetail;
