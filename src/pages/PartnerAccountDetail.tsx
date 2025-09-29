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
  Users,
  Percent
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import AccountDetailLayout from "@/components/layouts/AccountDetailLayout";
import Navbar from "@/components/Navbar";

interface PartnerAccount {
  id: string;
  partner_name: string;
  partner_type: "ortak" | "yatırımcı" | "müdür" | "diğer";
  ownership_percentage: number;
  initial_capital: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: "capital_increase" | "capital_decrease" | "profit_distribution" | "loss_share";
  description: string;
  category: string;
  date: string;
  reference?: string;
}

interface PartnerAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const PartnerAccountDetail = ({ isCollapsed, setIsCollapsed }: PartnerAccountDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<PartnerAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "capital_increase" | "capital_decrease" | "profit_distribution" | "loss_share">("all");

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
      const mockAccount: PartnerAccount = {
        id: id!,
        partner_name: "Ahmet Yılmaz",
        partner_type: "ortak",
        ownership_percentage: 60,
        initial_capital: 1000000,
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
          amount: 50000,
          type: "capital_increase",
          description: "Sermaye artırımı",
          category: "Sermaye",
          date: "2024-01-20T14:30:00Z",
          reference: "CAP-2024-001"
        },
        {
          id: "2",
          account_id: id!,
          amount: 25000,
          type: "profit_distribution",
          description: "Kar dağıtımı",
          category: "Kar",
          date: "2024-01-19T10:15:00Z",
          reference: "PROF-2024-002"
        },
        {
          id: "3",
          account_id: id!,
          amount: 10000,
          type: "capital_decrease",
          description: "Sermaye çekimi",
          category: "Sermaye",
          date: "2024-01-18T16:45:00Z",
          reference: "CAP-2024-003"
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast.error("İşlem geçmişi yüklenirken hata oluştu");
    }
  };

  const getPartnerTypeLabel = (type: string) => {
    switch (type) {
      case "ortak":
        return "Ortak";
      case "yatırımcı":
        return "Yatırımcı";
      case "müdür":
        return "Müdür";
      case "diğer":
        return "Diğer";
      default:
        return type;
    }
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

  const totalLossShare = transactions
    .filter(t => t.type === "loss_share")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCapitalChange = totalCapitalIncrease - totalCapitalDecrease;
  const currentCapital = account ? account.initial_capital + netCapitalChange : 0;

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
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold mb-2">Ortak bulunamadı</h2>
            <p className="text-gray-600 mb-4">Aradığınız şirket ortağı bulunamadı.</p>
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
        name: account.partner_name,
        type: `${getPartnerTypeLabel(account.partner_type)} • %${account.ownership_percentage} hisse`,
        current_balance: currentCapital,
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
      accountType="partner"
    >
      {/* Partner Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Ortak Adı</span>
                <span className="text-sm font-semibold">{account.partner_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Ortak Türü</span>
                <Badge variant="outline">{getPartnerTypeLabel(account.partner_type)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Hisse Oranı</span>
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold">%{account.ownership_percentage}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Başlangıç Sermayesi</span>
                <span className="text-sm font-semibold">
                  {showBalances ? formatCurrency(account.initial_capital, account.currency) : "••••••"}
                </span>
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

      {/* Capital Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Güncel Sermaye</p>
                <p className="text-2xl font-bold text-blue-600">
                  {showBalances ? formatCurrency(currentCapital, account.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sermaye Artışı</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? formatCurrency(totalCapitalIncrease, account.currency) : "••••••"}
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
                <p className="text-sm font-medium text-gray-600">Sermaye Çekimi</p>
                <p className="text-2xl font-bold text-red-600">
                  {showBalances ? formatCurrency(totalCapitalDecrease, account.currency) : "••••••"}
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
                <p className="text-sm font-medium text-gray-600">Net Değişim</p>
                <p className={`text-2xl font-bold ${netCapitalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {showBalances ? formatCurrency(netCapitalChange, account.currency) : "••••••"}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${netCapitalChange >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {netCapitalChange >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit/Loss Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kar Dağıtımı</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? formatCurrency(totalProfitDistribution, account.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Zarar Payı</p>
                <p className="text-2xl font-bold text-red-600">
                  {showBalances ? formatCurrency(totalLossShare, account.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Minus className="h-6 w-6 text-red-600" />
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
                variant={filterType === "capital_increase" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("capital_increase")}
              >
                Sermaye Artışı
              </Button>
              <Button
                variant={filterType === "capital_decrease" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("capital_decrease")}
              >
                Sermaye Çekimi
              </Button>
              <Button
                variant={filterType === "profit_distribution" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("profit_distribution")}
              >
                Kar Dağıtımı
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
                      transaction.type === "capital_increase" || transaction.type === "profit_distribution" 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      {showBalances ? (
                        <>
                          {transaction.type === "capital_increase" || transaction.type === "profit_distribution" ? "+" : "-"}
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
                     "Bu türde işlem bulunmuyor"}
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

export default PartnerAccountDetail;