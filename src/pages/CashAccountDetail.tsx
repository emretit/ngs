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
  Filter,
  Download,
  ArrowLeft,
  Pencil,
  Wallet,
  FileText
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import CashIncomeModal from "@/components/cashflow/modals/CashIncomeModal";
import CashExpenseModal from "@/components/cashflow/modals/CashExpenseModal";
import { supabase } from "@/integrations/supabase/client";

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
  transaction_date: string;
  reference?: string;
}

interface CashAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CashAccountDetail = ({ isCollapsed, setIsCollapsed }: CashAccountDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<CashAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
      fetchTransactions();
    }
  }, [id]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const { data: accountData, error } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('id', id)
        .eq('company_id', profile.company_id)
        .single();

      if (error) throw error;
      if (!accountData) throw new Error("Hesap bulunamadı");

      setAccount(accountData);
    } catch (error) {
      console.error('Error fetching account details:', error);
      toast.error("Hesap bilgileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      const { data: transactionsData, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('account_id', id)
        .eq('company_id', profile.company_id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error("İşlem geçmişi yüklenirken hata oluştu");
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalIncome - totalExpense;

  const handleEdit = () => {
    toast.info("Hesap düzenleme özelliği yakında eklenecek");
  };

  if (loading || !account) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-4 border-t-green-600 border-green-200 rounded-full animate-spin"></div>
              <span className="text-gray-600">Nakit kasa bilgileri yükleniyor...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType === "all") return true;
    return transaction.type === filterType;
  });

  return (
    <div className="p-6">
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
            <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {account.name}
              </h1>
              <p className="text-xs text-muted-foreground/70">
                {account.description || 'Nakit kasa hesabı'}
              </p>
            </div>
          </div>
          
          {/* Orta - İstatistik Kartları */}
          <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
            {/* Bakiye */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-green-600 to-green-700 text-white border border-green-600 shadow-sm">
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
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
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
              className="flex items-center gap-2 bg-white border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
            >
              {showBalances ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
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
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Hızlı İşlemler */}
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsIncomeModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Gelir Ekle
              </Button>
              <Button 
                size="sm"
                variant="outline" 
                className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                <Minus className="h-4 w-4" />
                Gider Ekle
              </Button>
              <Button 
                size="sm"
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => toast.info("Transfer özelliği yakında eklenecek")}
              >
                <Download className="h-4 w-4" />
                Transfer
              </Button>
              <Button 
                size="sm"
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => toast.info("Rapor özelliği yakında eklenecek")}
              >
                <FileText className="h-4 w-4" />
                Rapor
              </Button>
            </div>

            {/* İşlem Geçmişi */}
            <Card className="p-6">
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
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrele
                  </Button>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
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
                      </TableRow>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Bu filtreye uygun işlem bulunamadı
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>

        {/* Modals */}
        {account && (
          <>
            <CashIncomeModal
              isOpen={isIncomeModalOpen}
              onClose={() => setIsIncomeModalOpen(false)}
              onSuccess={() => {
                fetchAccountDetails();
                fetchTransactions();
              }}
              accountId={account.id}
              accountName={account.name}
              currency={account.currency}
            />
            <CashExpenseModal
              isOpen={isExpenseModalOpen}
              onClose={() => setIsExpenseModalOpen(false)}
              onSuccess={() => {
                fetchAccountDetails();
                fetchTransactions();
              }}
              accountId={account.id}
              accountName={account.name}
              currency={account.currency}
            />
          </>
        )}
      </div>
  );
};

export default CashAccountDetail;