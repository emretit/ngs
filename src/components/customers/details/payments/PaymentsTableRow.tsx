import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { UnifiedTransaction, getTransactionTypeLabel, getAccountName, getCreditDebit, getUsdAmount } from "./utils/paymentUtils";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface PaymentsTableRowProps {
  transaction: UnifiedTransaction;
  usdRate: number;
  onDelete?: (payment: any) => void;
  isDeleting?: boolean;
}

export const PaymentsTableRow = ({
  transaction,
  usdRate,
  onDelete,
  isDeleting = false,
}: PaymentsTableRowProps) => {
  const { convertCurrency } = useExchangeRates();
  
  const { credit, debit, usdCredit, usdDebit } = getCreditDebit(transaction, usdRate, convertCurrency);
  const usdBalance = transaction.balanceAfter ? getUsdAmount(transaction.balanceAfter, transaction.currency, usdRate, convertCurrency) : 0;
  const balanceIndicator = (transaction.balanceAfter || 0) >= 0 ? 'A' : 'B';
  const usdBalanceIndicator = usdBalance >= 0 ? 'A' : 'B';
  const exchangeRate = transaction.currency === 'USD' ? 1 : usdRate;

  return (
    <TableRow key={`${transaction.type}-${transaction.id}`} className="h-8 transition-colors hover:bg-gray-50">
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
        {format(new Date(transaction.date), "dd.MM.yyyy")}
      </TableCell>
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
        {transaction.reference || '-'}
      </TableCell>
      <TableCell className="py-2 px-3 whitespace-nowrap">
        <Badge 
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${
            transaction.type === 'payment' 
              ? transaction.direction === 'incoming'
                ? 'border-green-500 text-green-700 bg-green-50'
                : 'border-red-500 text-red-700 bg-red-50'
              : transaction.type === 'check'
              ? transaction.direction === 'incoming'
                ? 'border-blue-500 text-blue-700 bg-blue-50'
                : 'border-purple-500 text-purple-700 bg-purple-50'
              : transaction.type === 'sales_invoice'
              ? 'border-green-500 text-green-700 bg-green-50'
              : transaction.type === 'purchase_invoice'
              ? 'border-orange-500 text-orange-700 bg-orange-50'
              : 'border-gray-500 text-gray-700 bg-gray-50'
          }`}
        >
          {getTransactionTypeLabel(transaction.type, transaction.direction, transaction.paymentType)}
        </Badge>
      </TableCell>
      <TableCell className="py-2 px-3 text-xs max-w-[200px]">
        <div className="truncate" title={transaction.description}>
          {transaction.description}
          {transaction.type === 'payment' && transaction.payment && (
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {getAccountName(transaction.payment)}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
        {credit > 0 ? credit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-red-600 whitespace-nowrap">
        {debit > 0 ? debit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-red-600 whitespace-nowrap">
        {usdDebit > 0 ? usdDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
        {usdCredit > 0 ? usdCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
      </TableCell>
      <TableCell className={`py-2 px-3 text-right text-xs font-medium whitespace-nowrap ${usdBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {usdBalance.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {usdBalanceIndicator}
      </TableCell>
      <TableCell className={`py-2 px-3 text-right text-xs font-medium whitespace-nowrap ${(transaction.balanceAfter || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {(transaction.balanceAfter || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceIndicator}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs text-muted-foreground whitespace-nowrap">
        {exchangeRate.toFixed(6)}
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        {transaction.type === 'payment' && transaction.payment && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(transaction.payment!)}
            disabled={isDeleting}
            title="Ödemeyi sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};

