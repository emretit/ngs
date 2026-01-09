import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { AccountTransactionHistory } from "@/components/cashflow/AccountTransactionHistory";
import { AccountDetailHeader } from "./AccountDetailHeader";
import { AccountDetailSearchFilter } from "./AccountDetailSearchFilter";
import { AccountDetailSidebar } from "./AccountDetailSidebar";
import type { AccountDetailBaseProps, BaseAccount, BaseTransaction, QuickActionHandlers } from "./types";
import { getAccountTypeLabel } from "./utils";

/**
 * Loading Skeleton Component
 */
const AccountDetailSkeleton = ({ accountType }: { accountType: string }) => {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-20 bg-white rounded-lg border border-gray-200 p-4">
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
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 xl:col-span-2">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-9 xl:col-span-10">
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Error State Component
 */
const AccountDetailError = ({
  accountType,
  onBack
}: {
  accountType: string;
  onBack: () => void;
}) => {
  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Hesap Bulunamadı</h2>
          <p className="text-muted-foreground mb-4">
            {getAccountTypeLabel(accountType as any)} bilgileri yüklenemedi.
          </p>
          <Button onClick={onBack} variant="outline">
            Geri Dön
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Get transaction table name by account type
 */
const getTransactionTableName = (accountType: string): string => {
  const tableNames: Record<string, string> = {
    credit_card: 'card_transactions',
    cash: 'cash_transactions',
    partner: 'partner_transactions',
    bank: 'bank_transactions',
  };
  return tableNames[accountType] || 'transactions';
};

/**
 * Get account table name by account type
 */
const getAccountTableName = (accountType: string): string => {
  const tableNames: Record<string, string> = {
    credit_card: 'credit_cards',
    cash: 'cash_accounts',
    partner: 'partner_accounts',
    bank: 'bank_accounts',
  };
  return tableNames[accountType] || 'accounts';
};

/**
 * Account Detail Base Component
 * Main wrapper component for all account detail pages
 * Combines header, search/filter, sidebar, and transaction history
 */
export function AccountDetailBase<TAccount extends BaseAccount, TTransaction extends BaseTransaction = BaseTransaction>({
  accountId,
  accountType,
  useAccountDetail,
  useAccountTransactions,
  title,
  subtitle,
  statBadges,
  sidebarFields,
  quickActions,
  modals,
  filterConfig,
  onDeleteTransaction,
  additionalMutations = {},
  transactionHistoryConfig = {},
}: AccountDetailBaseProps<TAccount, TTransaction>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [showBalances, setShowBalances] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<TTransaction | null>(null);

  // Data fetching
  const { data: account, isLoading: isLoadingAccount, error } = useAccountDetail(accountId);
  const { data: transactions = [], isLoading: isLoadingTransactions, refetch: refetchTransactions } = useAccountTransactions(accountId, 20);

  const loading = isLoadingAccount || isLoadingTransactions;

  // Transaction table name
  const transactionTableName = getTransactionTableName(accountType);
  const accountTableName = getAccountTableName(accountType);

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transaction: TTransaction) => {
      // Handle transfer deletion
      if (transaction.isTransfer) {
        const transferId = transaction.id.replace('transfer_', '');
        const { error } = await supabase
          .from('account_transfers')
          .delete()
          .eq('id', transferId);

        if (error) throw error;
        return;
      }

      // Handle regular transaction deletion
      if (transaction.id && !transaction.id.startsWith('transfer_')) {
        const { error } = await supabase
          .from(transactionTableName)
          .delete()
          .eq('id', transaction.id);

        if (error) throw error;

        // Update account balance
        if (account && 'current_balance' in account) {
          const balanceChange = transaction.type === 'income'
            ? -transaction.amount  // Income deleted = balance decreases
            : transaction.amount;  // Expense deleted = balance increases

          const newBalance = ((account as any).current_balance || 0) + balanceChange;

          await supabase
            .from(accountTableName)
            .update({ current_balance: newBalance })
            .eq('id', accountId);
        }
      }
    },
    onSuccess: () => {
      toast.success("İşlem başarıyla silindi");
      queryClient.invalidateQueries({ queryKey: [accountType, accountId] });
      queryClient.invalidateQueries({ queryKey: [`${accountType}-transactions`, accountId] });
      refetchTransactions();
    },
    onError: (error: any) => {
      toast.error("İşlem silinirken hata oluştu: " + (error.message || "Bilinmeyen hata"));
    }
  });

  // Handle delete
  const handleDelete = (transaction: TTransaction) => {
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

  // Success handlers for modals
  const handleIncomeSuccess = () => {
    setIsIncomeModalOpen(false);
    refetchTransactions();
  };

  const handleExpenseSuccess = () => {
    setIsExpenseModalOpen(false);
    refetchTransactions();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    queryClient.invalidateQueries({ queryKey: [accountType, accountId] });
    queryClient.invalidateQueries({ queryKey: [`${accountType}-transactions`, accountId] });
    refetchTransactions();
  };

  const handleTransferSuccess = () => {
    setIsTransferModalOpen(false);
    refetchTransactions();
  };

  // Quick action handlers
  const quickActionHandlers: QuickActionHandlers = {
    onAddIncome: () => setIsIncomeModalOpen(true),
    onAddExpense: () => setIsExpenseModalOpen(true),
    onTransfer: () => setIsTransferModalOpen(true),
    onEdit: () => setIsEditModalOpen(true),
  };

  // Computed values
  const computedStatBadges = useMemo(() => {
    if (!account) return [];
    return statBadges(account, transactions as TTransaction[]);
  }, [account, transactions, statBadges]);

  const computedSidebarFields = useMemo(() => {
    if (!account) return [];
    return sidebarFields(account);
  }, [account, sidebarFields]);

  const computedQuickActions = useMemo(() => {
    return quickActions(quickActionHandlers);
  }, [quickActions, quickActionHandlers]);

  // Loading state
  if (loading) {
    return <AccountDetailSkeleton accountType={accountType} />;
  }

  // Error state
  if (error || !account) {
    return (
      <AccountDetailError
        accountType={accountType}
        onBack={() => navigate(-1)}
      />
    );
  }

  // Get account name for modals
  const accountName = title(account);

  // Render
  return (
    <div className="space-y-4">
      {/* Header */}
      <AccountDetailHeader
        account={account}
        accountType={accountType}
        title={accountName}
        subtitle={subtitle(account)}
        statBadges={computedStatBadges}
        showBalances={showBalances}
        onToggleBalances={() => setShowBalances(!showBalances)}
        onEdit={() => setIsEditModalOpen(true)}
      />

      {/* Search & Filter */}
      <AccountDetailSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        filterConfig={filterConfig}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-3 xl:col-span-2">
          <AccountDetailSidebar
            account={account}
            accountType={accountType}
            fields={computedSidebarFields}
            quickActions={computedQuickActions}
            onEdit={() => setIsEditModalOpen(true)}
          />
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-9 xl:col-span-10">
          <AccountTransactionHistory
            transactions={transactions as any[]}
            currency={account.currency}
            showBalances={showBalances}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            onAddIncome={() => setIsIncomeModalOpen(true)}
            onAddExpense={() => setIsExpenseModalOpen(true)}
            onDelete={onDeleteTransaction || handleDelete}
            initialBalance={transactionHistoryConfig.initialBalance?.(account) || 0}
            hideHeader={true}
            isDeleting={deleteTransactionMutation.isPending}
            {...transactionHistoryConfig}
          />
        </div>
      </div>

      {/* Modals */}
      {modals.edit && (
        <modals.edit
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          mode="edit"
          accountId={accountId}
        />
      )}

      {modals.income && (
        <modals.income
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          onSuccess={handleIncomeSuccess}
          accountId={accountId}
          accountName={accountName}
          currency={account.currency}
        />
      )}

      {modals.expense && (
        <modals.expense
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={handleExpenseSuccess}
          accountId={accountId}
          accountName={accountName}
          currency={account.currency}
        />
      )}

      {modals.transfer && (
        <modals.transfer
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={handleTransferSuccess}
          accountId={accountId}
          accountType={accountType}
          currency={account.currency}
        />
      )}

      {/* Custom Modals */}
      {modals.custom?.map((customModal, index) => {
        const CustomModalComponent = customModal.component;
        return (
          <CustomModalComponent
            key={index}
            isOpen={customModal.isOpen}
            onClose={customModal.onClose}
            {...(customModal.props || {})}
          />
        );
      })}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        isOpen={isDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="İşlemi Sil"
        description={`Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve hesap bakiyesi güncellenecektir.`}
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
      />
    </div>
  );
}
