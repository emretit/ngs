import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Building2, 
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
  ArrowUpDown
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

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

const BankAccountDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
          reference: "EFT-001",
          balance_after: 250000.75
        },
        {
          id: "2",
          account_id: id!,
          amount: 5000,
          type: "debit",
          description: "Tedarikçi ödemesi",
          category: "Tedarik",
          date: "2024-01-20T10:15:00Z",
          reference: "EFT-002",
          balance_after: 235000.75
        },
        {
          id: "3",
          account_id: id!,
          amount: 25000,
          type: "credit",
          description: "Kredi çekimi",
          category: "Finansman",
          date: "2024-01-19T16:45:00Z",
          reference: "KRD-001",
          balance_after: 240000.75
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      toast.error("İşlem geçmişi yüklenirken hata oluştu");
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'vadesiz': 'Vadesiz Hesap',
      'vadeli': 'Vadeli Hesap',
      'kredi': 'Kredi Hesabı',
      'pos': 'POS Hesabı'
    };
    return types[type] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'vadesiz': 'bg-blue-100 text-blue-800',
      'vadeli': 'bg-green-100 text-green-800',
      'kredi': 'bg-red-100 text-red-800',
      'pos': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  const totalCredits = transactions
    .filter(t => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebits = transactions
    .filter(t => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalCredits - totalDebits;

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

  if (!account) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h2 className="text-xl font-semibold mb-2">Hesap bulunamadı</h2>
        <p className="text-gray-600 mb-4">Aradığınız banka hesabı bulunamadı.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">{account.account_name}</h1>
            <p className="text-gray-600">{account.bank_name} • {getAccountTypeLabel(account.account_type)}</p>
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

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Güncel Bakiye</p>
                <p className="text-2xl font-bold text-gray-900">
                  {showBalances ? formatCurrency(account.current_balance, account.currency) : "••••••"}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gelen</p>
                <p className="text-2xl font-bold text-green-600">
                  {showBalances ? formatCurrency(totalCredits, account.currency) : "••••••"}
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
                  {showBalances ? formatCurrency(totalDebits, account.currency) : "••••••"}
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

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hesap Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Hesap Numarası</p>
              <p className="text-lg font-mono">{account.account_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">IBAN</p>
              <p className="text-lg font-mono">{account.iban}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Hesap Türü</p>
              <Badge className={getAccountTypeColor(account.account_type)}>
                {getAccountTypeLabel(account.account_type)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Para Birimi</p>
              <p className="text-lg">{account.currency}</p>
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
              Para Yatır
            </Button>
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              <Minus className="h-4 w-4 mr-2" />
              Para Çek
            </Button>
            <Button variant="outline">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Transfer
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              EFT/HAVALE
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
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                      <span className={`font-mono font-semibold ${
                        transaction.type === "credit" ? "text-green-600" : "text-red-600"
                      }`}>
                        {transaction.type === "credit" ? "+" : "-"}
                        {showBalances ? formatCurrency(transaction.amount, account.currency) : "••••••"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">
                      {showBalances ? formatCurrency(transaction.balance_after, account.currency) : "••••••"}
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

export default BankAccountDetail;
