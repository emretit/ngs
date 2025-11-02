import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ProductsTableSkeleton = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50 border-b">
          <TableHead className="w-[40px] py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          </TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">📦 Ürün Adı</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">🏷️ SKU</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">📂 Kategori</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">💰 Fiyat</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">📊 Stok</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-center">🟢 Durum</TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">⚙️ İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index} className="h-8">
            <TableCell className="py-2 px-3">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </TableCell>
            <TableCell className="py-2 px-3 text-right">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
            </TableCell>
            <TableCell className="py-2 px-3 text-right">
              <div className="h-4 w-12 bg-gray-200 rounded animate-pulse ml-auto" />
            </TableCell>
            <TableCell className="py-2 px-3 text-center">
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
            </TableCell>
            <TableCell className="py-2 px-3 text-right">
              <div className="flex items-center justify-end gap-0.5">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProductsTableSkeleton;

