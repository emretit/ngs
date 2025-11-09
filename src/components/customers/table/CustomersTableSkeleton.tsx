import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const CustomersTableSkeleton = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-gray-50 border-b">
          <TableHead className="w-[40px] font-bold text-foreground/80 text-sm tracking-wide text-center">
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          </TableHead>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Şirket</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-left">👤 Yetkili Kişi</TableHead>
          <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">📞 İletişim</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">🏷️ Tip</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">📊 Durum</TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-left">🤝 Temsilci</TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Bakiye</TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Oluşturma Tarihi</TableHead>
          <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">⚙️ İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index} className="h-16">
            <TableCell className="py-2 px-3">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </TableCell>
            <TableCell className="py-2 px-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </TableCell>
            <TableCell className="py-2 px-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </TableCell>
            <TableCell className="py-2 px-2">
              <div className="space-y-1">
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
            </TableCell>
            <TableCell className="py-2 px-2 text-center">
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
            </TableCell>
            <TableCell className="py-2 px-2 text-center">
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse mx-auto" />
            </TableCell>
            <TableCell className="py-2 px-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </TableCell>
            <TableCell className="py-2 px-2 text-center">
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
            </TableCell>
            <TableCell className="py-2 px-2 text-center">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
            </TableCell>
            <TableCell className="py-2 px-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default CustomersTableSkeleton;
