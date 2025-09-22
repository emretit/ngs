import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, FileText, Calendar, Filter, Loader2 } from "lucide-react";

interface EInvoiceFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  onFilter?: () => void;
  isFiltering?: boolean;
}

const EInvoiceFilterBar = ({
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  typeFilter,
  setTypeFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onFilter,
  isFiltering = false
}: EInvoiceFilterBarProps) => {
  return (
    <Card className="p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        {/* Arama */}
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Fatura no, firma adı veya vergi no ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Fatura Türü */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] h-10">
            <FileText className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Fatura Türü" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Türler</SelectItem>
            <SelectItem value="TEMELFATURA">Temel Fatura</SelectItem>
            <SelectItem value="TICARIFATURA">Ticari Fatura</SelectItem>
            <SelectItem value="IHRACAT">İhracat</SelectItem>
            <SelectItem value="YOLCUBERABERFATURA">Yolcu Beraber</SelectItem>
            <SelectItem value="EARSIVFATURA">E-Arşiv</SelectItem>
            <SelectItem value="KAMU">Kamu</SelectItem>
            <SelectItem value="HKS">HKS</SelectItem>
          </SelectContent>
        </Select>

        {/* Tarih Aralığı */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-[140px] h-10"
            title="Başlangıç Tarihi"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-[140px] h-10"
            title="Bitiş Tarihi"
          />
        </div>

        {/* Filtrele Butonu */}
        {onFilter && (
          <Button
            onClick={onFilter}
            disabled={isFiltering}
            className="h-10"
          >
            {isFiltering ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Filtreleniyor...
              </>
            ) : (
              <>
                <Filter className="mr-2 h-4 w-4" />
                Filtrele
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default EInvoiceFilterBar;
