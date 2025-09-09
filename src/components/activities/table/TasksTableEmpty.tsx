
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";

const TasksTableEmpty = () => {
  return (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
        Filtrelerle eşleşen görev bulunamadı
      </TableCell>
    </TableRow>
  );
};

export default TasksTableEmpty;
