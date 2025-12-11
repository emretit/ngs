import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Factory } from "lucide-react";

const WorkOrdersTableEmpty = () => {
  return (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
        <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Henüz iş emri kaydı bulunmuyor</p>
        <p className="text-sm mt-2 text-gray-400">Yeni iş emri oluşturmak için üstteki butonu kullanın</p>
      </TableCell>
    </TableRow>
  );
};

export default WorkOrdersTableEmpty;
