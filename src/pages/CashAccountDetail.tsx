import { useState, useMemo, memo } from "react";
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
import TransferModal from "@/components/cashflow/modals/TransferModal";
import { useCashAccountDetail, useCashAccountTransactions } from "@/hooks/useAccountDetail";
import { Skeleton } from "@/components/ui/skeleton";

interface CashAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CashAccountDetail = memo(({ isCollapsed, setIsCollapsed }: CashAccountDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // React Query hooks ile optimize edilmiş veri çekme
  const { data: account, isLoading: isLoadingAccount, error: accountError } = useCashAccountDetail(id);
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useCashAccountTransactions(id, 20);
  
  const loading = isLoadingAccount || isLoadingTransactions;

  // Memoized calculations - sadece gerekli olduğunda yeniden hesapla
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (filterType === "all") return true;
      return transaction.type === filterType;
    });
  }, [transactions, filterType]);

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const handleIncomeSuccess = () => {
    setIsIncomeModalOpen(false);
    refetchTransactions();
  };

  const handleExpenseSuccess = () => {
    setIsExpenseModalOpen(false);
    refetchTransactions();
  };

  const handleEdit = () => {
    toast.info("Hesap düzenleme özelliği yakında eklenecek");
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Sticky Header Skeleton */}
          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Sol taraf */}
            <div className="space-y-6">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
            {/* Sağ taraf */}
            <div className="xl:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accountError || !account) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">Hesap bilgileri yüklenemedi.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">Geri Dön</Button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white shadow-lg">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
              <p className="text-gray-600">{account.description || "Nakit kasa hesabı"}</p>
            </div>
          </div>

          {/* Sağ taraf - Aksiyonlar */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? "Gizle" : "Göster"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-1" />
              Düzenle
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Dışa Aktar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          {/* Toplam Bakiye */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Toplam Bakiye</p>
                  <p className="text-3xl font-bold text-green-900">
                    {showBalances ? formatCurrency(account.current_balance, account.currency) : "••••••"}
                  </p>
                </div>
                <div className="p-3 bg-green-500 rounded-full">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Toplam Gelir */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Toplam Gelir</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {showBalances ? formatCurrency(totalIncome, account.currency) : "••••••"}
                  </p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Toplam Gider */}
          <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Toplam Gider</p>
                  <p className="text-3xl font-bold text-red-900">
                    {showBalances ? formatCurrency(totalExpense, account.currency) : "••••••"}
                  </p>
                </div>
                <div className="p-3 bg-red-500 rounded-full">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button 
            onClick={() => setIsIncomeModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Gelir Ekle
          </Button>
          <Button 
            onClick={() => setIsExpenseModalOpen(true)}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Minus className="h-4 w-4 mr-2" />
            Gider Ekle
          </Button>
          <Button 
            onClick={() => setIsTransferModalOpen(true)}
            variant="outline"
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Transfer Yap
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrele
          </Button>
        </div>

        {/* Transactions Table */}
        <Card className="mt-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                İşlem Geçmişi
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Henüz işlem bulunmuyor</p>
                <p className="text-sm text-gray-400 mt-1">İlk işleminizi ekleyerek başlayın</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === "income" ? "default" : "destructive"}
                          className={transaction.type === "income" ? "bg-green-100 text-green-800" : ""}
                        >
                          {transaction.type === "income" ? "Gelir" : "Gider"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={transaction.type === "income" ? "text-green-600" : "text-red-600"}>
                          {transaction.type === "income" ? "+" : "-"}
                          {showBalances ? formatCurrency(transaction.amount, account.currency) : "••••••"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CashIncomeModal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          onSuccess={handleIncomeSuccess}
          accountId={id}
          accountName={account?.name || ""}
          currency={account?.currency || "TRY"}
        />
        <CashExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={handleExpenseSuccess}
          accountId={id}
          accountName={account?.name || ""}
          currency={account?.currency || "TRY"}
        />
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            window.location.reload();
          }}
        />
      </div>
  );
});

export default CashAccountDetail;