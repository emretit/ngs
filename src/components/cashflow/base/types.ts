import { UseQueryResult, UseMutationResult } from "@tanstack/react-query";

// ============================================================================
// Core Account Types
// ============================================================================

/**
 * Base account interface that all account types must extend
 */
export interface BaseAccount {
  id: string;
  currency: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Account type discriminator
 */
export type AccountType = 'credit_card' | 'cash' | 'partner' | 'bank';

// ============================================================================
// Theme Configuration
// ============================================================================

/**
 * Theme configuration for each account type
 * Defines colors, gradients, and icons
 */
export interface AccountTheme {
  primaryColor: string;      // e.g., 'purple', 'green', 'orange', 'blue'
  gradientFrom: string;       // e.g., 'from-purple-600'
  gradientTo: string;         // e.g., 'to-purple-700'
  hoverFrom: string;          // e.g., 'hover:from-purple-700'
  hoverTo: string;            // e.g., 'hover:to-purple-800'
  bgLight: string;            // e.g., 'bg-purple-50'
  borderLight: string;        // e.g., 'border-purple-100'
  textDark: string;           // e.g., 'text-purple-800'
  icon: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// UI Component Configuration
// ============================================================================

/**
 * Stat badge configuration for header display
 */
export interface StatBadge {
  key: string;
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showBalanceToggle?: boolean; // Whether to hide this badge with showBalances toggle
  isCurrency?: boolean;        // Whether to format value as currency
}

/**
 * Sidebar field configuration
 */
export interface SidebarField {
  key: string;
  label: string;
  value: string | number | React.ReactNode;
  type?: 'text' | 'badge' | 'custom';
  badgeVariant?: string;
}

/**
 * Quick action button configuration
 */
export interface QuickAction {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant: 'income' | 'expense' | 'transfer' | 'custom';
  className?: string;
}

/**
 * Filter configuration for search/filter bar
 */
export interface FilterConfig {
  categories?: Array<{ value: string; label: string }>;
  showDateRange?: boolean;
  showCategoryFilter?: boolean;
  additionalFilters?: React.ReactNode;
}

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Base transaction interface (extends existing transaction types)
 */
export interface BaseTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description?: string | null;
  transaction_date: string;
  category?: string | null;
  customer_name?: string | null;
  supplier_name?: string | null;
  isTransfer?: boolean;
  transfer_direction?: "incoming" | "outgoing";
  balanceAfter?: number;
  usdBalanceAfter?: number;
  updated_at?: string;
  created_at?: string;
  reference?: string | null;
  user_name?: string | null;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Handler functions passed to quick actions
 */
export interface QuickActionHandlers {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onTransfer: () => void;
  onEdit?: () => void;
  [key: string]: (() => void) | undefined; // Allow custom action handlers
}

/**
 * Modal props interfaces
 */
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export interface EditModalProps extends BaseModalProps {
  mode: 'edit' | 'create';
  accountId?: string;
}

export interface IncomeModalProps extends BaseModalProps {
  accountId: string;
  accountName: string;
  currency: string;
}

export interface ExpenseModalProps extends BaseModalProps {
  accountId: string;
  accountName: string;
  currency: string;
}

export interface TransferModalProps extends BaseModalProps {
  accountId?: string;
  accountType?: AccountType;
  currency?: string;
}

/**
 * Custom modal configuration
 */
export interface CustomModal {
  component: React.ComponentType<any>;
  isOpen: boolean;
  onClose: () => void;
  props?: Record<string, any>;
}

// ============================================================================
// Account Detail Page Props
// ============================================================================

/**
 * Main AccountDetailBase component props
 */
export interface AccountDetailBaseProps<TAccount extends BaseAccount, TTransaction extends BaseTransaction = BaseTransaction> {
  // Identity
  accountId: string;
  accountType: AccountType;

  // Data hooks
  useAccountDetail: (id: string | undefined) => UseQueryResult<TAccount>;
  useAccountTransactions: (id: string | undefined, limit: number) => UseQueryResult<TTransaction[]>;

