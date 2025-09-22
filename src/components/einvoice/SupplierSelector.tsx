import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  tax_number?: string;
  email?: string;
}

interface SupplierSelectorProps {
  value: string;
  onChange: (supplierId: string) => void;
  onNewSupplier?: () => void;
  suppliers: Supplier[];
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  isCreatingSupplier?: boolean;
  matchStatus?: 'searching' | 'found' | 'not_found' | null;
  invoiceSupplierName?: string;
  invoiceSupplierTaxNumber?: string;
}

const SupplierSelector = ({ 
  value, 
  onChange, 
  onNewSupplier, 
  suppliers, 
  placeholder = "Tedarikçi seçin...", 
  className,
  isLoading = false,
  isCreatingSupplier = false,
  matchStatus,
  invoiceSupplierName,
  invoiceSupplierTaxNumber
}: SupplierSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers?.filter(supplier => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(query) ||
      supplier.tax_number?.toLowerCase().includes(query) ||
      supplier.email?.toLowerCase().includes(query)
    );
  });

  const selectedSupplier = suppliers.find(s => s.id === value);

  const handleSelect = (supplier: Supplier) => {
    onChange(supplier.id);
    setOpen(false);
  };

  const getStatusIcon = () => {
    switch (matchStatus) {
      case 'searching':
        return <Loader2 className="h-3 w-3 animate-spin text-primary" />;
      case 'found':
        return <Check className="h-3 w-3 text-green-600" />;
      case 'not_found':
        return <X className="h-3 w-3 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (matchStatus) {
      case 'searching':
        return 'Kontrol ediliyor...';
      case 'found':
        return 'Eşleşti';
      case 'not_found':
        return 'Yok';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Alış Faturası Tedarikçisi *</span>
        {matchStatus && (
          <div className="flex items-center gap-1 text-xs">
            {getStatusIcon()}
            <span className={cn(
              matchStatus === 'searching' && 'text-primary',
              matchStatus === 'found' && 'text-green-600',
              matchStatus === 'not_found' && 'text-destructive'
            )}>
              {getStatusText()}
            </span>
          </div>
        )}
      </div>

      {/* E-fatura tedarikçi bilgileri - bulunamadığında göster */}
      {matchStatus === 'not_found' && invoiceSupplierName && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900">
                E-faturadan gelen tedarikçi:
              </p>
              <p className="text-sm text-orange-700 font-semibold">
                {invoiceSupplierName}
              </p>
              {invoiceSupplierTaxNumber && (
                <p className="text-xs text-orange-600">
                  VKN: {invoiceSupplierTaxNumber}
                </p>
              )}
            </div>
            {onNewSupplier && (
              <Button
                onClick={onNewSupplier}
                size="sm"
                disabled={isCreatingSupplier}
                className="ml-3 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              >
                {isCreatingSupplier ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                {isCreatingSupplier ? 'Ekleniyor...' : 'Tedarikçi Ekle'}
              </Button>
            )}
          </div>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              className
            )}
            disabled={isLoading}
          >
            <div className="flex flex-col items-start flex-1 min-w-0">
              {selectedSupplier ? (
                <>
                  <span className="truncate text-left font-medium text-sm">{selectedSupplier.name}</span>
                  {selectedSupplier.tax_number && (
                    <span className="text-xs text-muted-foreground">VKN: {selectedSupplier.tax_number}</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false} className="rounded-lg border shadow-md">
            <CommandInput 
              placeholder="Tedarikçi ara (isim, VKN, email)..." 
              className="h-9"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="py-6 text-center text-sm">
                Aramanızla eşleşen tedarikçi bulunamadı.
              </CommandEmpty>
              <CommandGroup>
                {filteredSuppliers?.map((supplier) => (
                  <CommandItem
                    key={supplier.id}
                    value={supplier.name}
                    onSelect={() => handleSelect(supplier)}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground rounded-sm transition-colors"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 mt-1",
                        value === supplier.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="font-semibold text-foreground text-sm leading-tight">
                        {supplier.name}
                      </span>
                      {supplier.tax_number && (
                        <span className="text-xs text-muted-foreground">
                          VKN: {supplier.tax_number}
                        </span>
                      )}
                      {supplier.email && (
                        <span className="text-xs text-muted-foreground">
                          {supplier.email}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              {/* Yeni Tedarikçi Oluştur Butonu */}
              {onNewSupplier && (
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onNewSupplier();
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground rounded-sm transition-colors border-t border-border mt-1"
                  >
                    <div className="flex items-center gap-2">
                      <Plus size={16} className="text-primary" />
                      <span className="text-sm font-medium text-primary">Yeni tedarikçi oluştur</span>
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SupplierSelector;