
import React from "react";
import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ServiceRequestTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Başlık</TableHead>
        <TableHead>Tür</TableHead>
        <TableHead>Öncelik</TableHead>
        <TableHead>Durum</TableHead>
        <TableHead>Oluşturma Tarihi</TableHead>
        <TableHead className="text-right">İşlemler</TableHead>
      </TableRow>
    </TableHeader>
  );
}
