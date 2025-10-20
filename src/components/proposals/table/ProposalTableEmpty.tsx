import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

const ProposalTableEmpty = () => {
  return (
    <TableRow>
      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
        Bu kriterlere uygun teklif bulunamadı
      </TableCell>
    </TableRow>
  );
};

export default ProposalTableEmpty;
