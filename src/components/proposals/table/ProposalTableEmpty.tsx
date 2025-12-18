import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

const ProposalTableEmpty = () => {
  return (
    <TableRow>
      <TableCell colSpan={9} className="py-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Teklif bulunamadı</h3>
          <p className="text-muted-foreground">
            Bu kriterlere uygun teklif bulunamadı.
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default ProposalTableEmpty;
