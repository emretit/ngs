import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface BOMTableSkeletonProps {
  showCheckbox?: boolean;
}

const BOMTableSkeleton: React.FC<BOMTableSkeletonProps> = ({ showCheckbox = false }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showCheckbox && <TableHead className="w-12"></TableHead>}
          <TableHead>Reçete Adı</TableHead>
          <TableHead>İlgili Ürün</TableHead>
          <TableHead>Bileşen Sayısı</TableHead>
          <TableHead>Oluşturulma Tarihi</TableHead>
          <TableHead className="text-center">İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map((index) => (
          <TableRow key={index} className="h-8">
            {showCheckbox && (
              <TableCell className="py-2 px-3">
                <Skeleton className="h-4 w-4" />
              </TableCell>
            )}
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-16" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <Skeleton className="h-4 w-16 mx-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BOMTableSkeleton;
