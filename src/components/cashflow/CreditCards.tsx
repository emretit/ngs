import { useMemo, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Target, DollarSign, TrendingUp } from "lucide-react";
import { useCreditCards, useDeleteCreditCard } from "@/hooks/useAccountsData";
import CreditCardModal from "./modals/CreditCardModal";
import { AccountListBase } from "./base/AccountListBase";
import { AccountListHeaderBase } from "./base/AccountListHeaderBase";
import { formatCurrency } from "@/utils/formatters";
import type { CardStatBadge, CardField } from "./base/types";

interface CreditCardAccount {
  id: string;
  card_name: string;
  card_number: string;
  bank_name: string;
  card_type: "credit" | "debit" | "corporate";
  credit_limit: number;
  current_balance: number;
  available_limit: number;
  currency: string;
  expiry_date: string;
  is_active: boolean;
  status?: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

interface CreditCardsProps {
  showBalances: boolean;
}

/**
 * Helper function to format card number
 * Memoized for better performance
 */
const formatCardNumber = (number: string | null | undefined): string => {
  if (!number) return "";
  const numbers = number.replace(/\D/g, '');
  if (!numbers) return "";
  return numbers.replace(/(.{4})/g, '$1-').slice(0, -1);
};

/**
 * Credit Cards List Page (Refactored & Optimized)
 * Uses AccountListBase for common functionality
 *
 * Performance Optimizations:
 * - memo() for preventing unnecessary re-renders
 * - useMemo() for expensive calculations
 * - useCallback() for stable function references
 *
 * Original: 303 lines
 * Refactored: ~170 lines (44% reduction)
 */
const CreditCards = memo(({ showBalances }: CreditCardsProps) => {
  const navigate = useNavigate();
  const { data: creditCards = [] } = useCreditCards();

  // Calculate totals by currency
  const totals = useMemo(() => {
    return creditCards.reduce((acc, card) => {
      const currency = card.currency || 'TRY';
      if (!acc[currency]) {
        acc[currency] = {
          creditLimit: 0,
          currentBalance: 0,
          availableLimit: 0,
          count: 0
        };
      }
      acc[currency].creditLimit += card.credit_limit || 0;
      acc[currency].currentBalance += card.current_balance || 0;
      acc[currency].availableLimit += card.available_limit || 0;
      acc[currency].count += 1;
      return acc;
    }, {} as Record<string, { creditLimit: number; currentBalance: number; availableLimit: number; count: number }>);
  }, [creditCards]);

  // Memoized navigation handler
  const handleAccountClick = useCallback((cardId: string) => {
    navigate(`/cashflow/credit-cards/${cardId}`);
  }, [navigate]);

  // Memoized render functions
  const getTitle = useCallback((card: CreditCardAccount) => {
    return card.card_name;
  }, []);

  const getSubtitle = useCallback((card: CreditCardAccount) => {
    return `${card.bank_name}${card.card_number ? ` • ${formatCardNumber(card.card_number)}` : ''}`;
  }, []);

  const getStatBadges = useCallback((card: CreditCardAccount): CardStatBadge[] => [
    {
      key: 'available',
      label: '',
      value: card.available_limit,
      icon: Target,
      variant: 'primary',
      showBalanceToggle: true,
      isCurrency: true,
    },
    {
      key: 'limit',
      label: '/',
      value: card.credit_limit,
      icon: Target,
      variant: 'secondary',
      showBalanceToggle: true,
      isCurrency: true,
    },
  ], []);

  const getCardFields = useCallback((card: CreditCardAccount): CardField[] => [
    {
      key: 'progress',
      label: '',
      value: (
        <div className="w-12 bg-gray-200 rounded-full h-1 mt-0.5">
          <div
            className="bg-purple-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((card.current_balance / card.credit_limit) * 100, 100)}%` }}
          />
        </div>
      ),
      type: 'custom',
    },
  ], []);

  // Render custom header with totals - memoized
  const renderHeader = useCallback((_accounts: CreditCardAccount[], _showBalances: boolean, onAddNew: () => void) => {
    const headerBadges = Object.entries(totals).flatMap(([currency, data]) => [
      {
        key: `${currency}-limit`,
        label: 'Limit',
        value: formatCurrency(data.creditLimit, currency),
        icon: Target,
        variant: 'primary' as const,
        showBalanceToggle: true,
      },
      {
        key: `${currency}-balance`,
        label: 'Bakiye',
        value: formatCurrency(data.currentBalance, currency),
        icon: DollarSign,
        variant: 'secondary' as const,
        showBalanceToggle: true,
      },
      {
        key: `${currency}-available`,
        label: 'Kullanılabilir',
        value: formatCurrency(data.availableLimit, currency),
        icon: TrendingUp,
        variant: 'success' as const,
        showBalanceToggle: true,
      },
    ]);

    return (
      <AccountListHeaderBase
        accountType="credit_card"
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
      accountType="credit_card"
      useAccounts={useCreditCards}
      useDeleteAccount={useDeleteCreditCard}
      showBalances={showBalances}

      // Render functions
      title={getTitle}
      subtitle={getSubtitle}
      statBadges={getStatBadges}
      cardFields={getCardFields}

      // Navigation
      onAccountClick={handleAccountClick}
      detailPath={(cardId) => `/cashflow/credit-cards/${cardId}`}

      // Modals
      modals={{
        create: CreditCardModal,
        edit: CreditCardModal,
      }}

      // Optional
      addButtonLabel="Yeni Kart"
      emptyStateMessage="Henüz kredi kartı yok"

      // Custom header
      renderHeader={renderHeader}
    />
  );
});

CreditCards.displayName = 'CreditCards';

export default CreditCards;
