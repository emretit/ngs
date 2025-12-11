import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Settings } from "lucide-react";

interface BOMTableEmptyProps {
  showCheckbox?: boolean;
}

const BOMTableEmpty: React.FC<BOMTableEmptyProps> = ({ showCheckbox = false }) => {
  return (
    <TableRow>
      <TableCell 
        colSpan={showCheckbox ? 6 : 5} 
        className="text-center py-12 text-gray-500"
      >
        <div className="flex flex-col items-center gap-3">
          <Settings className="h-12 w-12 opacity-50" />
          <div>
            <p className="font-medium">Henüz ürün reçetesi kaydı bulunmuyor</p>
            <p className="text-sm mt-2 text-muted-foreground">
              Yeni ürün reçetesi oluşturmak için üstteki butonu kullanın
            </p>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BOMTableEmpty;
