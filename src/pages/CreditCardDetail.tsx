import { useState, useMemo, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Settings,
  DollarSign,
  Target,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useCreditCardDetail, useCreditCardTransactions } from "@/hooks/useAccountDetail";
import CreditCardIncomeModal from "@/components/cashflow/modals/CreditCardIncomeModal";
import CreditCardExpenseModal from "@/components/cashflow/modals/CreditCardExpenseModal";
import CreditCardModal from "@/components/cashflow/modals/CreditCardModal";
import TransferModal from "@/components/cashflow/modals/TransferModal";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { AccountDetailBase } from "@/components/cashflow/base/AccountDetailBase";

/**
 * Helper function to get card type label
 */
const getCardTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    'credit': 'Kredi Kartı',
    'debit': 'Banka Kartı',
    'corporate': 'Kurumsal Kart'
  };
  return types[type] || type;
};

/**
 * Available Limit Modal Component (Credit Card specific feature)
 */
const AvailableLimitModal = ({
  isOpen,
  onClose,
  cardId,
  initialValue,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  initialValue: number;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const [availableLimitValue, setAvailableLimitValue] = useState(String(initialValue || ""));

  // Update available limit mutation
  const updateAvailableLimitMutation = useMutation({
    mutationFn: async (newAvailableLimit: number) => {
      if (!cardId) throw new Error("Kart ID bulunamadı");

      const { error } = await supabase
        .from('credit_cards')
        .update({
          available_limit: newAvailableLimit
        })
        .eq('id', cardId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kullanılabilir limit başarıyla güncellendi");
      queryClient.invalidateQueries({ queryKey: ['credit-card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['credit-card-transactions', cardId] });
      setAvailableLimitValue("");
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error("Limit güncellenirken hata oluştu: " + (error.message || "Bilinmeyen hata"));
    }
  });

  const handleUpdateAvailableLimit = () => {
    const limitValue = parseFloat(availableLimitValue);
    if (isNaN(limitValue) || limitValue < 0) {
      toast.error("Geçerli bir limit değeri girin");
      return;
    }
    updateAvailableLimitMutation.mutate(limitValue);
  };

  return (
    <UnifiedDialog
      isOpen={isOpen}
      onClose={(open) => {
        onClose();
        if (!open) {
          setAvailableLimitValue("");
        }
      }}
      title="Kullanılabilir Limit Düzelt"
      maxWidth="md"
      headerColor="purple"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="available_limit" className="text-sm font-medium text-gray-700">
            Kullanılabilir Limit
          </Label>
          <Input
            id="available_limit"
            type="number"
            value={availableLimitValue}
            onChange={(e) => setAvailableLimitValue(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="h-10"
          />
          <p className="text-xs text-gray-500">
            Kredi kartının kullanılabilir limitini manuel olarak güncelleyin.
          </p>
        </div>
      </div>
      <UnifiedDialogFooter>
        <UnifiedDialogCancelButton
          onClick={() => {
            onClose();
            setAvailableLimitValue("");
          }}
        />
        <UnifiedDialogActionButton
          onClick={handleUpdateAvailableLimit}
          disabled={updateAvailableLimitMutation.isPending || !availableLimitValue}
        >
          {updateAvailableLimitMutation.isPending ? "Güncelleniyor..." : "Güncelle"}
        </UnifiedDialogActionButton>
      </UnifiedDialogFooter>
    </UnifiedDialog>
  );
};

/**
 * Credit Card Detail Page (Refactored)
 * Uses AccountDetailBase for common functionality
 *
 * Original: 587 lines
 * Refactored: ~180 lines (69% reduction)
 */
const CreditCardDetail = memo(() => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  // Custom modal state (Available Limit - specific to credit cards)
  const [isAvailableLimitModalOpen, setIsAvailableLimitModalOpen] = useState(false);

  // Get card details for custom modal only
  const { data: card } = useCreditCardDetail(id);

  return (
    <AccountDetailBase
      accountId={id!}
      accountType="credit_card"
      useAccountDetail={useCreditCardDetail}
      useAccountTransactions={useCreditCardTransactions}

      // Header configuration
      title={(card) => card.card_name}
      subtitle={(card) => `${getCardTypeLabel(card.card_type)} • ${card.status === 'active' ? "Aktif" : "Pasif"}`}

      // Stat badges configuration
      statBadges={(card, transactions) => {
        const expense = transactions
          .filter(t => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        return [
          {
            key: 'limit',
            label: 'Limit',
            value: card.credit_limit,
            icon: Target,
            variant: 'primary',
            showBalanceToggle: true,
            isCurrency: true,
          },
          {
            key: 'balance',
            label: 'Bakiye',
            value: card.current_balance,
            icon: DollarSign,
            variant: 'secondary',
            showBalanceToggle: true,
            isCurrency: true,
          },
          {
            key: 'available',
            label: 'Kullanılabilir',
            value: card.available_limit,
            icon: TrendingUp,
            variant: 'success',
            showBalanceToggle: true,
            isCurrency: true,
          },
          {
            key: 'expense',
            label: 'Harcama',
            value: expense,
            icon: TrendingDown,
            variant: 'danger',
            showBalanceToggle: true,
            isCurrency: true,
          },
        ];
      }}

      // Sidebar fields configuration
      sidebarFields={(card) => [
        {
          key: 'name',
          label: 'Kart Adı',
          value: card.card_name,
        },
        {
          key: 'type',
          label: 'Kart Türü',
          value: getCardTypeLabel(card.card_type),
        },
        {
          key: 'bank',
          label: 'Banka',
          value: card.bank_name,
        },
        {
          key: 'status',
          label: 'Durum',
          value: (
            <Badge className={card.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              <Activity className="h-2.5 w-2.5 mr-0.5" />
              {card.status === 'active' ? "Aktif" : "Pasif"}
            </Badge>
          ),
          type: 'custom',
        },
      ]}

      // Quick actions configuration
      quickActions={(handlers) => [
        {
          key: 'income',
          label: 'Ödeme Ekle',
          icon: Plus,
          onClick: handlers.onAddIncome,
          variant: 'income',
        },
        {
          key: 'expense',
          label: 'Harcama Ekle',
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
        {
          key: 'adjust_limit',
          label: 'Kullanılabilir Limit Düzelt',
          icon: Settings,
          onClick: () => setIsAvailableLimitModalOpen(true),
          variant: 'custom',
        },
      ]}

      // Modals configuration
      modals={{
        edit: CreditCardModal,
        income: CreditCardIncomeModal,
        expense: CreditCardExpenseModal,
        transfer: TransferModal,
        custom: [
          {
            component: AvailableLimitModal,
            isOpen: isAvailableLimitModalOpen,
            onClose: () => setIsAvailableLimitModalOpen(false),
            props: {
              cardId: id!,
              initialValue: card?.available_limit || 0,
              onSuccess: () => {},
            },
          },
        ],
      }}

      // Transaction history configuration
      transactionHistoryConfig={{
        hideUsdColumns: true,
        initialBalance: (card) => card.available_limit,
      }}
    />
  );
});

export default CreditCardDetail;
