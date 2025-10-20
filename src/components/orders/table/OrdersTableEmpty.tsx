import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

const OrdersTableEmpty = () => {
  return (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
        Bu kriterlere uygun sipariş bulunamadı
      </TableCell>
    </TableRow>
  );
};

export default OrdersTableEmpty;

