import { useNavigate } from "react-router-dom";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { UnifiedTransaction, CreditDebitResult } from "./types";
import { getTransactionTypeLabel, getAccountName } from "./utils/paymentUtils";
import { Payment } from "@/types/payment";

interface PaymentsTableRowProps {
  transaction: UnifiedTransaction;
  creditDebit: CreditDebitResult;
  isDeleting: boolean;
  onDelete: (payment: Payment) => void;
}

export const PaymentsTableRow = ({
  transaction,
  creditDebit,
  isDeleting,
  onDelete,
}: PaymentsTableRowProps) => {
  const navigate = useNavigate();
  const { credit, debit, usdCredit, usdDebit } = creditDebit;
  const balanceTRY = transaction.balanceAfter || 0;
  const balanceUSD = transaction.usdBalanceAfter || 0;
  const balanceIndicator = balanceTRY >= 0 ? 'A' : 'B';
  const usdBalanceIndicator = balanceUSD >= 0 ? 'A' : 'B';
  
  const exchangeRate = transaction.exchange_rate || transaction.payment?.exchange_rate || null;
  const currency = transaction.currency || 'TRY';
  const displayExchangeRate = exchangeRate && (currency !== 'TRY' && currency !== 'TL') 
    ? exchangeRate.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    : '-';

  // Devir bakiye satırı
  if (transaction.id === 'opening-balance') {
    return (
      <TableRow className="h-8 bg-blue-50 font-semibold border-b-2 border-blue-200">
        <TableCell className="py-2 px-3 text-xs whitespace-nowrap" colSpan={3}>
          <span className="font-bold text-blue-800">{transaction.description}</span>
        </TableCell>
        <TableCell className="py-2 px-3 text-xs whitespace-nowrap text-center">-</TableCell>
        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
        <TableCell className={`py-2 px-3 text-right text-xs font-bold whitespace-nowrap ${balanceTRY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {balanceTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceIndicator}
        </TableCell>
        <TableCell className={`py-2 px-3 text-right text-xs font-bold whitespace-nowrap ${balanceUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {balanceUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {usdBalanceIndicator}
        </TableCell>
        <TableCell className="py-2 px-3 text-center text-xs whitespace-nowrap">-</TableCell>
        <TableCell className="py-2 px-3 text-center">-</TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="h-8 transition-colors hover:bg-gray-50">
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
        {format(new Date(transaction.date), "dd.MM.yyyy")}
      </TableCell>
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
        {transaction.reference ? (
          (transaction.type === 'purchase_invoice' || transaction.type === 'sales_invoice') ? (
            <button
              onClick={() => {
                if (transaction.type === 'purchase_invoice') {
                  navigate(`/purchase-invoices/${transaction.id}`);
                } else if (transaction.type === 'sales_invoice') {
                  navigate(`/sales-invoices/${transaction.id}`);
                }
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
              title="Fatura detayını görüntüle"
            >
              {transaction.reference}
            </button>
          ) : (
            transaction.reference
          )
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="py-2 px-3 whitespace-nowrap">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${
            transaction.type === 'payment'
              ? transaction.direction === 'incoming'
                ? 'border-green-500 text-green-700 bg-green-50'
                : 'border-red-500 text-red-700 bg-red-50'
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
          {transaction.check && (
            <div className="text-[10px] text-blue-600 mt-0.5 truncate font-medium">
              Çek: {transaction.check.check_number} - {transaction.check.bank}
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
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
        {usdCredit > 0 ? usdCredit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-red-600 whitespace-nowrap">
        {usdDebit > 0 ? usdDebit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
      </TableCell>
      <TableCell className={`py-2 px-3 text-right text-xs font-medium whitespace-nowrap ${balanceTRY >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {balanceTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceIndicator}
      </TableCell>
      <TableCell className={`py-2 px-3 text-right text-xs font-medium whitespace-nowrap ${balanceUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {balanceUSD.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {usdBalanceIndicator}
      </TableCell>
      <TableCell className="py-2 px-3 text-center text-xs whitespace-nowrap">
        {displayExchangeRate !== '-' ? (
          <div>
            <div className="font-medium">{displayExchangeRate}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{currency} → TRY</div>
          </div>
        ) : '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        {transaction.type === 'payment' && transaction.payment && (
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
