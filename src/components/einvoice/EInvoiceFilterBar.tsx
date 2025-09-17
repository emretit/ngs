import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

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
    <div className="space-y-4">
      {/* Tarih Aralığı Filtresi */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Tarih Aralığı:</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Başlangıç:</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Bitiş:</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[140px]"
            />
          </div>
          {onFilter && (
            <button
              onClick={onFilter}
              disabled={isFiltering}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-md disabled:opacity-50"
            >
              Filtrele
            </button>
          )}
        </div>
      </div>

      {/* Arama ve Durum Filtreleri */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Fatura no, firma adı veya vergi no ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tarih Filtresi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Tarihler</SelectItem>
            <SelectItem value="today">Bugün</SelectItem>
            <SelectItem value="week">Bu Hafta</SelectItem>
            <SelectItem value="month">Bu Ay</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
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
      </div>
    </div>
  );
};

export default EInvoiceFilterBar;
