import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";

interface LoansTableEmptyProps {
  colSpan?: number;
}

const LoansTableEmpty: React.FC<LoansTableEmptyProps> = ({ colSpan = 10 }) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-8 text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl">💳</div>
          <p className="text-sm font-medium">Henüz kredi bulunmuyor</p>
          <p className="text-xs text-muted-foreground">Yeni kredi eklemek için yukarıdaki butonu kullanın</p>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default LoansTableEmpty;

