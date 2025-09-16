
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Column } from "../types";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposalTableHeaderProps {
  columns: Column[];
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (fieldId: string) => void;
}

export const ProposalTableHeader = ({ 
  columns, 
  sortField, 
  sortDirection, 
  onSort 
}: ProposalTableHeaderProps) => {
  const getSortIcon = (field: string) => {
    if (field !== sortField) return null;
    
    return sortDirection === "asc" 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

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
