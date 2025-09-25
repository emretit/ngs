
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Building2, BarChart3, User, DollarSign, Calendar, Clock, Settings } from "lucide-react";

interface ProposalTableHeaderProps {
  columns: any[];
}

export const ProposalTableHeader = ({ 
  columns
}: ProposalTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Teklif No</span>
          </div>
        </TableHead>
        <TableHead className="w-[20%] font-bold text-foreground/80 text-sm tracking-wide text-left">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Müşteri Bilgileri</span>
          </div>
        </TableHead>
        <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
          <div className="flex items-center justify-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Durum</span>
          </div>
        </TableHead>
        <TableHead className="w-[15%] font-bold text-foreground/80 text-sm tracking-wide text-left">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Satış Temsilcisi</span>
          </div>
        </TableHead>
        <TableHead className="w-[12%] font-bold text-foreground/80 text-sm tracking-wide text-center">
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Toplam Tutar</span>
          </div>
        </TableHead>
        <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Oluşturma Tarihi</span>
          </div>
        </TableHead>
        <TableHead className="w-[10%] font-bold text-foreground/80 text-sm tracking-wide text-center">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Geçerlilik</span>
          </div>
        </TableHead>
        <TableHead className="w-[8%] font-bold text-foreground/80 text-sm tracking-wide text-right">
          <div className="flex items-center justify-end gap-2">
            <Settings className="h-4 w-4" />
            <span>İşlemler</span>
          </div>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};
