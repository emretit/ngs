import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

interface TransactionTableEmptyProps {
  colSpan?: number;
}

const TransactionTableEmpty: React.FC<TransactionTableEmptyProps> = ({ colSpan = 9 }) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">İşlem bulunamadı</h3>
          <p className="text-muted-foreground">
            Bu kriterlere uygun işlem bulunamadı.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default TransactionTableEmpty;