  // Render functions
  title: (account: TAccount) => string;
  subtitle: (account: TAccount) => string;
  statBadges: (account: TAccount, transactions: TTransaction[]) => StatBadge[];
  sidebarFields: (account: TAccount) => SidebarField[];
  quickActions: (handlers: QuickActionHandlers) => QuickAction[];

  // Modals
  modals: {
    edit: React.ComponentType<EditModalProps>;
    income?: React.ComponentType<IncomeModalProps>;
    expense?: React.ComponentType<ExpenseModalProps>;
    transfer?: React.ComponentType<TransferModalProps>;
    custom?: CustomModal[];
  };

  // Optional configuration
  filterConfig?: FilterConfig;
  onDeleteTransaction?: (transaction: TTransaction) => void;
  additionalMutations?: Record<string, UseMutationResult>;
  transactionHistoryConfig?: {
    hideUsdColumns?: boolean;
    initialBalance?: (account: TAccount) => number;
    currentBalance?: (account: TAccount) => number;
    totalIncome?: (transactions: TTransaction[]) => number;
    totalExpense?: (transactions: TTransaction[]) => number;
  };
}

// ============================================================================
// Header Component Props
// ============================================================================

export interface AccountDetailHeaderProps<TAccount extends BaseAccount> {
  account: TAccount;
  accountType: AccountType;
  title: string;
  subtitle: string;
  statBadges: StatBadge[];
  showBalances: boolean;
  onToggleBalances: () => void;
  onEdit: () => void;
  onBack?: () => void;
}

// ============================================================================
// Search/Filter Component Props
// ============================================================================

export interface AccountDetailSearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterType: "all" | "income" | "expense";
  onFilterTypeChange: (value: "all" | "income" | "expense") => void;
  filterConfig?: FilterConfig;
}

// ============================================================================
// Sidebar Component Props
// ============================================================================

export interface AccountDetailSidebarProps<TAccount extends BaseAccount> {
  account: TAccount;
  accountType: AccountType;
  fields: SidebarField[];
  quickActions: QuickAction[];
  onEdit?: () => void;
}

// ============================================================================
// List Components Props
// ============================================================================

/**
 * Card stat badge for account list cards
 */
export interface CardStatBadge {
  key: string;
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showBalanceToggle?: boolean;
  isCurrency?: boolean;
}

/**
 * Card field configuration for account list cards
 */
export interface CardField {
  key: string;
  label: string;
  value: string | React.ReactNode;
  type?: 'text' | 'badge' | 'custom';
  badgeVariant?: string;
}

/**
 * Currency total for list header
 */
export interface CurrencyTotal {
  currency: string;
  balance: number;
  count: number;
  label?: string;
}

/**
 * Account card component props
 */
export interface AccountCardBaseProps<TAccount extends BaseAccount> {
  account: TAccount;
  accountType: AccountType;
  showBalances: boolean;
  title: string;
  subtitle: string;
  statBadges: CardStatBadge[];
  fields: CardField[];
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

/**
 * Account list header component props
 */
export interface AccountListHeaderProps {
  accountType: AccountType;
  totals: CurrencyTotal[];
  showBalances: boolean;
  onAddNew: () => void;
  addButtonLabel?: string;
}

/**
 * Main AccountListBase component props
 */
export interface AccountListBaseProps<TAccount extends BaseAccount> {
  // Identity
  accountType: AccountType;

  // Data hooks
  useAccounts: () => UseQueryResult<TAccount[]>;
  useDeleteAccount: () => UseMutationResult<void, Error, string>;

  // UI state
  showBalances: boolean;

  // Render functions
  title: (account: TAccount) => string;
  subtitle: (account: TAccount) => string;
  statBadges: (account: TAccount) => CardStatBadge[];
  cardFields: (account: TAccount) => CardField[];

  // Navigation
  onAccountClick: (accountId: string) => void;
  detailPath: (accountId: string) => string;

  // Modals
  modals: {
    create: React.ComponentType<BaseModalProps>;
    edit: React.ComponentType<EditModalProps>;
  };

  // Optional
  addButtonLabel?: string;
  emptyStateMessage?: string;
}
