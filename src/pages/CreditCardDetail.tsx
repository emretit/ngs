import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Filter,
  Download,
  CreditCard
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import AccountDetailLayout from "@/components/layouts/AccountDetailLayout";
import Navbar from "@/components/Navbar";

interface CreditCardAccount {
  id: string;
  card_name: string;
  bank_name: string;
  card_number: string;
  card_type: "visa" | "mastercard" | "amex" | "other";
  expiry_date: string;
  credit_limit: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: "purchase" | "payment";
  description: string;
  category: string;
  date: string;
  reference?: string;
}

interface CreditCardDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CreditCardDetail = ({ isCollapsed, setIsCollapsed }: CreditCardDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<CreditCardAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "purchase" | "payment">("all");

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
      fetchTransactions();
    }
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      // TODO: Supabase'den hesap detaylarını çek
      // Şimdilik mock data
      const mockAccount: CreditCardAccount = {
        id: id!,
        card_name: "İş Bankası Kredi Kartı",
        bank_name: "Türkiye İş Bankası",
        card_number: "1234-5678-9012-3456",
        card_type: "visa",
        expiry_date: "2026-12-31T23:59:59Z",
        credit_limit: 50000,
        currency: "TRY",
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-20T15:30:00Z"
      };
      setAccount(mockAccount);
    } catch (error) {
      toast.error("Hesap bilgileri yüklenirken hata oluştu");
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
          account_id: id!,
          amount: 2500,
          type: "purchase",
          description: "Online alışveriş",
          category: "E-ticaret",
          date: "2024-01-20T14:30:00Z",
          reference: "POS-2024-001"
        },
        {
          id: "2",
          account_id: id!,
          amount: 10000,
          type: "payment",
          description: "Kart ödemesi",
          category: "Ödeme",
          date: "2024-01-19T10:15:00Z",
          reference: "PAY-2024-002"
        },
        {
          id: "3",
          account_id: id!,
          amount: 1500,
          type: "purchase",
          description: "Yakıt alımı",
          category: "Ulaşım",
          date: "2024-01-18T16:45:00Z",
          reference: "POS-2024-003"
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast.error("İşlem geçmişi yüklenirken hata oluştu");
    }
  };

  const getCardTypeLabel = (type: string) => {
    switch (type) {
      case "visa":
        return "Visa";
      case "mastercard":
        return "Mastercard";
      case "amex":
        return "American Express";
      default:
        return "Diğer";
    }
  };

  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case "visa":
        return "💳";
      case "mastercard":
        return "💳";
      case "amex":
        return "💳";
      default:
        return "💳";
    }
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

  const currentBalance = totalPurchases - totalPayments;
  const availableCredit = account ? account.credit_limit - currentBalance : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-64"
        }`}>
          <div className="p-6">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-64"
        }`}>
          <div className="p-6 text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h2 className="text-xl font-semibold mb-2">Kart bulunamadı</h2>
            <p className="text-gray-600 mb-4">Aradığınız kredi kartı bulunamadı.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AccountDetailLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      account={{
        id: account.id,
        name: account.card_name,
        type: `${account.bank_name} • ${getCardTypeLabel(account.card_type)}`,
        current_balance: currentBalance,
        currency: account.currency,
        is_active: account.is_active,
        created_at: account.created_at
      }}
      showBalances={showBalances}
      setShowBalances={setShowBalances}
      onAddTransaction={() => {
        // TODO: Yeni işlem modal'ını aç
        toast.success("Yeni işlem özelliği yakında eklenecek");
      }}
      accountType="credit"
    >
      {/* Card Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Kart Numarası</span>
                <span className="text-sm font-mono">{account.card_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Kart Türü</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCardTypeIcon(account.card_type)}</span>
                  <Badge variant="outline">{getCardTypeLabel(account.card_type)}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Son Kullanma</span>
                <span className="text-sm font-mono">
                  {new Date(account.expiry_date).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Banka</span>
                <span className="text-sm font-semibold">{account.bank_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Para Birimi</span>
                <span className="text-sm font-semibold">{account.currency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Son Güncelleme</span>
                <span className="text-sm text-gray-500">
                  {new Date(account.updated_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kredi Limiti</p>
                <p className="text-2xl font-bold text-blue-600">
                  {showBalances ? formatCurrency(account.credit_limit, account.currency) : "••••••"}
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
                  {showBalances ? formatCurrency(currentBalance, account.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kalan Limit</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? formatCurrency(availableCredit, account.currency) : "••••••"}
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
                <p className="text-sm font-medium text-gray-600">Kullanım Oranı</p>
                <p className="text-2xl font-bold text-orange-600">
                  {showBalances ? `${Math.round((currentBalance / account.credit_limit) * 100)}%` : "••••"}
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-lg">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Harcamalar</p>
                <p className="text-2xl font-bold text-red-600">
                  {showBalances ? formatCurrency(totalPurchases, account.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Minus className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ödemeler</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? formatCurrency(totalPayments, account.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>İşlem Geçmişi</CardTitle>
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <span className={`font-semibold ${
                      transaction.type === "payment" ? "text-green-600" : "text-red-600"
                    }`}>
                      {showBalances ? (
                        <>
                          {transaction.type === "payment" ? "+" : "-"}
                          {formatCurrency(transaction.amount, account.currency)}
                        </>
                      ) : (
                        "••••••"
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {filterType === "all" ? "Henüz işlem bulunmuyor" : 
                     filterType === "purchase" ? "Harcama bulunmuyor" : 
                     "Ödeme bulunmuyor"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AccountDetailLayout>
  );
};

export default CreditCardDetail;