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
  Download
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import AccountDetailLayout from "@/components/layouts/AccountDetailLayout";
import Navbar from "@/components/Navbar";

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

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string;
  date: string;
  reference?: string;
}

interface CashAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CashAccountDetail = ({ isCollapsed, setIsCollapsed }: CashAccountDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<CashAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

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
      const mockAccount: CashAccount = {
        id: id!,
        name: "Ana Kasa",
        description: "Günlük nakit işlemler için ana kasa",
        current_balance: 125000.50,
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
          amount: 5000,
          type: "income",
          description: "Satış geliri",
          category: "Satış",
          date: "2024-01-20T14:30:00Z",
          reference: "SAT-2024-001"
        },
        {
          id: "2",
          account_id: id!,
          amount: 1500,
          type: "expense",
          description: "Ofis malzemeleri",
          category: "Gider",
          date: "2024-01-19T10:15:00Z",
          reference: "GDR-2024-002"
        },
        {
          id: "3",
          account_id: id!,
          amount: 2500,
          type: "income",
          description: "Hizmet geliri",
          category: "Hizmet",
          date: "2024-01-18T16:45:00Z",
          reference: "HZM-2024-003"
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast.error("İşlem geçmişi yüklenirken hata oluştu");
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalIncome - totalExpense;

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
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-xl font-semibold mb-2">Hesap bulunamadı</h2>
            <p className="text-gray-600 mb-4">Aradığınız nakit kasa hesabı bulunamadı.</p>
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
        name: account.name,
        type: "Nakit Kasa",
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
      accountType="cash"
    >
      {/* Transaction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gelen</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? formatCurrency(totalIncome, account.currency) : "••••••"}
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
                  {showBalances ? formatCurrency(totalExpense, account.currency) : "••••••"}
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
                variant={filterType === "income" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("income")}
              >
                Gelen
              </Button>
              <Button
                variant={filterType === "expense" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("expense")}
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
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}>
                      {showBalances ? (
                        <>
                          {transaction.type === "income" ? "+" : "-"}
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
                     filterType === "income" ? "Gelen işlem bulunmuyor" : 
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

export default CashAccountDetail;