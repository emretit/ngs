import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import ServicesTableHeader from "./ServicesTableHeader";

interface ServicesTableSkeletonProps {
  hasSelection?: boolean;
}

const ServicesTableSkeleton = ({ hasSelection = false }: ServicesTableSkeletonProps) => {
  return (
    <Table>
      <ServicesTableHeader
        onToggleServiceSelection={hasSelection}
        onSelectAll={() => {}}
        allSelected={false}
      />
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index} className="h-8">
            {hasSelection && (
              <TableCell className="py-2 px-3">
                <Skeleton className="h-4 w-4 rounded" />
              </TableCell>
            )}
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="py-2 px-3 text-center">
              <Skeleton className="h-6 w-16 rounded-full mx-auto" />
            </TableCell>
            <TableCell className="py-2 px-3 text-center">
              <Skeleton className="h-6 w-16 rounded-full mx-auto" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="py-2 px-3 text-center">
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="py-2 px-3 text-center">
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="py-2 px-2">
              <div className="flex justify-center space-x-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ServicesTableSkeleton;

