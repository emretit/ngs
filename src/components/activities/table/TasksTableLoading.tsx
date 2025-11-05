
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TasksTableLoading = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-100 border-b border-slate-200">
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
            <div className="flex items-center gap-1">
              <span className="text-lg mr-2">📋</span>
              <span>Başlık</span>
            </div>
          </TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
            <div className="flex items-center gap-1">
              <span className="text-lg mr-2">📅</span>
              <span>Tarih</span>
            </div>
          </TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
            <div className="flex items-center gap-1">
              <span className="text-lg mr-2">⭐</span>
              <span>Önem</span>
            </div>
          </TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
            <div className="flex items-center gap-1">
              <span className="text-lg mr-2">👤</span>
              <span>Sorumlu</span>
            </div>
          </TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
            <div className="flex items-center gap-1">
              <span className="text-lg mr-2">🔗</span>
              <span>İlişkili Öğe</span>
            </div>
          </TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-left">
            <div className="flex items-center gap-1">
              <span className="text-lg mr-2">📊</span>
              <span>Durum</span>
            </div>
          </TableHead>
          <TableHead className="py-2 px-3 font-bold text-foreground/80 text-xs tracking-wide text-right">
            <div className="flex items-center justify-end gap-1">
              <span className="text-lg mr-2">⚙️</span>
              <span>İşlemler</span>
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[1, 2, 3, 4, 5].map((index) => (
          <TableRow key={index}>
            <TableCell className="p-4"><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell className="p-4"><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell className="p-4"><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="p-4"><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell className="p-4"><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell className="p-4"><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="p-4 text-right"><Skeleton className="h-4 w-4" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default TasksTableLoading;
