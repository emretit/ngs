import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ArrowLeft,
  Pencil,
  Building,
  Activity,
  Receipt,
  FileText,
  Settings
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  iban: string;
  swift_code?: string;
  account_type: string;
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
  balance_after?: number;
}

interface BankAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const BankAccountDetail = ({ isCollapsed, setIsCollapsed }: BankAccountDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<BankAccount | null>(null);
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
      const mockAccount: BankAccount = {
        id: id!,
        account_name: "Ana Banka Hesabı",
        bank_name: "Türkiye İş Bankası",
        account_number: "1234567890",
        iban: "TR1234567890123456789012345",
        swift_code: "ISBKTRIS",
        account_type: "Vadesiz",
        current_balance: 250000.75,
        currency: "TRY",
        is_active: true,
        created_at: "2024-01-10T09:00:00Z",
        updated_at: "2024-01-20T16:45:00Z"
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
          type: "income",
          description: "Müşteri ödemesi",
          category: "Satış",
          date: "2024-01-20T14:30:00Z",
          reference: "EFT-2024-001",
          balance_after: 250000.75
        },
        {
          id: "2",
          account_id: id!,
          amount: 5000,
          type: "expense",
          description: "Ofis kirası",
          category: "Kira",
          date: "2024-01-19T10:15:00Z",
          reference: "EFT-2024-002",
          balance_after: 240000.75
        },
        {
          id: "3",
          account_id: id!,
          amount: 8000,
          type: "income",
          description: "Hizmet geliri",
          category: "Hizmet",
          date: "2024-01-18T16:45:00Z",
          reference: "EFT-2024-003",
          balance_after: 245000.75
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

  const handleEdit = () => {
    toast.info("Düzenleme özelliği yakında eklenecek");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex relative">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}>
          <TopBar />
          <div className="p-4 sm:p-8">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
                  <span className="text-gray-600">Hesap bilgileri yükleniyor...</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex relative">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}>
          <TopBar />
          <div className="p-4 sm:p-8">
            <div className="max-w-[1600px] mx-auto">
              <div className="text-center py-8">
                <p className="text-gray-500">Hesap bilgileri yüklenemedi.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
      }`}>
        <TopBar />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
              <Building className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {account.account_name}
              </h1>
              <p className="text-xs text-muted-foreground/70">
                {account.bank_name} - {account.account_type}
              </p>
            </div>
          </div>
          
          {/* Orta - İstatistik Kartları */}
          <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
            {/* Bakiye */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
              <span className="font-bold">Bakiye</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(account.current_balance, account.currency) : "••••••"}
              </span>
            </div>

            {/* Durum */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
              <span className="font-medium">Durum</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {account.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>

            {/* Gelen */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Gelen</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(totalIncome, account.currency) : "••••••"}
              </span>
            </div>

            {/* Giden */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
              <TrendingDown className="h-3 w-3" />
              <span className="font-medium">Giden</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(totalExpense, account.currency) : "••••••"}
              </span>
            </div>
          </div>
          
          {/* Sağ taraf - Butonlar */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center gap-2"
            >
              {showBalances ? 'Bakiyeleri Gizle' : 'Bakiyeleri Göster'}
            </Button>
            <Button 
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
              onClick={handleEdit}
            >
              <Pencil className="h-4 w-4" />
              <span>Düzenle</span>
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-8">
          <div className="max-w-[1600px] mx-auto space-y-4">
            {/* Tabs Section */}
            <CustomTabs defaultValue="transactions" className="space-y-4">
              <CustomTabsList className="grid grid-cols-4 w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm">
                <CustomTabsTrigger 
                  value="transactions" 
                  className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden md:inline">İşlemler</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger 
                  value="reports" 
                  className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden md:inline">Raporlar</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger 
                  value="statements" 
                  className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
                >
                  <Receipt className="h-4 w-4" />
                  <span className="hidden md:inline">Ekstreler</span>
                </CustomTabsTrigger>
                <CustomTabsTrigger 
                  value="settings" 
                  className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Ayarlar</span>
                </CustomTabsTrigger>
              </CustomTabsList>

              <CustomTabsContent value="transactions">
                <Card className="p-6">
                  <div className="space-y-6">
                    {/* İşlem Geçmişi */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">İşlem Geçmişi</h3>
                        <div className="flex items-center gap-2">
                          <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as "all" | "income" | "expense")}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="all">Tümü</option>
                            <option value="income">Gelirler</option>
                            <option value="expense">Giderler</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tarih</TableHead>
                              <TableHead>Açıklama</TableHead>
                              <TableHead>Kategori</TableHead>
                              <TableHead>Referans</TableHead>
                              <TableHead className="text-right">Tutar</TableHead>
                              <TableHead className="text-right">Bakiye Sonrası</TableHead>
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
                                  <span className={`font-medium ${
                                    transaction.type === "income" ? "text-green-600" : "text-red-600"
                                  }`}>
                                    {transaction.type === "income" ? "+" : "-"}
                                    {showBalances ? formatCurrency(transaction.amount, account.currency) : "••••••"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right text-gray-500">
                                  {showBalances && transaction.balance_after 
                                    ? formatCurrency(transaction.balance_after, account.currency)
                                    : "••••••"
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                            {filteredTransactions.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                  Bu filtreye uygun işlem bulunamadı
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </Card>
              </CustomTabsContent>

              <CustomTabsContent value="reports">
                <Card className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Raporlar</h3>
                    <p className="text-gray-600">Hesap raporları yakında eklenecek.</p>
                  </div>
                </Card>
              </CustomTabsContent>

              <CustomTabsContent value="statements">
                <Card className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Receipt className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ekstreler</h3>
                    <p className="text-gray-600">Hesap ekstreleri yakında eklenecek.</p>
                  </div>
                </Card>
              </CustomTabsContent>

              <CustomTabsContent value="settings">
                <Card className="p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Settings className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ayarlar</h3>
                    <p className="text-gray-600">Hesap ayarları yakında eklenecek.</p>
                  </div>
                </Card>
              </CustomTabsContent>
            </CustomTabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BankAccountDetail;