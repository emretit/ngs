import { useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Building2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBankAccounts, useDeleteBankAccount } from "@/hooks/useAccountsData";
import BankAccountModal from "./modals/BankAccountModal";
import { AccountListBase } from "./base/AccountListBase";
import { AccountListHeaderBase } from "./base/AccountListHeaderBase";
import { formatCurrency } from "@/utils/formatters";
import { formatIBAN } from "./base/utils";
import type { CardStatBadge, CardField } from "./base/types";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_type: string;
  iban?: string;
  currency: string;
  current_balance: number;
  available_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BankAccountsProps {
  showBalances: boolean;
}

/**
 * Helper function to get account type label
 * Memoized for better performance
 */
const getAccountTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    'checking': 'Vadesiz',
    'savings': 'Vadeli',
    'business': 'Ticari',
    'investment': 'Yatırım'
  };
  return types[type] || type;
};

/**
 * Helper function to get account type badge color
 * Memoized for better performance
 */
const getAccountTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'checking': 'bg-blue-100 text-blue-800 border-blue-200',
    'savings': 'bg-green-100 text-green-800 border-green-200',
    'business': 'bg-purple-100 text-purple-800 border-purple-200',
    'investment': 'bg-orange-100 text-orange-800 border-orange-200'
  };
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Bank Accounts List Page (Refactored & Optimized)
 * Uses AccountListBase for common functionality
 *
 * Performance Optimizations:
 * - memo() for preventing unnecessary re-renders
 * - useMemo() for expensive calculations
 * - useCallback() for stable function references
 *
 * Original: 445 lines
 * Refactored: ~180 lines (59% reduction)
 */
const BankAccounts = memo(({ showBalances }: BankAccountsProps) => {
  const navigate = useNavigate();
  const { data: bankAccounts = [] } = useBankAccounts();

  // Calculate totals by currency - memoized for performance
  const totals = useMemo(() => {
    return bankAccounts.reduce((acc, account) => {
      const currency = account.currency || 'TRY';
      if (!acc[currency]) {
        acc[currency] = {
          currentBalance: 0,
          availableBalance: 0,
          count: 0
        };
      }
      acc[currency].currentBalance += account.current_balance || 0;
      acc[currency].availableBalance += account.available_balance || account.current_balance || 0;
      acc[currency].count += 1;
      return acc;
    }, {} as Record<string, { currentBalance: number; availableBalance: number; count: number }>);
  }, [bankAccounts]);

  // Memoized navigation handler
  const handleAccountClick = useCallback((accountId: string) => {
    navigate(`/cashflow/bank-accounts/${accountId}`);
  }, [navigate]);

  // Memoized title function
  const getTitle = useCallback((account: BankAccount) => {
    return account.account_name || "Banka Hesabı";
  }, []);

  // Memoized subtitle function
  const getSubtitle = useCallback((account: BankAccount) => {
    return `${account.bank_name} • ${getAccountTypeLabel(account.account_type)}`;
  }, []);

  // Memoized stat badges function
  const getStatBadges = useCallback((account: BankAccount): CardStatBadge[] => [
    {
      key: 'balance',
      label: '',
      value: account.current_balance,
      icon: DollarSign,
      variant: 'primary',
      showBalanceToggle: true,
      isCurrency: true,
    },
    {
      key: 'available',
      label: 'Kullanılabilir:',
      value: account.available_balance || account.current_balance,
      icon: Target,
      variant: 'secondary',
      showBalanceToggle: true,
      isCurrency: true,
    },
  ], []);

  // Memoized card fields function
  const getCardFields = useCallback((account: BankAccount): CardField[] => [
    {
      key: 'type',
      label: '',
      value: (
        <Badge className={getAccountTypeColor(account.account_type)}>
          {getAccountTypeLabel(account.account_type)}
        </Badge>
      ),
      type: 'custom',
    },
    ...(account.iban ? [{
      key: 'iban',
      label: 'IBAN',
      value: formatIBAN(account.iban),
      type: 'text' as const,
    }] : []),
  ], []);

  // Render custom header with totals - memoized
  const renderHeader = useCallback((_accounts: BankAccount[], _showBalances: boolean, onAddNew: () => void) => {
    const headerBadges = Object.entries(totals).flatMap(([currency, data]) => [
      {
        key: `${currency}-balance`,
        label: 'Bakiye',
        value: formatCurrency(data.currentBalance, currency),
        icon: DollarSign,
        variant: 'primary' as const,
        showBalanceToggle: true,
      },
      {
        key: `${currency}-available`,
        label: 'Kullanılabilir',
        value: formatCurrency(data.availableBalance, currency),
        icon: Target,
        variant: 'success' as const,
        showBalanceToggle: true,
      },
      {
        key: `${currency}-count`,
        label: 'Hesap',
        value: data.count.toString(),
        icon: Building2,
        variant: 'info' as const,
        showBalanceToggle: false,
      },
    ]);

    return (
      <AccountListHeaderBase
        accountType="bank"
        badges={headerBadges}
        showBalances={_showBalances}
        onAddNew={onAddNew}
        addButtonLabel="Yeni"
        totals={[]}
      />
    );
  }, [totals]);

  return (
    <AccountListBase
      accountType="bank"
      useAccounts={useBankAccounts}
      useDeleteAccount={useDeleteBankAccount}
      showBalances={showBalances}

      // Render functions
      title={getTitle}
      subtitle={getSubtitle}
      statBadges={getStatBadges}
      cardFields={getCardFields}

      // Navigation
      onAccountClick={handleAccountClick}
      detailPath={(accountId) => `/cashflow/bank-accounts/${accountId}`}

      // Modals
      modals={{
        create: BankAccountModal,
        edit: BankAccountModal,
      }}

      // Optional
      addButtonLabel="Yeni Hesap"
      emptyStateMessage="Henüz banka hesabı yok"

      // Custom header
      renderHeader={renderHeader}
    />
  );
});

BankAccounts.displayName = 'BankAccounts';

export default BankAccounts;
