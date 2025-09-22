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
    <Card className="p-6 shadow-sm">
      <div className="space-y-4">
        {/* Başlık */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Filtre ve Arama</h3>
        </div>

        {/* Ana filtre alanı */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Arama */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Fatura no, firma adı veya vergi no ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Tarih Filtresi */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-10">
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

          {/* Fatura Türü */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10">
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

        {/* Tarih Aralığı Seçimi */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Özel Tarih Aralığı:</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Başlangıç:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[140px] h-9"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Bitiş:</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[140px] h-9"
              />
            </div>
            
            {onFilter && (
              <Button
                onClick={onFilter}
                disabled={isFiltering}
                size="sm"
                className="ml-2"
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
        </div>
      </div>
    </Card>
  );
};

export default EInvoiceFilterBar;
