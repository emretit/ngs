import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const WorkOrdersTableSkeleton = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-100">
          <TableHead className="py-2 px-3"><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead className="py-2 px-3"><Skeleton className="h-4 w-32" /></TableHead>
          <TableHead className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead className="py-2 px-3"><Skeleton className="h-4 w-24" /></TableHead>
          <TableHead className="py-2 px-3"><Skeleton className="h-4 w-20" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map((index) => (
          <TableRow key={index} className="h-8">
            <TableCell className="py-2 px-3"><Skeleton className="h-3 w-20" /></TableCell>
            <TableCell className="py-2 px-3"><Skeleton className="h-3 w-40" /></TableCell>
            <TableCell className="py-2 px-3"><Skeleton className="h-3 w-12" /></TableCell>
            <TableCell className="py-2 px-3"><Skeleton className="h-3 w-16" /></TableCell>
            <TableCell className="py-2 px-3"><Skeleton className="h-3 w-20" /></TableCell>
            <TableCell className="py-2 px-3"><Skeleton className="h-3 w-24" /></TableCell>
            <TableCell className="py-2 px-3"><Skeleton className="h-4 w-16" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default WorkOrdersTableSkeleton;
