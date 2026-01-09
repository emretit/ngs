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
  Building,
  Target
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBankAccountDetail, useBankAccountTransactions } from "@/hooks/useAccountDetail";
import BankIncomeModal from "@/components/cashflow/modals/BankIncomeModal";
import BankExpenseModal from "@/components/cashflow/modals/BankExpenseModal";
import BankAccountModal from "@/components/cashflow/modals/BankAccountModal";
import TransferModal from "@/components/cashflow/modals/TransferModal";
import { AccountDetailBase } from "@/components/cashflow/base/AccountDetailBase";
import { formatIBAN } from "@/components/cashflow/base/utils";

/**
 * Helper function to get account type label
 */
const getAccountTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    'checking': 'Vadesiz Hesap',
    'savings': 'Vadeli Hesap',
    'business': 'Ticari Hesap',
    'investment': 'Yatırım Hesabı'
  };
  return types[type] || type;
};

/**
 * Bank Account Detail Page (Refactored)
 * Uses AccountDetailBase for common functionality
 *
 * Original: ~515 lines
 * Refactored: ~175 lines (66% reduction)
 */
const BankAccountDetail = memo(() => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  return (
    <AccountDetailBase
      accountId={id!}
      accountType="bank"
      useAccountDetail={useBankAccountDetail}
      useAccountTransactions={useBankAccountTransactions}

      // Header configuration
      title={(account) => account.account_name || "Banka Hesabı"}
      subtitle={(account) => `${account.bank_name} • ${getAccountTypeLabel(account.account_type || 'checking')}`}

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
            key: 'available',
            label: 'Kullanılabilir',
            value: account.available_balance || account.current_balance || 0,
            icon: Target,
            variant: 'success',
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
          value: account.account_name || "Banka Hesabı",
        },
        {
          key: 'bank',
          label: 'Banka',
          value: account.bank_name,
        },
        {
          key: 'type',
          label: 'Hesap Türü',
          value: getAccountTypeLabel(account.account_type || 'checking'),
        },
        {
          key: 'iban',
          label: 'IBAN',
          value: formatIBAN(account.iban),
        },
        {
          key: 'currency',
          label: 'Para Birimi',
          value: account.currency,
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
        edit: BankAccountModal,
        income: BankIncomeModal,
        expense: BankExpenseModal,
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

export default BankAccountDetail;
