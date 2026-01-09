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
  Activity
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCashAccountDetail, useCashAccountTransactions } from "@/hooks/useAccountDetail";
import CashIncomeModal from "@/components/cashflow/modals/CashIncomeModal";
import CashExpenseModal from "@/components/cashflow/modals/CashExpenseModal";
import CashAccountModal from "@/components/cashflow/modals/CashAccountModal";
import TransferModal from "@/components/cashflow/modals/TransferModal";
import { AccountDetailBase } from "@/components/cashflow/base/AccountDetailBase";

/**
 * Cash Account Detail Page (Refactored)
 * Uses AccountDetailBase for common functionality
 *
 * Original: ~684 lines
 * Refactored: ~130 lines (81% reduction)
 */
const CashAccountDetail = memo(() => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  return (
    <AccountDetailBase
      accountId={id!}
      accountType="cash"
      useAccountDetail={useCashAccountDetail}
      useAccountTransactions={useCashAccountTransactions}

      // Header configuration
      title={(account) => account.name || "Nakit Hesabı"}
      subtitle={(account) => `${account.currency} • ${account.is_active ? "Aktif" : "Pasif"}`}

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
            key: 'balance',
            label: 'Bakiye',
            value: account.current_balance || 0,
            icon: DollarSign,
            variant: 'primary',
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
          label: 'Hesap Adı',
          value: account.name || "Nakit Hesabı",
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
        edit: CashAccountModal,
        income: CashIncomeModal,
        expense: CashExpenseModal,
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

export default CashAccountDetail;
