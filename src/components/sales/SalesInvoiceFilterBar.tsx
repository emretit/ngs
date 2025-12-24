import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface SalesInvoiceFilterBarProps {
  filterKeyword: string;
  setFilterKeyword: (value: string) => void;
  documentTypeFilter: string;
  setDocumentTypeFilter: (value: string) => void;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const SalesInvoiceFilterBar = ({
  filterKeyword,
  setFilterKeyword,
  documentTypeFilter,
  setDocumentTypeFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: SalesInvoiceFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Fatura no, müşteri adı veya açıklama ile ara..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select 
        value={documentTypeFilter} 
        onValueChange={setDocumentTypeFilter}
      >
        <SelectTrigger className="w-[180px]">
          <FileText className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Belge Tipi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tipler</SelectItem>
          <SelectItem value="e_fatura">📄 e-Fatura</SelectItem>
          <SelectItem value="e_arsiv">📋 e-Arşiv</SelectItem>
          <SelectItem value="fatura">📑 Fatura</SelectItem>
          <SelectItem value="irsaliye">📦 İrsaliye</SelectItem>
          <SelectItem value="makbuz">🧾 Makbuz</SelectItem>
          <SelectItem value="serbest_meslek_makbuzu">💼 SMM</SelectItem>
        </SelectContent>
      </Select>

      {/* Tarih Filtreleri */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <DatePicker
          date={startDate}
          onSelect={setStartDate}
          placeholder="Başlangıç"
        />
        <span className="text-muted-foreground text-sm">-</span>
        <DatePicker
          date={endDate}
          onSelect={setEndDate}
          placeholder="Bitiş"
        />
      </div>
    </div>
  );
};

export default SalesInvoiceFilterBar;
