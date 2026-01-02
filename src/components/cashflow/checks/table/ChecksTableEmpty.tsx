import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";

interface ChecksTableEmptyProps {
  colSpan?: number;
}

const ChecksTableEmpty: React.FC<ChecksTableEmptyProps> = ({ colSpan = 9 }) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-8 text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl">📄</div>
          <p className="text-sm font-medium">Henüz çek bulunmuyor</p>
          <p className="text-xs text-muted-foreground">Yeni çek eklemek için yukarıdaki butonları kullanın</p>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ChecksTableEmpty;

