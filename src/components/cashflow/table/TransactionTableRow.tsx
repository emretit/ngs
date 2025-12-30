import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Transaction {
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
  reference?: string | null;
  user_name?: string | null;
}

interface TransactionTableRowProps {
  transaction: Transaction;
  index: number;
  showBalances: boolean;
  hideUsdColumns?: boolean;
  currency: string;
  usdRate: number;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  isDeleting?: boolean;
}

export const TransactionTableRow: React.FC<TransactionTableRowProps> = ({
  transaction,
  index,
  showBalances,
  hideUsdColumns = false,
  currency,
  usdRate,
  onEdit,
  onDelete,
  isDeleting = false
}) => {
  const navigate = useNavigate();

  // Hesaplar için borç/alacak hesaplama
  const getAccountCreditDebit = () => {
    if (transaction.type === "income") {
      const usdAmount = currency === 'USD' ? transaction.amount : transaction.amount / usdRate;
      return {
        credit: transaction.amount,
        debit: 0,
        usdCredit: usdAmount,
        usdDebit: 0,
      };
    }
    
    if (transaction.type === "expense") {
      const usdAmount = currency === 'USD' ? transaction.amount : transaction.amount / usdRate;
      return {
        credit: 0,
        debit: transaction.amount,
        usdCredit: 0,
        usdDebit: usdAmount,
      };
    }
    
    return {
      credit: 0,
      debit: 0,
      usdCredit: 0,
      usdDebit: 0,
    };
  };

  const { credit, debit, usdCredit, usdDebit } = getAccountCreditDebit();
  const usdBalance = transaction.usdBalanceAfter ?? 0;
  const balanceIndicator = (transaction.balanceAfter || 0) >= 0 ? 'A' : 'B';
  const usdBalanceIndicator = usdBalance >= 0 ? 'A' : 'B';
  const exchangeRate = currency === 'USD' ? 1 : usdRate;

  const getTransactionTypeLabel = () => {
    if (transaction.isTransfer) {
      return transaction.transfer_direction === 'incoming' ? 'Transfer (Giriş)' : 'Transfer (Çıkış)';
    }
    return transaction.type === "income" ? "Gelir" : "Gider";
  };
  
  const getTransactionTypeBadge = () => {
    if (transaction.isTransfer) {
      return transaction.transfer_direction === 'incoming'
        ? 'border-blue-400 text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-md shadow-blue-500/30'
        : 'border-purple-400 text-white bg-gradient-to-r from-purple-500 to-purple-600 shadow-md shadow-purple-500/30';
    }
    return transaction.type === "income"
      ? 'border-green-400 text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-md shadow-green-500/30'
      : 'border-red-400 text-white bg-gradient-to-r from-red-500 to-rose-600 shadow-md shadow-red-500/30';
  };

  const getAccountName = () => {
    if (transaction.customer_name) return transaction.customer_name;
    if (transaction.supplier_name) return transaction.supplier_name;
    return "-";
  };

  const getExpenseDescription = () => {
    if (!transaction.description) return "Masraf";
    
    if (transaction.description.startsWith("Masraf: ")) {
      return "Masraf";
    }
    
    return transaction.description;
  };

  const getExpenseIdFromReference = (reference: string | null | undefined): string | null => {
    if (!reference || !reference.startsWith("EXP-")) return null;
    return reference.replace("EXP-", "");
  };

  const handleTransactionClick = () => {
    const expenseId = getExpenseIdFromReference(transaction.reference);
    if (expenseId) {
      navigate(`/cashflow/expenses?expenseId=${expenseId}`);
    }
  };

  const hasClickableReference = !!getExpenseIdFromReference(transaction.reference);

  return (
    <TableRow
      key={transaction.id}
      className="h-8 cursor-pointer transition-colors hover:bg-gray-50"
    >
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap font-medium text-gray-700">
        {format(new Date(transaction.transaction_date), "dd.MM.yyyy")}
      </TableCell>
      <TableCell className="py-2 px-3 whitespace-nowrap w-24">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] px-2 py-0.5 font-bold shadow-sm",
            getTransactionTypeBadge()
          )}
        >
          {getTransactionTypeLabel()}
        </Badge>
      </TableCell>
      <TableCell className="py-2 px-3 text-xs max-w-[200px]">
        <div 
          className={cn(
            "truncate",
            hasClickableReference && 'cursor-pointer hover:text-blue-600 hover:underline'
          )}
          title={transaction.description || transaction.category || '-'}
          onClick={hasClickableReference ? handleTransactionClick : undefined}
        >
          {hasClickableReference 
            ? getExpenseDescription()
            : (transaction.description || transaction.category || '-')}
          {getAccountName() !== '-' && (
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {getAccountName()}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap font-medium text-gray-600">
        {transaction.user_name || '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
        {credit > 0 ? (showBalances ? credit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••") : '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-red-600 whitespace-nowrap">
        {debit > 0 ? (showBalances ? debit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••") : '-'}
      </TableCell>
      {!hideUsdColumns && (
        <>
          <TableCell className="py-2 px-3 text-right text-xs font-medium text-red-600 whitespace-nowrap">
            {usdDebit > 0 ? (showBalances ? usdDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••") : '-'}
          </TableCell>
          <TableCell className="py-2 px-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
            {usdCredit > 0 ? (showBalances ? usdCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "••••••") : '-'}
          </TableCell>
          <TableCell className={cn(
            "py-2 px-3 text-right text-xs font-medium whitespace-nowrap",
            usdBalance >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {showBalances 
              ? `${usdBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${usdBalanceIndicator}`
              : "••••••"}
          </TableCell>
        </>
      )}
      <TableCell className={cn(
        "py-2 px-3 text-right text-xs font-medium whitespace-nowrap",
        (transaction.balanceAfter || 0) >= 0 ? 'text-green-600' : 'text-red-600'
      )}>
        {showBalances 
          ? `${(transaction.balanceAfter || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${balanceIndicator}`
          : "••••••"}
      </TableCell>
      {!hideUsdColumns && (
        <TableCell className="py-2 px-3 text-right text-xs text-muted-foreground whitespace-nowrap">
          {showBalances ? exchangeRate.toFixed(6) : "••••••"}
        </TableCell>
      )}
      <TableCell className="py-2 px-3 text-center">
        <div className="flex justify-center space-x-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Düzenle"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Sil"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction);
              }}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

