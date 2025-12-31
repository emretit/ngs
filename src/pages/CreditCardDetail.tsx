import { useState, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CreditCard,
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
import { useTranslation } from "react-i18next";
import { useCreditCardDetail, useCreditCardTransactions } from "@/hooks/useAccountDetail";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import CreditCardIncomeModal from "@/components/cashflow/modals/CreditCardIncomeModal";
import CreditCardExpenseModal from "@/components/cashflow/modals/CreditCardExpenseModal";
import CreditCardModal from "@/components/cashflow/modals/CreditCardModal";
import TransferModal from "@/components/cashflow/modals/TransferModal";
import { AccountTransactionHistory } from "@/components/cashflow/AccountTransactionHistory";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Label } from "@/components/ui/label";

interface CreditCardDetailProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const CreditCardDetail = memo(({ isCollapsed, setIsCollapsed }: CreditCardDetailProps) => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isCreditLimitModalOpen, setIsCreditLimitModalOpen] = useState(false);
  const [creditLimitValue, setCreditLimitValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);

  // React Query hooks ile optimize edilmiş veri çekme
  const { data: card, isLoading: isLoadingCard, error: cardError } = useCreditCardDetail(id);
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useCreditCardTransactions(id, 20);
  
  const loading = isLoadingCard || isLoadingTransactions;

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
    window.location.reload();
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

      // Normal transaction ise - card_transactions tablosundan sil
      if (transaction.id && !transaction.id.startsWith('transfer_')) {
        const { error } = await supabase
          .from('card_transactions')
          .delete()
          .eq('id', transaction.id);
        
        if (error) throw error;

        // Bakiye güncellemesi - transaction tipine göre ters işlem yap
        if (card) {
          const balanceChange = transaction.type === 'income' 
            ? -transaction.amount  // Gelir silinirse bakiye azalır
            : transaction.amount;  // Gider silinirse bakiye artar

          const newBalance = (card.current_balance || 0) + balanceChange;
          
          await supabase
            .from('credit_cards')
            .update({ current_balance: newBalance })
            .eq('id', id);
        }
      }
    },
    onSuccess: () => {
      toast.success("İşlem başarıyla silindi");
      queryClient.invalidateQueries({ queryKey: ['credit-card-transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['credit-card', id] });
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

  // Kredi limiti güncelleme mutation'ı
  const updateCreditLimitMutation = useMutation({
    mutationFn: async (newLimit: number) => {
      if (!id) throw new Error("Kart ID bulunamadı");
      
      // current_balance'ı al
      const currentBalance = card?.current_balance || 0;
      // available_limit = credit_limit - current_balance
      const newAvailableLimit = newLimit - currentBalance;
      
      const { error } = await supabase
        .from('credit_cards')
        .update({ 
          credit_limit: newLimit,
          available_limit: newAvailableLimit
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kredi limiti başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ['credit-card', id] });
      setIsCreditLimitModalOpen(false);
      setCreditLimitValue("");
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error("Limit güncellenirken hata oluştu: " + (error.message || "Bilinmeyen hata"));
    }
  });

  const handleOpenCreditLimitModal = () => {
    if (card) {
      setCreditLimitValue(card.credit_limit ? String(card.credit_limit) : "");
    }
    setIsCreditLimitModalOpen(true);
  };

  const handleUpdateCreditLimit = () => {
    const limitValue = parseFloat(creditLimitValue);
    if (isNaN(limitValue) || limitValue < 0) {
      toast.error("Geçerli bir limit değeri girin");
      return;
    }
    updateCreditLimitMutation.mutate(limitValue);
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

  if (cardError || !card) {
    return (
      <div className="p-4 sm:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Kredi Kartı Bulunamadı</h2>
            <p className="text-gray-500 mb-4">Aradığınız kredi kartı bulunamadı veya erişim yetkiniz yok.</p>
            <Button onClick={() => navigate(-1)} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getCardTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'credit': 'Kredi Kartı',
      'debit': 'Banka Kartı',
      'corporate': 'Kurumsal Kart'
    };
    return types[type] || type;
  };

  const formatCardNumber = (number: string | null) => {
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
              className="gap-2 px-4 py-2 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-50/50 hover:text-purple-700 hover:border-purple-200 transition-all duration-200 hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Kredi Kartları</span>
            </Button>
            
            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white shadow-lg">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {card.card_name}
              </h1>
              <p className="text-xs text-muted-foreground/70">
                {getCardTypeLabel(card.card_type)} • {card.status === 'active' ? "Aktif" : "Pasif"}
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
                {showBalances ? formatCurrency(card.credit_limit, "TRY") : "••••••"}
              </span>
            </div>
            
            {/* Mevcut Bakiye */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-purple-100 text-purple-800 border-purple-200">
              <DollarSign className="h-3 w-3" />
              <span className="font-medium">Bakiye</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(card.current_balance, "TRY") : "••••••"}
              </span>
            </div>
            
            {/* Kullanılabilir Limit */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-green-100 text-green-800 border-green-200">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Kullanılabilir</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(card.available_limit, "TRY") : "••••••"}
              </span>
            </div>
            
            {/* Toplam Gider */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-red-100 text-red-800 border-red-200">
              <TrendingDown className="h-3 w-3" />
              <span className="font-medium">Harcama</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {showBalances ? formatCurrency(totalExpense, "TRY") : "••••••"}
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
              className="gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-600/90 hover:from-purple-600/90 hover:to-purple-600/80 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
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
        <Select value={filterType} onValueChange={(value: string) => setFilterType(value as "all" | "income" | "expense")}>
          <SelectTrigger className="w-[160px] h-9">
            <Filter className="h-3.5 w-3.5 mr-2" />
            <SelectValue placeholder="Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm İşlemler</SelectItem>
            <SelectItem value="income">Gelir</SelectItem>
            <SelectItem value="expense">Gider</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Main Grid Layout - Sol: Kompakt Bilgiler, Sağ: Geniş İşlem Geçmişi */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-2">
          {/* Sol Taraf - Kompakt Bilgiler ve İşlemler */}
          <div className="xl:col-span-2 space-y-2">
            {/* Kart Bilgileri ve Hızlı İşlemler - Modern Gradient */}
            <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl">
              <CardHeader className="pb-2 px-3 pt-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <div className="p-1 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                      <CreditCard className="h-3.5 w-3.5 text-purple-600" />
                    </div>
                    Kart & İşlemler
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
                {/* Kart Bilgileri - Kompakt */}
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Kart Adı</label>
                    <p className="text-xs font-semibold truncate">{card.card_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Kart Türü</label>
                    <p className="text-xs">{getCardTypeLabel(card.card_type)}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Banka</label>
                    <p className="text-xs truncate">{card.bank_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground">Durum</label>
                    <Badge
                      className={`text-[10px] h-4 px-1.5 ${
                        card.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <Activity className="h-2.5 w-2.5 mr-0.5" />
                      {card.status === 'active' ? "Aktif" : "Pasif"}
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
                      Ödeme Ekle
                    </Button>
                    <Button
                      onClick={() => setIsExpenseModalOpen(true)}
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs h-7"
                    >
                      <Minus className="h-3 w-3 mr-1" />
                      Harcama Ekle
                    </Button>
                    <Button
                      onClick={() => setIsTransferModalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs h-7"
                    >
                      <ArrowLeft className="h-3 w-3 mr-1" />
                      Transfer Yap
                    </Button>
                    <Button
                      onClick={handleOpenCreditLimitModal}
                      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white text-xs h-7"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Limit Düzelt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Taraf - Geniş İşlem Geçmişi */}
          <div className="xl:col-span-10 space-y-2">
            <AccountTransactionHistory
              transactions={transactions}
              currency="TRY"
              showBalances={showBalances}
              filterType={filterType}
              onFilterTypeChange={setFilterType}
              onAddIncome={() => setIsIncomeModalOpen(true)}
              onAddExpense={() => setIsExpenseModalOpen(true)}
              onDelete={handleDelete}
              initialBalance={card?.available_limit || 0}
              hideUsdColumns={true}
              isDeleting={deleteTransactionMutation.isPending}
            />
          </div>
        </div>

        {/* Modals */}
        <CreditCardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          mode="edit"
          cardId={id}
        />
        <CreditCardIncomeModal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          onSuccess={handleIncomeSuccess}
          cardId={id}
          cardName={card?.card_name || ""}
          currency="TRY"
        />
        <CreditCardExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={handleExpenseSuccess}
          cardId={id}
          cardName={card?.card_name || ""}
          currency="TRY"
        />
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={() => {
            setIsTransferModalOpen(false);
            window.location.reload();
          }}
        />

        {/* Kredi Limiti Düzelt Modal */}
        <UnifiedDialog
          isOpen={isCreditLimitModalOpen}
          onClose={(open) => {
            setIsCreditLimitModalOpen(open);
            if (!open) {
              setCreditLimitValue("");
            }
          }}
          title="Kredi Limiti Düzelt"
          maxWidth="md"
          headerColor="purple"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credit_limit" className="text-sm font-medium text-gray-700">
                Kredi Limiti
              </Label>
              <Input
                id="credit_limit"
                type="number"
                value={creditLimitValue}
                onChange={(e) => setCreditLimitValue(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="h-10"
              />
              <p className="text-xs text-gray-500">
                Kredi kartının limitini güncelleyin. Kullanılabilir limit otomatik olarak hesaplanacaktır.
              </p>
            </div>
          </div>
          <UnifiedDialogFooter>
            <UnifiedDialogCancelButton 
              onClick={() => {
                setIsCreditLimitModalOpen(false);
                setCreditLimitValue("");
              }}
            />
            <UnifiedDialogActionButton
              onClick={handleUpdateCreditLimit}
              disabled={updateCreditLimitMutation.isPending || !creditLimitValue}
            >
              {updateCreditLimitMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
            </UnifiedDialogActionButton>
          </UnifiedDialogFooter>
        </UnifiedDialog>

        {/* Silme Onay Dialog */}
        <ConfirmationDialogComponent
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="İşlemi Sil"
          description={
            transactionToDelete
              ? `"${transactionToDelete.description || 'Bu işlem'}" kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
              : "Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          }
          confirmText={t("common.delete")}
          cancelText={t("common.cancel")}
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isLoading={deleteTransactionMutation.isPending}
        />
      </div>
    </div>
  );
});

export default CreditCardDetail;