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
  Award
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { useBankAccountDetail, useBankAccountTransactions } from "@/hooks/useAccountDetail";
import { Skeleton } from "@/components/ui/skeleton";
import BankIncomeModal from "@/components/cashflow/modals/BankIncomeModal";
import BankExpenseModal from "@/components/cashflow/modals/BankExpenseModal";
import TransferModal from "@/components/cashflow/modals/TransferModal";

interface BankAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const BankAccountDetail = memo(({ isCollapsed, setIsCollapsed }: BankAccountDetailProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

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
    toast.info("Düzenleme özelliği yakında eklenecek");
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

      {/* Main Content */}
      <div className="space-y-3">

        {/* Main Grid Layout - Sol: Kompakt Bilgiler, Sağ: Geniş İşlem Geçmişi */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
          {/* Sol Taraf - Kompakt Bilgiler ve İşlemler */}
          <div className="space-y-2">
            {/* Hesap Bilgileri ve Hızlı İşlemler - Tek Kart */}
            <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  Hesap Bilgileri & İşlemler
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Hesap Bilgileri - Kompakt */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Hesap Adı</label>
                    <p className="text-sm font-semibold">{account.account_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Hesap Türü</label>
                    <p className="text-sm">{getAccountTypeLabel(account.account_type)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Banka</label>
                    <p className="text-sm">{account.bank_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Durum</label>
                    <Badge 
                      className={`text-xs ${
                        account.is_active
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      {account.is_active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">IBAN</label>
                    <p className="text-sm font-mono">{formatAccountNumber(account.iban)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Para Birimi</label>
                    <p className="text-sm">{account.currency}</p>
                  </div>
                </div>

                {/* Hızlı İşlemler */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Hızlı İşlemler</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      onClick={() => setIsIncomeModalOpen(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Gelir Ekle
                    </Button>
                    <Button 
                      onClick={() => setIsExpenseModalOpen(true)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm"
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Gider Ekle
                    </Button>
                    <Button 
                      onClick={() => setIsTransferModalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Transfer Yap
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        Filtrele
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        Tarih
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Taraf - Geniş İşlem Geçmişi */}
          <div className="xl:col-span-2 space-y-2">
            {/* İşlem Geçmişi */}
            <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-50/50 border border-gray-200/50">
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                    İşlem Geçmişi
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="p-3 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-700 mb-1">Henüz işlem bulunmuyor</h3>
                    <p className="text-sm text-gray-500 mb-3">İlk işleminizi ekleyerek başlayın</p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        onClick={() => setIsIncomeModalOpen(true)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Gelir
                      </Button>
                      <Button 
                        onClick={() => setIsExpenseModalOpen(true)}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        Gider
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredTransactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.type === "income" ? "bg-green-500" : "bg-red-500"
                          }`}></div>
                          <div>
                            <p className="font-medium text-sm">
                              {transaction.customer_name ? `Müşteri: ${transaction.customer_name}` : ''}
                              {transaction.supplier_name ? `Tedarikçi: ${transaction.supplier_name}` : ''}
                              {!transaction.customer_name && !transaction.supplier_name ? (transaction.description || '-') : ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                              {transaction.description && (transaction.customer_name || transaction.supplier_name) ? ` • ${transaction.description}` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.type === "income" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "income" ? "+" : "-"}
                            {showBalances ? formatCurrency(transaction.amount, account.currency) : "••••••"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
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
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
});

export default BankAccountDetail;