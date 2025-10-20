import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

const OpportunitiesTableEmpty = () => {
  return (
    <TableRow>
      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
        Bu kriterlere uygun fırsat bulunamadı
      </TableCell>
    </TableRow>
  );
};

export default OpportunitiesTableEmpty;
