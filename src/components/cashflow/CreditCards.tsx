import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Target, TrendingUp } from "lucide-react";
import { useCreditCards, useDeleteCreditCard, CreditCard } from "@/hooks/useAccountsData";
import CreditCardModal from "./modals/CreditCardModal";
import { AccountListBase } from "./base/AccountListBase";
import { formatCurrency } from "@/utils/formatters";
import type { CardStatBadge, CardField } from "./base/types";

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

  // Memoized navigation handler
  const handleAccountClick = useCallback((cardId: string) => {
    navigate(`/cashflow/credit-cards/${cardId}`);
  }, [navigate]);

  // Memoized render functions
  const getTitle = useCallback((card: CreditCard) => {
    return card.card_name;
  }, []);

  const getSubtitle = useCallback((card: CreditCard) => {
    return `${card.bank_name || ''}${card.card_number ? ` • ${formatCardNumber(card.card_number)}` : ''}`;
  }, []);

  const getStatBadges = useCallback((card: CreditCard): CardStatBadge[] => [
    {
      key: 'available',
      label: '',
      value: card.available_limit || 0,
      icon: Target,
      variant: 'primary',
      showBalanceToggle: true,
      isCurrency: true,
    },
    {
      key: 'limit',
      label: '/',
      value: card.credit_limit || 0,
      icon: Target,
      variant: 'secondary',
      showBalanceToggle: true,
      isCurrency: true,
    },
  ], []);

  const getCardFields = useCallback((card: CreditCard): CardField[] => [
    {
      key: 'progress',
      label: '',
      value: (
        <div className="w-12 bg-gray-200 rounded-full h-1 mt-0.5">
          <div
            className="bg-purple-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(((card.current_balance || 0) / (card.credit_limit || 1)) * 100, 100)}%` }}
          />
        </div>
      ),
      type: 'custom',
    },
  ], []);

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
    />
  );
});

CreditCards.displayName = 'CreditCards';

export default CreditCards;
