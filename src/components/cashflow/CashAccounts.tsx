import { useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Wallet } from "lucide-react";
import { useCashAccounts, useDeleteCashAccount } from "@/hooks/useAccountsData";
import CashAccountModal from "./modals/CashAccountModal";
import { AccountListBase } from "./base/AccountListBase";
import { AccountListHeaderBase } from "./base/AccountListHeaderBase";
import { formatCurrency } from "@/utils/formatters";
import type { CardStatBadge, CardField } from "./base/types";

interface CashAccount {
  id: string;
  name: string;
  current_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CashAccountsProps {
  showBalances: boolean;
}

/**
 * Cash Accounts List Page (Refactored & Optimized)
 * Uses AccountListBase for common functionality
 *
 * Performance Optimizations:
 * - memo() for preventing unnecessary re-renders
 * - useMemo() for expensive calculations
 * - useCallback() for stable function references
 *
 * Original: 236 lines
 * Refactored: ~130 lines (45% reduction)
 */
const CashAccounts = memo(({ showBalances }: CashAccountsProps) => {
  const navigate = useNavigate();
  const { data: cashAccounts = [] } = useCashAccounts();

  // Calculate totals by currency
  const totals = useMemo(() => {
    return cashAccounts.reduce((acc, account) => {
      const currency = account.currency || 'TRY';
      if (!acc[currency]) {
        acc[currency] = {
          balance: 0,
          count: 0
        };
      }
      acc[currency].balance += account.current_balance || 0;
      acc[currency].count += 1;
      return acc;
    }, {} as Record<string, { balance: number; count: number }>);
  }, [cashAccounts]);

  // Memoized navigation handler
  const handleAccountClick = useCallback((accountId: string) => {
    navigate(`/cashflow/cash-accounts/${accountId}`);
  }, [navigate]);

  // Memoized render functions
  const getTitle = useCallback((account: CashAccount) => {
    return account.name || "Nakit Hesabı";
  }, []);

  const getSubtitle = useCallback((account: CashAccount) => {
    return account.currency;
  }, []);

  const getStatBadges = useCallback((account: CashAccount): CardStatBadge[] => [
    {
      key: 'balance',
      label: '',
      value: account.current_balance,
      icon: DollarSign,
      variant: 'primary',
      showBalanceToggle: true,
      isCurrency: true,
    },
  ], []);

  const getCardFields = useCallback((): CardField[] => [], []);

  // Render custom header with totals - memoized
  const renderHeader = useCallback((_accounts: CashAccount[], _showBalances: boolean, onAddNew: () => void) => {
    const headerBadges = Object.entries(totals).flatMap(([currency, data]) => [
      {
        key: `${currency}-balance`,
        label: 'Bakiye',
        value: formatCurrency(data.balance, currency),
        icon: DollarSign,
        variant: 'primary' as const,
        showBalanceToggle: true,
      },
      {
        key: `${currency}-count`,
        label: 'Hesap',
        value: data.count.toString(),
        icon: Wallet,
        variant: 'info' as const,
        showBalanceToggle: false,
      },
    ]);

    return (
      <AccountListHeaderBase
        accountType="cash"
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
      accountType="cash"
      useAccounts={useCashAccounts}
      useDeleteAccount={useDeleteCashAccount}
      showBalances={showBalances}

      // Render functions
      title={getTitle}
      subtitle={getSubtitle}
      statBadges={getStatBadges}
      cardFields={getCardFields}

      // Navigation
      onAccountClick={handleAccountClick}
      detailPath={(accountId) => `/cashflow/cash-accounts/${accountId}`}

      // Modals
      modals={{
        create: CashAccountModal,
        edit: CashAccountModal,
      }}

      // Optional
      addButtonLabel="Yeni Kasa"
      emptyStateMessage="Henüz kasa hesabı yok"

      // Custom header
      renderHeader={renderHeader}
    />
  );
});

CashAccounts.displayName = 'CashAccounts';

export default CashAccounts;
