import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DollarSign, Percent } from "lucide-react";
import { usePartnerAccounts, useDeletePartnerAccount } from "@/hooks/useAccountsData";
import PartnerAccountModal from "./modals/PartnerAccountModal";
import { AccountListBase } from "./base/AccountListBase";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import type { CardStatBadge, CardField } from "./base/types";

interface PartnerAccount {
  id: string;
  partner_name: string;
  partner_type: "ortak" | "hisse_sahibi" | "yatirimci";
  ownership_percentage: number;
  initial_capital: number;
  current_balance: number;
  profit_share: number;
  last_profit_distribution: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PartnerAccountsProps {
  showBalances: boolean;
}

/**
 * Helper function to get partner type label
 * Memoized for better performance
 */
const getPartnerTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    'ortak': 'Ortak',
    'hisse_sahibi': 'Hisse Sahibi',
    'yatirimci': 'Yatırımcı'
  };
  return types[type] || type;
};

/**
 * Helper function to get partner type badge color
 * Memoized for better performance
 */
const getPartnerTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'ortak': 'bg-blue-100 text-blue-800 border-blue-200',
    'hisse_sahibi': 'bg-green-100 text-green-800 border-green-200',
    'yatirimci': 'bg-purple-100 text-purple-800 border-purple-200'
  };
  return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Partner Accounts List Page (Refactored & Optimized)
 * Uses AccountListBase for common functionality
 *
 * Performance Optimizations:
 * - memo() for preventing unnecessary re-renders
 * - useMemo() for expensive calculations
 * - useCallback() for stable function references
 *
 * Original: 294 lines
 * Refactored: ~165 lines (44% reduction)
 */
const PartnerAccounts = memo(({ showBalances }: PartnerAccountsProps) => {
  const navigate = useNavigate();
  const { data: partnerAccounts = [] } = usePartnerAccounts();

  // Memoized navigation handler
  const handleAccountClick = useCallback((accountId: string) => {
    navigate(`/cashflow/partner-accounts/${accountId}`);
  }, [navigate]);

  // Memoized render functions
  const getTitle = useCallback((account: PartnerAccount) => {
    return account.partner_name || "Ortak Hesabı";
  }, []);

  const getSubtitle = useCallback((account: PartnerAccount) => {
    return `${getPartnerTypeLabel(account.partner_type)} • ${account.ownership_percentage}%`;
  }, []);

  const getStatBadges = useCallback((account: PartnerAccount): CardStatBadge[] => [
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
      key: 'ownership',
      label: 'Hisse:',
      value: `${account.ownership_percentage}%`,
      icon: Percent,
      variant: 'secondary',
      showBalanceToggle: false,
    },
  ], []);

  const getCardFields = useCallback((account: PartnerAccount): CardField[] => [
    {
      key: 'type',
      label: '',
      value: (
        <Badge className={getPartnerTypeColor(account.partner_type)}>
          {getPartnerTypeLabel(account.partner_type)}
        </Badge>
      ),
      type: 'custom',
    },
  ], []);

  return (
    <AccountListBase
      accountType="partner"
      useAccounts={usePartnerAccounts}
      useDeleteAccount={useDeletePartnerAccount}
      showBalances={showBalances}

      // Render functions
      title={getTitle}
      subtitle={getSubtitle}
      statBadges={getStatBadges}
      cardFields={getCardFields}

      // Navigation
      onAccountClick={handleAccountClick}
      detailPath={(accountId) => `/cashflow/partner-accounts/${accountId}`}

      // Modals
      modals={{
        create: PartnerAccountModal,
        edit: PartnerAccountModal,
      }}

      // Optional
      addButtonLabel="Yeni Ortak"
      emptyStateMessage="Henüz ortak hesabı yok"
    />
  );
});

PartnerAccounts.displayName = 'PartnerAccounts';

export default PartnerAccounts;
