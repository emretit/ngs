import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { UnifiedEmployeeTransaction } from "@/types/employee-transactions";

interface EmployeeSalaryTableRowProps {
  transaction: UnifiedEmployeeTransaction;
  employeeId: string;
  onDeleteExpense?: (expenseId: string) => void;
  onDeletePayment?: (paymentId: string) => void;
  onEditExpense?: (expenseId: string) => void;
  isDeleting?: boolean;
}

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    tahakkuk: 'Tahakkuk',
    odeme: 'Ödeme',
    masraf: 'Masraf',
    avans: 'Avans',
    prim: 'Prim',
    kesinti: 'Kesinti',
  };
  return labels[type] || type;
};

const getTransactionTypeBadgeColor = (type: string): string => {
  const colors: Record<string, string> = {
    tahakkuk: 'border-green-500 text-green-700 bg-green-50',
    odeme: 'border-blue-500 text-blue-700 bg-blue-50',
    masraf: 'border-red-500 text-red-700 bg-red-50',
    avans: 'border-orange-500 text-orange-700 bg-orange-50',
    prim: 'border-purple-500 text-purple-700 bg-purple-50',
    kesinti: 'border-gray-500 text-gray-700 bg-gray-50',
  };
  return colors[type] || 'border-gray-500 text-gray-700 bg-gray-50';
};

const getCreditDebit = (transaction: UnifiedEmployeeTransaction) => {
  // Tahakkuk, Masraf, Prim → Çalışana ALACAK (şirket borçlu)
  if (transaction.type === 'tahakkuk' || transaction.type === 'masraf' || transaction.type === 'prim') {
    return { credit: transaction.amount, debit: 0 };
  }
  // Ödeme, Avans, Kesinti → Çalışana BORÇ
  else {
    return { credit: 0, debit: transaction.amount };
  }
};

export const EmployeeSalaryTableRow = ({
  transaction,
  employeeId,
  onDeleteExpense,
  onDeletePayment,
  onEditExpense,
  isDeleting = false,
}: EmployeeSalaryTableRowProps) => {
  // Devir bakiye kontrolü
  const isOpeningBalance = transaction.id === 'opening-balance';

  const { credit, debit } = getCreditDebit(transaction);
  const balance = transaction.balanceAfter ?? 0;
  const balanceIndicator = balance >= 0 ? 'A' : 'B';

  // Devir bakiye satırı için özel gösterim
  if (isOpeningBalance) {
    return (
      <TableRow key={transaction.id} className="h-8 bg-blue-50 font-semibold border-b-2 border-blue-200">
        <TableCell className="py-2 px-3 text-xs whitespace-nowrap" colSpan={3}>
          <span className="font-bold text-blue-800">{transaction.description}</span>
        </TableCell>
        <TableCell className="py-2 px-3 text-xs whitespace-nowrap">-</TableCell>
        <TableCell className="py-2 px-3 text-xs whitespace-nowrap">-</TableCell>
        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
        <TableCell className="py-2 px-3 text-right text-xs whitespace-nowrap">-</TableCell>
        <TableCell className={`py-2 px-3 text-right text-xs font-bold whitespace-nowrap ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {Math.abs(balance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceIndicator}
        </TableCell>
        <TableCell className="py-2 px-3 text-center">-</TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow key={transaction.id} className="h-8 transition-colors hover:bg-gray-50">
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
        {format(new Date(transaction.date), "dd.MM.yyyy")}
      </TableCell>
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
        {transaction.reference || '-'}
      </TableCell>
      <TableCell className="py-2 px-3 whitespace-nowrap">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${getTransactionTypeBadgeColor(transaction.type)}`}
        >
          {getTransactionTypeLabel(transaction.type)}
        </Badge>
      </TableCell>
      <TableCell className="py-2 px-3 text-xs max-w-[200px]">
        <div className="truncate" title={transaction.description}>
          {transaction.description}
          {transaction.paymentMethod && (
            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {transaction.paymentMethod}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2 px-3 text-xs whitespace-nowrap">
        {transaction.category || '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-green-600 whitespace-nowrap">
        {credit > 0 ? credit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs font-medium text-red-600 whitespace-nowrap">
        {debit > 0 ? debit.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
      </TableCell>
      <TableCell className={`py-2 px-3 text-right text-xs font-medium whitespace-nowrap ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {Math.abs(balance).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {balanceIndicator}
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {transaction.type === 'masraf' && transaction.expense_id && onEditExpense && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => onEditExpense(transaction.expense_id!)}
              disabled={isDeleting}
              title="Düzenle"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {transaction.type === 'masraf' && transaction.expense_id && onDeleteExpense && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDeleteExpense(transaction.expense_id!)}
              disabled={isDeleting}
              title="Masrafı Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {transaction.type === 'odeme' && onDeletePayment && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDeletePayment(transaction.id)}
              disabled={isDeleting}
              title="Ödemeyi Sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
