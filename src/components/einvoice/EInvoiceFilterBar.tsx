import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, RefreshCw } from "lucide-react";
import { CustomerSelect } from "./CustomerSelect";
import { BaseFilterBar } from "@/components/shared/BaseFilterBar";

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
  isRefreshDisabled?: boolean;
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
  setCustomerTaxNumber,
  isRefreshDisabled = false
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

  // Fatura türü select options
  const typeFilterSelect = {
    value: typeFilter,
    onValueChange: setTypeFilter,
    placeholder: "Fatura Türü",
    icon: <FileText className="h-4 w-4" />,
    options: [
      { value: "all", label: "Tüm Türler" },
      { value: "TEMELFATURA", label: "Temel Fatura" },
      { value: "TICARIFATURA", label: "Ticari Fatura" },
      { value: "IHRACAT", label: "İhracat" },
      { value: "YOLCUBERABERFATURA", label: "Yolcu Beraber" },
      { value: "EARSIVFATURA", label: "E-Arşiv" },
      { value: "KAMU", label: "Kamu" },
      { value: "HKS", label: "HKS" },
    ],
  };

  // Custom components (Müşteri Seçici)
  const customComponents = [];
  if (invoiceType === 'outgoing' && setCustomerTaxNumber) {
    customComponents.push(
      <CustomerSelect
        key="customer-select"
        value={customerTaxNumber}
        onChange={setCustomerTaxNumber}
        placeholder="Müşteri Seç (VKN)"
      />
    );
  }

  // Action buttons (E-Fatura Çek)
  const actionButtons = [];
  if (onRefresh) {
    actionButtons.push(
      <Button 
        key="refresh-button"
        className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
        onClick={onRefresh}
        disabled={isRefreshing || isRefreshDisabled}
        title={
          isRefreshDisabled 
            ? (!startDate || !endDate 
                ? 'Lütfen tarih aralığı seçin' 
                : 'Lütfen önce bir müşteri seçin (VKN)') 
            : dateRangeText 
              ? `Tarih aralığı: ${dateRangeText}` 
              : 'E-Fatura çek'
        }
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>E-Fatura Çek</span>
      </Button>
    );
  }

  return (
    <BaseFilterBar
      searchQuery={searchTerm}
      setSearchQuery={setSearchTerm}
      searchPlaceholder="Fatura no, firma adı veya vergi no ile ara..."
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      selects={[typeFilterSelect]}
      customComponents={customComponents}
      actionButtons={actionButtons}
    />
  );
};

export default EInvoiceFilterBar;
