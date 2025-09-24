
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProposalTableHeaderProps {
  columns: any[];
}

export const ProposalTableHeader = ({ 
  columns
}: ProposalTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">📄 Teklif No</TableHead>
        <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">🏢 Müşteri Bilgileri</TableHead>
        <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">📊 Durum</TableHead>
        <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">👤 Satış Temsilcisi</TableHead>
        <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">💰 Toplam Tutar</TableHead>
        <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">📅 Oluşturma Tarihi</TableHead>
        <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">⏰ Geçerlilik</TableHead>
        <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-right">⚙️ İşlemler</TableHead>
      </TableRow>
    </TableHeader>
  );
};
