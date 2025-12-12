import { useState, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Users,
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
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { usePartnerAccountDetail, usePartnerAccountTransactions, useAccountTransfers } from "@/hooks/useAccountDetail";
import { Skeleton } from "@/components/ui/skeleton";
import PartnerIncomeModal from "@/components/cashflow/modals/PartnerIncomeModal";
import PartnerExpenseModal from "@/components/cashflow/modals/PartnerExpenseModal";
import PartnerAccountModal from "@/components/cashflow/modals/PartnerAccountModal";
import TransferModal from "@/components/cashflow/modals/TransferModal";
import { AccountTransactionHistory } from "@/components/cashflow/AccountTransactionHistory";

interface PartnerAccountDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const PartnerAccountDetail = memo(({ isCollapsed, setIsCollapsed }: PartnerAccountDetailProps) => {
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

  // React Query hooks ile optimize edilmiş veri çekme
  const { data: account, isLoading: isLoadingAccount, error: accountError } = usePartnerAccountDetail(id);
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = usePartnerAccountTransactions(id, 20);
  const { data: transfers = [], isLoading: isLoadingTransfers } = useAccountTransfers('partner', id, 20);
  
  const loading = isLoadingAccount || isLoadingTransactions || isLoadingTransfers;

  // Tüm işlemleri (transactions + transfers) birleştir ve tarihe göre sırala
  const allActivities = useMemo(() => {
    if (!account) return [];
    
    // Transfer işlemlerini transaction formatına çevir
    const transferActivities = transfers.map(transfer => ({
      id: `transfer_${transfer.id}`,
      type: transfer.direction === 'incoming' ? 'income' : 'expense',
      amount: transfer.amount,
      description: transfer.direction === 'incoming' 
        ? `Transfer (${transfer.from_account_name || 'Bilinmeyen Hesap'} → Bu Hesap)`
        : `Transfer (Bu Hesap → ${transfer.to_account_name || 'Bilinmeyen Hesap'})`,
      transaction_date: transfer.transfer_date,
      created_at: transfer.created_at,
      updated_at: transfer.updated_at,
      isTransfer: true,
      transfer_direction: transfer.direction,
      category: 'Transfer',
      customer_name: undefined,
      supplier_name: undefined
    }));

    // Normal işlemler ve transfer işlemlerini birleştir
    const allActivities = [
      ...transactions.map(t => ({ 
        ...t, 
        isTransfer: false,
        transfer_direction: undefined as 'incoming' | 'outgoing' | undefined
      })),
      ...transferActivities
    ].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    return allActivities;
  }, [transactions, transfers, account]);

  // Her işlemden sonraki toplam bakiyeyi hesapla
  const transactionsWithBalance = useMemo(() => {
    if (!account) return [];
    
    // İşlemleri tarihe göre sırala (en eski en üstte)
    const sortedActivities = [...allActivities].sort((a, b) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );
    
    let runningBalance = account.initial_capital || 0;
    
    return sortedActivities.map(activity => {
      // İşlem tutarını hesapla
      const amount = activity.type === "income" ? activity.amount : -activity.amount;
      runningBalance += amount;
      
      return {
        ...activity,
        balanceAfter: runningBalance
      };
    }).reverse(); // En yeni en üstte olacak şekilde ters çevir
  }, [allActivities, account]);

  // Memoized calculations - sadece gerekli olduğunda yeniden hesapla
  const filteredTransactions = useMemo(() => {
    console.log("Filtreleme başlıyor:", {
      searchQuery,
      selectedCategory,
      selectedDateRange,
      startDate,
      endDate,
      filterType,
      totalTransactions: transactionsWithBalance.length
    });
    
    const filtered = transactionsWithBalance.filter(transaction => {
      // Tip filtresi
      if (filterType !== "all" && transaction.type !== filterType) return false;
      
      // Arama filtresi
      if (searchQuery && !transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !transaction.category?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Kategori filtresi
      if (selectedCategory !== "all" && transaction.category !== selectedCategory) return false;
      
      // Tarih filtresi - updated_at (güncellenme tarihi) kullan
      const updatedDate = new Date(transaction.updated_at);
      const updatedDateOnly = new Date(updatedDate.getFullYear(), updatedDate.getMonth(), updatedDate.getDate());
      
      // Özel tarih aralığı filtresi (DatePicker)
      if (startDate || endDate) {
        if (startDate) {
          const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          if (updatedDateOnly < startDateOnly) return false;
        }
        if (endDate) {
          const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
          if (updatedDateOnly > endDateOnly) return false;
        }
      } else if (selectedDateRange !== "all") {
        // Önceden tanımlı tarih aralığı filtresi
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (selectedDateRange) {
          case "today":
            if (updatedDateOnly < today) return false;
            break;
          case "week":
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (updatedDateOnly < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (updatedDateOnly < monthAgo) return false;
            break;
        }
      }
      
      return true;
    });
    
    console.log("Filtreleme sonucu:", {
      filteredCount: filtered.length,
      originalCount: transactionsWithBalance.length
    });
    
    return filtered;
  }, [transactionsWithBalance, filterType, searchQuery, selectedCategory, selectedDateRange, startDate, endDate]);

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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDateRange("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setFilterType("all");
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


  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'ortak': 'Ortak',
      'hisse_sahibi': 'Hisse Sahibi',
      'yatirimci': 'Yatırımcı'
    };
    return types[type] || type;
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
              className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-50/50 hover:text-orange-700 hover:border-orange-200 transition-all duration-200 hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Ortak Hesapları</span>
            </Button>
            
            <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {account.partner_name}
              </h1>
              <p className="text-xs text-muted-foreground/70">
                {getAccountTypeLabel(account.partner_type)} • {account.is_active ? "Aktif" : "Pasif"}
              </p>
            </div>
          </div>
          
          {/* Orta - İstatistik Kartları */}
          <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
            {/* Hisse Oranı */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
              <Percent className="h-3 w-3" />
              <span className="font-bold">Hisse</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                {account.ownership_percentage || 0}%
              </span>
            </div>
            
            {/* Mevcut Bakiye */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-orange-100 text-orange-800 border-orange-200">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium">Bakiye</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(account.current_balance, account.currency) : "••••••"}
              </span>
            </div>
            
            {/* Toplam Gelir */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-green-100 text-green-800 border-green-200">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Gelir</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(totalIncome, account.currency) : "••••••"}
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
        
        <Select value={filterType} onValueChange={(value: "all" | "income" | "expense") => setFilterType(value)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="İşlem Tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm İşlemler</SelectItem>
            <SelectItem value="income">💰 Gelir</SelectItem>
            <SelectItem value="expense">💸 Gider</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <Activity className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            <SelectItem value="proje_geliri">Proje Geliri</SelectItem>
            <SelectItem value="kar_dagitimi">Kar Dağıtımı</SelectItem>
            <SelectItem value="kira">Kira</SelectItem>
            <SelectItem value="sermaye_artirimi">Sermaye Artırımı</SelectItem>
            <SelectItem value="sermaye_azaltimi">Sermaye Azaltımı</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tarih Aralığı" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Zamanlar</SelectItem>
            <SelectItem value="today">Bugün</SelectItem>
            <SelectItem value="week">Son 7 Gün</SelectItem>
            <SelectItem value="month">Son 30 Gün</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <DatePicker
            date={startDate}
            onSelect={setStartDate}
            placeholder="Başlangıç"
          />
          <DatePicker
            date={endDate}
            onSelect={setEndDate}
            placeholder="Bitiş"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-2">

        {/* Main Grid Layout - Sol: Kompakt Bilgiler, Sağ: Geniş İşlem Geçmişi */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
          {/* Sol Taraf - Kompakt Bilgiler ve İşlemler */}
          <div className="xl:col-span-3 space-y-2">
            {/* Ortak Bilgileri ve Hızlı İşlemler - Tek Kart */}
            <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl">
              <CardHeader className="pb-2 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
                      <UserCheck className="h-3.5 w-3.5 text-orange-600" />
                    </div>
                    Ortak & İşlemler
                  </CardTitle>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    className="h-6 w-6 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-3 pb-3 space-y-3">
                {/* Ortak Bilgileri - Kompakt */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Ortak Adı</label>
                    <p className="text-xs font-semibold truncate">{account.partner_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Hesap Türü</label>
                    <p className="text-xs">{getAccountTypeLabel(account.partner_type)}</p>
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
              transactions={allActivities}
              currency={account.currency}
              showBalances={showBalances}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              onAddIncome={() => setIsIncomeModalOpen(true)}
              onAddExpense={() => setIsExpenseModalOpen(true)}
              initialBalance={account.initial_capital || 0}
            />
          </div>
        </div>

        {/* Modals */}
        <PartnerIncomeModal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          onSuccess={handleIncomeSuccess}
          accountId={id}
          accountName={account?.partner_name || ""}
          currency={account?.currency || "TRY"}
        />
        <PartnerExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={handleExpenseSuccess}
          accountId={id}
          accountName={account?.partner_name || ""}
          currency={account?.currency || "TRY"}
        />

        {/* Düzenleme için mevcut modalı yeniden kullan */}
        <PartnerAccountModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
          }}
          mode="edit"
          accountId={id}
        />

        {/* Transfer Modal */}
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            // Refresh data after transfer
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
});

export default PartnerAccountDetail;