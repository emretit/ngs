import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UnifiedTransaction } from "./utils/paymentUtils";
import { PaymentsTableRow } from "./PaymentsTableRow";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useMemo } from "react";

interface PaymentsTableProps {
  transactions: UnifiedTransaction[];
  onDelete?: (payment: any) => void;
  isDeleting?: boolean;
  customerId?: string;
  supplierId?: string;
}

export const PaymentsTable = ({
  transactions,
  onDelete,
  isDeleting = false,
  customerId,
  supplierId,
}: PaymentsTableProps) => {
  const { exchangeRates } = useExchangeRates();
  
  const usdRate = useMemo(() => {
    const rate = exchangeRates.find(r => r.currency_code === 'USD');
    return rate?.forex_selling || 1;
  }, [exchangeRates]);

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
              usdRate={usdRate}
              onDelete={onDelete}
              isDeleting={isDeleting}
              customerId={customerId}
              supplierId={supplierId}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

