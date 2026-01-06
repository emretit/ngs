import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, FileText, Calendar, RefreshCw } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface EInvoiceFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  // Giden faturalar için müşteri VKN filtresi
  invoiceType?: 'incoming' | 'outgoing';
  customerTaxNumber?: string;
  setCustomerTaxNumber?: (value: string) => void;
}

const EInvoiceFilterBar = ({
  searchTerm,
  setSearchTerm,
  typeFilter,
  setTypeFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onRefresh,
  isRefreshing = false,
  invoiceType,
  customerTaxNumber,
  setCustomerTaxNumber
}: EInvoiceFilterBarProps) => {
  // Tarih aralığını formatla
  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const dateRangeText = startDate && endDate 
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : startDate 
    ? `${formatDate(startDate)} - ...`
    : '';

  return (
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

      {/* Müşteri VKN Filtresi - Sadece Giden Faturalar için (ZORUNLU) */}
      {invoiceType === 'outgoing' && setCustomerTaxNumber && (
        <div className="relative min-w-[200px]">
          <Input
            placeholder="Müşteri VKN *"
            value={customerTaxNumber || ''}
            onChange={(e) => setCustomerTaxNumber(e.target.value)}
            className="w-full border-orange-300 focus:border-orange-500"
            maxLength={11}
            required
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-orange-600">
            Zorunlu
          </span>
        </div>
      )}
      
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

      {/* E-Fatura Çek Butonu */}
      {onRefresh && (
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={onRefresh}
          disabled={isRefreshing}
          title={dateRangeText ? `Tarih aralığı: ${dateRangeText}` : 'E-Fatura çek'}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>E-Fatura Çek</span>
        </Button>
      )}
    </div>
  );
};

export default EInvoiceFilterBar;
