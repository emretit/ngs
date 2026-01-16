import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnifiedTransaction, CreditDebitResult } from "./types";
import { PaymentsTableRow } from "./PaymentsTableRow";
import { Payment } from "@/types/payment";

interface PaymentsTableProps {
  transactions: UnifiedTransaction[];
  getCreditDebit: (transaction: UnifiedTransaction) => CreditDebitResult;
  isDeleting: boolean;
  onDelete: (payment: Payment) => void;
}

export const PaymentsTable = ({
  transactions,
  getCreditDebit,
  isDeleting,
  onDelete,
}: PaymentsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-100 border-b border-slate-200">
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Tarih</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Belge No</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Vade Tarihi</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Belge Tipi</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Açıklama</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Alacak</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Borç</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">$ Borç</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">$ Alacak</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">$ Bakiye</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Bakiye</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">$ Kur</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center whitespace-nowrap">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={13} className="text-center py-8 text-gray-500 text-xs">
              Henüz işlem bulunmuyor
            </TableCell>
          </TableRow>
        ) : (
          transactions.map((transaction) => (
            <PaymentsTableRow
              key={`${transaction.type}-${transaction.id}`}
              transaction={transaction}
              creditDebit={getCreditDebit(transaction)}
              isDeleting={isDeleting}
              onDelete={onDelete}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};
