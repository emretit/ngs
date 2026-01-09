import { useState, useMemo, memo } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  DollarSign,
  Activity,
  Percent,
  PieChart
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePartnerAccountDetail, usePartnerAccountTransactions } from "@/hooks/useAccountDetail";
import PartnerIncomeModal from "@/components/cashflow/modals/PartnerIncomeModal";
import PartnerExpenseModal from "@/components/cashflow/modals/PartnerExpenseModal";
import PartnerAccountModal from "@/components/cashflow/modals/PartnerAccountModal";
import TransferModal from "@/components/cashflow/modals/TransferModal";
import { AccountDetailBase } from "@/components/cashflow/base/AccountDetailBase";

/**
 * Helper function to get partner type label
 */
const getPartnerTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    'active': 'Aktif Ortak',
    'silent': 'Sessiz Ortak',
    'limited': 'Sınırlı Ortak',
    'general': 'Genel Ortak'
  };
  return types[type] || type;
};

/**
 * Partner Account Detail Page (Refactored)
 * Uses AccountDetailBase for common functionality
 *
 * Original: ~714 lines
 * Refactored: ~160 lines (78% reduction)
 */
const PartnerAccountDetail = memo(() => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  return (
    <AccountDetailBase
      accountId={id!}
      accountType="partner"
      useAccountDetail={usePartnerAccountDetail}
      useAccountTransactions={usePartnerAccountTransactions}

      // Header configuration
      title={(account) => account.partner_name || "Ortak Hesabı"}
      subtitle={(account) => `${getPartnerTypeLabel(account.partner_type || 'active')} • ${account.is_active ? "Aktif" : "Pasif"}`}

      // Stat badges configuration
      statBadges={(account, transactions) => {
        const totalIncome = transactions
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
          .filter(t => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        return [
          {
            key: 'ownership',
            label: 'Hisse Oranı',
            value: `${account.ownership_percentage || 0}%`,
            icon: Percent,
            variant: 'primary',
            showBalanceToggle: false,
          },
          {
            key: 'balance',
            label: 'Bakiye',
            value: account.current_balance || 0,
            icon: DollarSign,
            variant: 'secondary',
            showBalanceToggle: true,
            isCurrency: true,
          },
          {
            key: 'income',
            label: 'Toplam Gelir',
            value: totalIncome,
            icon: TrendingUp,
            variant: 'success',
            showBalanceToggle: true,
            isCurrency: true,
          },
          {
            key: 'expense',
            label: 'Toplam Gider',
            value: totalExpense,
            icon: TrendingDown,
            variant: 'danger',
            showBalanceToggle: true,
            isCurrency: true,
          },
        ];
      }}

      // Sidebar fields configuration
      sidebarFields={(account) => [
        {
          key: 'name',
          label: 'Ortak Adı',
          value: account.partner_name || "Ortak Hesabı",
        },
        {
          key: 'type',
          label: 'Ortak Türü',
          value: getPartnerTypeLabel(account.partner_type || 'active'),
        },
        {
          key: 'ownership',
          label: 'Hisse Oranı',
          value: `${account.ownership_percentage || 0}%`,
        },
        {
          key: 'currency',
          label: 'Para Birimi',
          value: account.currency,
        },
        {
          key: 'balance',
          label: 'Güncel Bakiye',
          value: `${account.current_balance || 0} ${account.currency}`,
        },
        {
          key: 'status',
          label: 'Durum',
          value: (
            <Badge className={account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              <Activity className="h-2.5 w-2.5 mr-0.5" />
              {account.is_active ? "Aktif" : "Pasif"}
            </Badge>
          ),
          type: 'custom',
        },
      ]}

      // Quick actions configuration
      quickActions={(handlers) => [
        {
          key: 'income',
          label: 'Gelir Ekle',
          icon: Plus,
          onClick: handlers.onAddIncome,
          variant: 'income',
        },
        {
          key: 'expense',
          label: 'Gider Ekle',
          icon: Minus,
          onClick: handlers.onAddExpense,
          variant: 'expense',
        },
        {
          key: 'transfer',
          label: 'Transfer Yap',
          icon: ArrowLeft,
          onClick: handlers.onTransfer,
          variant: 'transfer',
        },
      ]}

      // Modals configuration
      modals={{
        edit: PartnerAccountModal,
        income: PartnerIncomeModal,
        expense: PartnerExpenseModal,
        transfer: TransferModal,
      }}

      // Transaction history configuration
      transactionHistoryConfig={{
        hideUsdColumns: false,
        initialBalance: (account) => 0,
      }}
    />
  );
});

export default PartnerAccountDetail;
