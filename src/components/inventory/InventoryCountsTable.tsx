import { memo } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";
import { InventoryTransaction } from "@/types/inventory";
import InventoryCountsTableHeader from "./table/InventoryCountsTableHeader";
import InventoryCountsTableRow from "./table/InventoryCountsTableRow";

interface InventoryCountsTableProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  sortField: "transaction_number" | "transaction_date" | "status";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "transaction_number" | "transaction_date" | "status") => void;
  onSelectTransaction: (transaction: InventoryTransaction) => void;
  onEdit?: (transaction: InventoryTransaction) => void;
  onDelete?: (transaction: InventoryTransaction) => void;
  onApprove?: (transaction: InventoryTransaction) => void;
  onCancel?: (transaction: InventoryTransaction) => void;
  onPrint?: (transaction: InventoryTransaction) => void;
}

const InventoryCountsTable = ({
  transactions,
  isLoading,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSelectTransaction,
  onEdit,
  onDelete,
  onApprove,
  onCancel,
  onPrint,
}: InventoryCountsTableProps) => {

  if (isLoading && (!transactions || transactions.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Sayımlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ClipboardList className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-muted-foreground mb-4">Henüz stok sayımı bulunmuyor</p>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          İlk Sayımı Oluştur
        </Button>
      </div>
    );
  }

  return (
    <div className="-mx-4">
      <div className="px-4">
        <Table>
          <InventoryCountsTableHeader 
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSortFieldChange}
          />
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Sayım bulunamadı
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <InventoryCountsTableRow
                  key={transaction.id}
                  transaction={transaction}
                  onView={onSelectTransaction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onApprove={onApprove}
                  onCancel={onCancel}
                  onPrint={onPrint}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default memo(InventoryCountsTable);
