import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";
import { useDebounce } from "@/hooks/useDebounce";

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchableText?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seçiniz...",
  searchPlaceholder = "Ara...",
  emptyMessage = "Sonuç bulunamadı",
  className,
  disabled
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const debouncedSearch = useDebounce(searchTerm, 200);

  const selectedOption = options.find(option => option.value === value);

  // Turkish character normalization
  const normalizeTurkish = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/ş/g, 's').replace(/Ş/g, 's')
      .replace(/ç/g, 'c').replace(/Ç/g, 'c')
      .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
      .replace(/ü/g, 'u').replace(/Ü/g, 'u')
      .replace(/ö/g, 'o').replace(/Ö/g, 'o')
      .replace(/ı/g, 'i').replace(/I/g, 'i').replace(/İ/g, 'i');
  };

  const filteredOptions = React.useMemo(() => {
    if (!debouncedSearch) return options;
    
    const normalizedSearch = normalizeTurkish(debouncedSearch);
    
    return options.filter(option => {
      const searchText = option.searchableText || option.label;
      const normalizedText = normalizeTurkish(searchText);
      return normalizedText.includes(normalizedSearch);
    });
  }, [options, debouncedSearch]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className={cn(
          "w-full justify-between font-normal",
          !value && "text-muted-foreground",
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full z-50 w-full mt-1 bg-card border border-border/20 rounded-xl shadow-2xl shadow-primary/10 overflow-hidden">
          <div className="p-3 border-b border-border/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
          
          <ScrollArea className="max-h-60">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div className="p-2">
                {filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-10 pr-3 text-sm font-medium outline-none transition-all duration-150 hover:bg-primary/10 hover:text-primary focus:bg-primary/15 focus:text-primary",
                      value === option.value && "bg-primary/20 text-primary"
                    )}
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                      {value === option.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}