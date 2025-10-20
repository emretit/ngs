import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

const OpportunitiesTableLoading = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">📋 Fırsat Başlığı</TableHead>
          <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Müşteri Bilgileri</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">📊 Durum</TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Değer</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">⚡ Öncelik</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-left">👤 Sorumlu</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Hedef Tarih</TableHead>
          <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Oluşturulma</TableHead>
          <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index} className="h-16">
            <TableCell className="p-4"><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell className="p-4"><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell className="p-4 text-center"><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell className="p-4 text-center"><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="p-4 text-center"><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="p-4"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
            <TableCell className="p-4 text-center"><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell className="p-4 text-center"><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell className="p-4 text-right"><Skeleton className="h-8 w-8" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default OpportunitiesTableLoading;
