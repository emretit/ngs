import React, { useState, useMemo } from "react";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  ChevronsUpDown, 
  Search, 
  Building2, 
  Loader2,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  mobile_phone?: string;
  address?: string;
  searchableText: string;
}

interface CustomerSelectorProps {
  value: string;
  onChange: (customerId: string, customerName: string, companyName: string) => void;
  error?: string;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { customers, isLoading } = useCustomerSelect();

  // Turkish character normalization function
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

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    
    return customers.filter(customer => {
      if (!searchQuery.trim()) return true;
      
      const normalizedQuery = normalizeTurkish(searchQuery);
      return customer.searchableText.includes(normalizedQuery);
    });
  }, [customers, searchQuery]);

  const selectedCustomer = customers?.find(customer => customer.id === value);

  const handleSelectCustomer = (customer: Customer) => {
    const companyName = customer.company || customer.name;
    onChange(customer.id, customer.name, companyName);
    setOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="ml-2 text-sm">Müşteriler yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className={cn("text-xs font-medium text-gray-700", error ? "text-red-500" : "")}>Müşteri</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full h-8 text-xs justify-between",
              !value && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            <span className="truncate text-left flex-1">
              {selectedCustomer 
                ? (selectedCustomer.company || selectedCustomer.name)
                : "Müşteri seçin..."
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Müşteri veya firma adı ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchQuery 
                  ? `"${searchQuery}" ile eşleşen müşteri bulunamadı` 
                  : "Müşteri bulunamadı"}
              </div>
            ) : (
              <div className="p-1">
                {filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-sm"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {customer.company ? (
                            <>
                              <span className="font-medium text-sm text-foreground truncate">
                                {customer.company}
                              </span>
                              <span className="px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground">
                                {customer.name}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-sm text-foreground truncate">
                              {customer.name}
                            </span>
                          )}
                        </div>
                        {customer.email && (
                          <span className="text-xs text-muted-foreground truncate">
                            {customer.email}
                          </span>
                        )}
                        {(customer.mobile_phone || customer.address) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {customer.mobile_phone && (
                              <span>{customer.mobile_phone}</span>
                            )}
                            {customer.mobile_phone && customer.address && (
                              <span>•</span>
                            )}
                            {customer.address && (
                              <span className="truncate">{customer.address}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        value === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default CustomerSelector;