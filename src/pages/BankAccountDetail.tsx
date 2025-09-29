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
  ArrowUpDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import AccountDetailLayout from "@/components/layouts/AccountDetailLayout";
import Navbar from "@/components/Navbar";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_type: "vadesiz" | "vadeli" | "kredi" | "pos";
  account_number: string;
  iban: string;
  currency: string;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  category: string;
  date: string;
  reference?: string;
  balance_after: number;
}

interface BankAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const BankAccountDetail = ({ isCollapsed, setIsCollapsed }: BankAccountDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "credit" | "debit">("all");

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
      const mockAccount: BankAccount = {
        id: id!,
        account_name: "Ana Vadesiz Hesap",
        bank_name: "Türkiye İş Bankası",
        account_type: "vadesiz",
        account_number: "1234567890",
        iban: "TR12 0006 4000 0011 2345 6789 01",
        currency: "TRY",
        current_balance: 250000.75,
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
          amount: 15000,
          type: "credit",
          description: "Müşteri ödemesi",
          category: "Satış",
          date: "2024-01-20T14:30:00Z",
          reference: "TRF-2024-001",
          balance_after: 265000.75
        },
        {
          id: "2",
          account_id: id!,
          amount: 5000,
          type: "debit",
          description: "Tedarikçi ödemesi",
          category: "Gider",
          date: "2024-01-19T10:15:00Z",
          reference: "TRF-2024-002",
          balance_after: 250000.75
        },
        {
          id: "3",
          account_id: id!,
          amount: 8000,
          type: "credit",
          description: "Hizmet geliri",
          category: "Hizmet",
          date: "2024-01-18T16:45:00Z",
          reference: "TRF-2024-003",
          balance_after: 255000.75
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast.error("İşlem geçmişi yüklenirken hata oluştu");
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "vadesiz":
        return "Vadesiz Hesap";
      case "vadeli":
        return "Vadeli Hesap";
      case "kredi":
        return "Kredi Hesabı";
      case "pos":
        return "POS Hesabı";
      default:
        return type;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  const totalCredit = transactions
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = transactions
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalCredit - totalDebit;

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
            <div className="text-6xl mb-4">🏦</div>
            <h2 className="text-xl font-semibold mb-2">Hesap bulunamadı</h2>
            <p className="text-gray-600 mb-4">Aradığınız banka hesabı bulunamadı.</p>
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
        name: account.account_name,
        type: `${account.bank_name} • ${getAccountTypeLabel(account.account_type)}`,
        current_balance: account.current_balance,
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
      accountType="bank"
    >
      {/* Account Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Hesap Numarası</span>
                <span className="text-sm font-mono">{account.account_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">IBAN</span>
                <span className="text-sm font-mono">{account.iban}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Hesap Türü</span>
                <Badge variant="outline">{getAccountTypeLabel(account.account_type)}</Badge>
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

      {/* Transaction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gelen</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? formatCurrency(totalCredit, account.currency) : "••••••"}
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
                <p className="text-sm font-medium text-gray-600">Giden</p>
                <p className="text-2xl font-bold text-red-600">
                  {showBalances ? formatCurrency(totalDebit, account.currency) : "••••••"}
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
                <p className="text-sm font-medium text-gray-600">Net Akış</p>
                <p className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {showBalances ? formatCurrency(netFlow, account.currency) : "••••••"}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${netFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {netFlow >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
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
                variant={filterType === "credit" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("credit")}
              >
                Gelen
              </Button>
              <Button
                variant={filterType === "debit" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("debit")}
              >
                Giden
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
                <TableHead className="text-right">Bakiye</TableHead>
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
                      transaction.type === "credit" ? "text-green-600" : "text-red-600"
                    }`}>
                      {showBalances ? (
                        <>
                          {transaction.type === "credit" ? "+" : "-"}
                          {formatCurrency(transaction.amount, account.currency)}
                        </>
                      ) : (
                        "••••••"
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    {showBalances ? formatCurrency(transaction.balance_after, account.currency) : "••••••"}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {filterType === "all" ? "Henüz işlem bulunmuyor" : 
                     filterType === "credit" ? "Gelen işlem bulunmuyor" : 
                     "Giden işlem bulunmuyor"}
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

export default BankAccountDetail;