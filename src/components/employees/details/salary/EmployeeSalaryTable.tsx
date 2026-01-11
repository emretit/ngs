import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnifiedEmployeeTransaction } from "@/types/employee-transactions";
import { EmployeeSalaryTableRow } from "./EmployeeSalaryTableRow";

interface EmployeeSalaryTableProps {
  transactions: UnifiedEmployeeTransaction[];
  employeeId: string;
  onDeleteExpense?: (expenseId: string) => void;
  onDeletePayment?: (paymentId: string) => void;
  onEditExpense?: (expenseId: string) => void;
  isDeleting?: boolean;
}

export const EmployeeSalaryTable = ({
  transactions,
  employeeId,
  onDeleteExpense,
  onDeletePayment,
  onEditExpense,
  isDeleting = false,
}: EmployeeSalaryTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-100 border-b border-slate-200">
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Tarih</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">İşlem No</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">İşlem Tipi</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Açıklama</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Kategori</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Alacak</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Borç</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Bakiye</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center whitespace-nowrap">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-gray-500 text-xs">
              Henüz işlem bulunmuyor
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((transaction) => (
            <EmployeeSalaryTableRow
              key={transaction.id}
              transaction={transaction}
              employeeId={employeeId}
              onDeleteExpense={onDeleteExpense}
              onDeletePayment={onDeletePayment}
              onEditExpense={onEditExpense}
              isDeleting={isDeleting}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};
