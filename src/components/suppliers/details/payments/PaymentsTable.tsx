import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UnifiedTransaction, CreditDebitResult } from "./types";
import { PaymentsTableRow } from "./PaymentsTableRow";
import { Payment } from "@/types/payment";

interface PaymentsTableProps {
  transactions: UnifiedTransaction[];
  getCreditDebit: (transaction: UnifiedTransaction) => CreditDebitResult;
  isDeleting: boolean;
  onDelete: (payment: Payment) => void;
  hasMore: boolean;
  remainingCount: number;
  onLoadMore: () => void;
}

export const PaymentsTable = ({
  transactions,
  getCreditDebit,
  isDeleting,
  onDelete,
  hasMore,
  remainingCount,
  onLoadMore,
}: PaymentsTableProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 border-b border-slate-200">
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Tarih</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Belge No</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Belge Tipi</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide whitespace-nowrap">Açıklama</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Alacak (TRY)</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Borç (TRY)</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Alacak (USD)</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Borç (USD)</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Bakiye (TRY)</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right whitespace-nowrap">Bakiye (USD)</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center whitespace-nowrap">Kur</TableHead>
                  <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center whitespace-nowrap">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-500 text-xs">
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
          </div>
        </div>
      </div>
      
      {hasMore && (
        <div className="flex justify-center py-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="text-sm"
          >
            Daha Fazla Yükle ({remainingCount} işlem kaldı)
          </Button>
        </div>
      )}
    </div>
  );
};
