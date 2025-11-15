import { memo, useCallback } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ClipboardList } from "lucide-react";
import { InventoryTransaction, TransactionType, TransactionStatus } from "@/types/inventory";
import InventoryTransactionsTableHeader from "./table/InventoryTransactionsTableHeader";
import InventoryTransactionsTableRow from "./table/InventoryTransactionsTableRow";
import InventoryTransactionsTableSkeleton from "./table/InventoryTransactionsTableSkeleton";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface InventoryTransactionsTableProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  sortField: "transaction_number" | "transaction_date" | "transaction_type" | "status";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "transaction_number" | "transaction_date" | "transaction_type" | "status") => void;
  onSelectTransaction?: (transaction: InventoryTransaction) => void;
  onTransactionSelect?: (transaction: InventoryTransaction) => void;
  selectedTransactions?: InventoryTransaction[];
  onEdit?: (transaction: InventoryTransaction) => void;
  onDelete?: (transaction: InventoryTransaction) => void;
  onApprove?: (transaction: InventoryTransaction) => void;
  onCancel?: (transaction: InventoryTransaction) => void;
  onPrint?: (transaction: InventoryTransaction) => void;
}

const InventoryTransactionsTable = ({
  transactions,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount = 0,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSelectTransaction,
  onTransactionSelect,
  selectedTransactions = [],
  onEdit,
  onDelete,
  onApprove,
  onCancel,
  onPrint,
}: InventoryTransactionsTableProps) => {

  const handleTransactionSelectToggle = useCallback((transaction: InventoryTransaction) => {
    const isSelected = selectedTransactions.some(t => t.id === transaction.id);
    if (isSelected) {
      // Seçimi kaldır
      onTransactionSelect?.(transaction);
    } else {
      // Seç
      onTransactionSelect?.(transaction);
    }
  }, [selectedTransactions, onTransactionSelect]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      transactions?.forEach(t => {
        if (!selectedTransactions.some(st => st.id === t.id)) {
          onTransactionSelect?.(t);
    }
      });
    } else {
      transactions?.forEach(t => onTransactionSelect?.(t));
    }
  }, [transactions, selectedTransactions, onTransactionSelect]);

  if (isLoading && (!transactions || transactions.length === 0)) {
    return <InventoryTransactionsTableSkeleton />;
    }

    return (
    <div className="-mx-4">
      <div className="px-4">
      <Table>
        <InventoryTransactionsTableHeader 
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSortFieldChange}
          hasSelection={true}
          onSelectAll={handleSelectAll}
          isAllSelected={selectedTransactions.length > 0 && selectedTransactions.length === (transactions?.length || 0)}
          totalTransactions={totalCount}
        />
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                Yükleniyor...
              </TableCell>
            </TableRow>
          ) : transactions?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                İşlem bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            transactions?.map((transaction) => {
              const isSelected = selectedTransactions.some(t => t.id === transaction.id);
              return (
                <InventoryTransactionsTableRow
                  key={transaction.id}
                  transaction={transaction}
                  onSelect={onTransactionSelect}
                  onSelectToggle={handleTransactionSelectToggle}
                  onView={onSelectTransaction}
                  isSelected={isSelected}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onApprove={onApprove}
                  onCancel={onCancel}
                  onPrint={onPrint}
                />
              );
            })
          )}
        </TableBody>
      </Table>
      </div>

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div className="px-4">
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            className="mt-4"
          >
            <div />
          </InfiniteScroll>
        </div>
      )}
              </div>
  );
};

export default memo(InventoryTransactionsTable);

