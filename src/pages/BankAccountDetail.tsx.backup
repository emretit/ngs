import { useState, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
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
  Settings,
  Percent,
  DollarSign,
  Calendar as CalendarIcon,
  UserCheck,
  PieChart,
  BarChart3,
  Target,
  Award,
  Search
} from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { toast } from "sonner";
import { useBankAccountDetail, useBankAccountTransactions } from "@/hooks/useAccountDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import BankIncomeModal from "@/components/cashflow/modals/BankIncomeModal";
import BankExpenseModal from "@/components/cashflow/modals/BankExpenseModal";
import BankAccountModal from "@/components/cashflow/modals/BankAccountModal";
import TransferModal from "@/components/cashflow/modals/TransferModal";
import { AccountTransactionHistory } from "@/components/cashflow/AccountTransactionHistory";

interface BankAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const BankAccountDetail = memo(({ isCollapsed, setIsCollapsed }: BankAccountDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);

  // React Query hooks ile optimize edilmiş veri çekme
  const { data: account, isLoading: isLoadingAccount, error: accountError } = useBankAccountDetail(id);
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useBankAccountTransactions(id, 20);
  
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
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['bank-account', id] });
    queryClient.invalidateQueries({ queryKey: ['bank-account-transactions', id] });
    refetchTransactions();
  };

  const queryClient = useQueryClient();

  // Silme mutation'ı
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      // Transfer işlemi ise
      if (transaction.isTransfer) {
        const transferId = transaction.id.replace('transfer_', '');
        const { error } = await supabase
          .from('account_transfers')
          .delete()
          .eq('id', transferId);
        
        if (error) throw error;
        return;
      }

      // Normal transaction ise - bank_transactions tablosundan sil
      if (transaction.id && !transaction.id.startsWith('transfer_')) {
        const { error } = await supabase
          .from('bank_transactions')
          .delete()
          .eq('id', transaction.id);
        
        if (error) throw error;

        // Bakiye güncellemesi - transaction tipine göre ters işlem yap
        if (account) {
          const balanceChange = transaction.type === 'income' 
            ? -transaction.amount  // Gelir silinirse bakiye azalır
            : transaction.amount;  // Gider silinirse bakiye artar

          const newBalance = (account.current_balance || 0) + balanceChange;
          
          await supabase
            .from('bank_accounts')
            .update({ current_balance: newBalance })
            .eq('id', id);
        }
      }
    },
    onSuccess: () => {
      toast.success("İşlem başarıyla silindi");
      queryClient.invalidateQueries({ queryKey: ['bank-account-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['bank-account', id] });
      refetchTransactions();
    },
    onError: (error: any) => {
      toast.error("İşlem silinirken hata oluştu: " + (error.message || "Bilinmeyen hata"));
    }
  });

  const handleDelete = (transaction: any) => {
    setTransactionToDelete(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    deleteTransactionMutation.mutate(transactionToDelete);
    setIsDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setTransactionToDelete(null);
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
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Banka Hesabı Bulunamadı</h2>
            <p className="text-gray-500 mb-4">Aradığınız banka hesabı bulunamadı veya erişim yetkiniz yok.</p>
            <Button onClick={() => navigate(-1)} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'vadesiz': 'Vadesiz',
      'vadeli': 'Vadeli',
      'kredi': 'Kredi',
      'pos': 'POS'
    };
    return types[type] || type;
  };

  const formatAccountNumber = (number: string | null) => {
    if (!number) return '****-****-****-****';
    return number.replace(/(.{4})/g, '$1-').slice(0, -1);
  };

  return (
    <div>
      {/* Sticky Header - optimize spacing */}
      <div className="sticky top-0 z-20 bg-white rounded-lg border border-gray-200 shadow-sm mb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
          {/* Sol taraf - Başlık */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200 hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Banka Hesapları</span>
            </Button>
            
            <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
              <Building className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {account.account_name}
              </h1>
              <p className="text-xs text-muted-foreground/70">
                {getAccountTypeLabel(account.account_type)} • {account.is_active ? "Aktif" : "Pasif"}
              </p>
            </div>
          </div>
          
          {/* Orta - İstatistik Kartları */}
          <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
            {/* Kredi Limiti */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
              <Target className="h-3 w-3" />
              <span className="font-bold">Limit</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(account.credit_limit || 0, account.currency) : "••••••"}
              </span>
            </div>
            
            {/* Mevcut Bakiye */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-blue-100 text-blue-800 border-blue-200">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium">Bakiye</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(account.current_balance, account.currency) : "••••••"}
              </span>
            </div>
            
            {/* Kullanılabilir Bakiye */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-green-100 text-green-800 border-green-200">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Kullanılabilir</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(account.available_balance, account.currency) : "••••••"}
              </span>
            </div>
            
            {/* Toplam Gider */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-red-100 text-red-800 border-red-200">
              <TrendingDown className="h-3 w-3" />
              <span className="font-medium">Gider</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(totalExpense, account.currency) : "••••••"}
              </span>
            </div>
          </div>
          
          {/* Sağ taraf - Butonlar */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowBalances(!showBalances)}
              className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-50/50 hover:text-gray-700 hover:border-gray-200 transition-all duration-200 hover:shadow-sm"
            >
              <span className="font-medium">{showBalances ? "Gizle" : "Göster"}</span>
            </Button>
            <Button 
              onClick={handleEdit}
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-600/90 hover:from-blue-600/90 hover:to-blue-600/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
            >
              <Pencil className="h-4 w-4" />
              <span>Düzenle</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="flex flex-col sm:flex-row gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 mb-2">
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="İşlem açıklaması veya kategori ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-2">
        {/* Main Grid Layout - Sol: Kompakt Bilgiler, Sağ: Geniş İşlem Geçmişi */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
          {/* Sol Taraf - Kompakt Bilgiler ve İşlemler */}
          <div className="xl:col-span-3 space-y-2">
            {/* Hesap Bilgileri ve Hızlı İşlemler - Tek Kart */}
            <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl">
              <CardHeader className="pb-2 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                      <Building className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    Hesap & İşlemler
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3 space-y-3">
                {/* Hesap Bilgileri - Kompakt */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Hesap Adı</label>
                    <p className="text-xs font-semibold truncate">{account.account_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Para Birimi</label>
                    <p className="text-xs">{account.currency}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Durum</label>
                    <Badge 
                      className={`text-[10px] h-4 px-1.5 ${
                        account.is_active
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <Activity className="h-2.5 w-2.5 mr-0.5" />
                      {account.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                </div>

                {/* Hızlı İşlemler */}
                <div className="border-t pt-2">
                  <div className="grid grid-cols-1 gap-1.5">
                    <Button 
                      onClick={() => setIsIncomeModalOpen(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-xs h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Gelir
                    </Button>
                    <Button 
                      onClick={() => setIsExpenseModalOpen(true)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs h-7"
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Gider
                    </Button>
                    <Button 
                      onClick={() => setIsTransferModalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs h-7"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Transfer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Taraf - Geniş İşlem Geçmişi */}
          <div className="xl:col-span-9 space-y-2">
            <AccountTransactionHistory
              transactions={transactions}
              currency={account.currency}
              showBalances={showBalances}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              onAddIncome={() => setIsIncomeModalOpen(true)}
              onAddExpense={() => setIsExpenseModalOpen(true)}
              initialBalance={account?.available_balance || 0}
              onDelete={handleDelete}
              isDeleting={deleteTransactionMutation.isPending}
            />
          </div>
        </div>

        {/* Modals */}
        <BankAccountModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          mode="edit"
          accountId={id}
        />
        <BankIncomeModal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          onSuccess={handleIncomeSuccess}
          accountId={id}
          accountName={account?.account_name || ""}
          currency={account?.currency || "TRY"}
        />
        <BankExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={handleExpenseSuccess}
          accountId={id}
          accountName={account?.account_name || ""}
          currency={account?.currency || "TRY"}
        />
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['bank-account', id] });
            queryClient.invalidateQueries({ queryKey: ['bank-account-transactions', id] });
            queryClient.invalidateQueries({ queryKey: ['cash-account'] });
            queryClient.invalidateQueries({ queryKey: ['credit-card'] });
            refetchTransactions();
          }}
        />
        <ConfirmationDialogComponent
          open={isDeleteDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleDeleteCancel();
          }}
          onConfirm={handleDeleteConfirm}
          title="İşlemi Sil"
          description={`${transactionToDelete?.description || 'Bu işlem'} işlemini silmek istediğinizden emin misiniz?`}
          confirmText="Sil"
          cancelText="İptal"
          variant="destructive"
        />
      </div>
    </div>
  );
});

export default BankAccountDetail;