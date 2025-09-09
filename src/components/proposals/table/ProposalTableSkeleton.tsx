
import React from 'react';
import { TableBody, TableCell, TableHeader, TableRow, Table } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export const ProposalTableSkeleton = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell className="px-4 py-3 font-medium">
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell className="px-4 py-3 font-medium">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="px-4 py-3 font-medium">
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="px-4 py-3 font-medium">
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="px-4 py-3 font-medium">
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell className="px-4 py-3 font-medium">
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell className="px-4 py-3 font-medium">
            <Skeleton className="h-4 w-16" />
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array(5).fill(0).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-20 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell>
              <div className="flex justify-end space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
