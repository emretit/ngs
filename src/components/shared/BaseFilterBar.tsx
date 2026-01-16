import React, { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { DateRangeFilter } from "./DateRangeFilter";

interface FilterSelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface FilterSelect {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: FilterSelectOption[];
  icon?: ReactNode;
  width?: string;
  className?: string;
}

interface BaseFilterBarProps {
  // Search input
  searchQuery?: string;
  setSearchQuery?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Tarih filtreleri
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
  
  // Select dropdown'lar (dinamik)
  selects?: FilterSelect[];
  
  // Custom component'ler (örneğin CustomerSelect)
  customComponents?: ReactNode[];
  
  // Action button'lar (örneğin E-Fatura Çek)
  actionButtons?: ReactNode[];
  
  // Container className
  className?: string;
}

/**
 * Ortak FilterBar component'i
 * Tüm FilterBar'ların temel yapısını sağlar
 * EInvoiceFilterBar ile aynı görünüm ve davranışa sahiptir
 */
export const BaseFilterBar: React.FC<BaseFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Ara...",
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selects = [],
  customComponents = [],
  actionButtons = [],
  className = ""
}) => {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Search Input */}
      {setSearchQuery && (
        <div className="relative min-w-[250px] flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      )}

      {/* Custom Components (örneğin CustomerSelect) */}
      {customComponents.map((component, index) => (
        <React.Fragment key={`custom-${index}`}>
          {component}
        </React.Fragment>
      ))}

      {/* Select Dropdown'lar */}
      {selects.map((select, index) => (
        <Select
          key={`select-${index}`}
          value={select.value}
          onValueChange={select.onValueChange}
        >
          <SelectTrigger className={select.className || select.width || "w-[180px]"}>
            {select.icon && <span className="mr-2">{select.icon}</span>}
            <SelectValue placeholder={select.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {select.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {/* Tarih Filtreleri */}
      {(setStartDate || setEndDate) && (
        <DateRangeFilter
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />
      )}

      {/* Action Buttons (örneğin E-Fatura Çek) */}
      {actionButtons.map((button, index) => (
        <React.Fragment key={`action-${index}`}>
          {button}
        </React.Fragment>
      ))}
    </div>
  );
};

export default BaseFilterBar;
