import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Building2, Search, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CustomerSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  value,
  onChange,
  placeholder = "Müşteri Seç"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [displayCount, setDisplayCount] = useState(20);

  // Load all customers with VKN - DIRECTLY from database (RLS handles company filtering)
  const { data: allCustomersWithVKN, isLoading: isLoadingAll } = useQuery({
    queryKey: ["customers-with-vkn-all"],
    queryFn: async () => {
      console.log('🔍 VKN\'li tüm müşteriler sorgulanıyor (RLS aktif)');
      
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company, tax_number, email, mobile_phone, office_phone")
        .not('tax_number', 'is', null)
        .neq('tax_number', '')
        .order('name');
      
      if (error) {
        console.error('❌ Müşteri sorgu hatası:', error);
        throw error;
      }
      
      console.log(`✅ ${data?.length || 0} VKN'li müşteri bulundu (RLS)`);
      console.log('📋 İlk 3 müşteri:', data?.slice(0, 3));
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 dakika cache
  });

  // Search in database when search query is provided (RLS handles company filtering)
  const { data: searchedCustomers, isLoading: isSearchingCustomers } = useQuery({
    queryKey: ["customers-search-vkn", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return null;
      
      const normalizedQuery = searchQuery.trim().toLowerCase();
      
      console.log('🔍 VKN\'li müşterilerde arama:', normalizedQuery);
      
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company, tax_number, email, mobile_phone, office_phone")
        .not('tax_number', 'is', null)
        .neq('tax_number', '')
        .or(`name.ilike.%${normalizedQuery}%,company.ilike.%${normalizedQuery}%,tax_number.ilike.%${normalizedQuery}%`)
        .order('name')
        .limit(100);
      
      if (error) throw error;
      
      console.log(`✅ ${data?.length || 0} arama sonucu bulundu`);
      return data;
    },
    enabled: !!searchQuery.trim() && isOpen,
  });

  // Use searched results if available, otherwise use all customers
  const customers = searchQuery.trim() ? searchedCustomers : allCustomersWithVKN;
  const isLoading = searchQuery.trim() ? isSearchingCustomers : isLoadingAll;

  // Find selected customer
  const selectedCustomer = allCustomersWithVKN?.find(c => c.tax_number === value) 
    || searchedCustomers?.find(c => c.tax_number === value);

  const handleSelectCustomer = (taxNumber: string) => {
    onChange(taxNumber);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 20);
  };

  // Reset display count when search query changes or popover opens
  useEffect(() => {
    if (isOpen && !searchQuery.trim()) {
      setDisplayCount(20);
    }
  }, [isOpen, searchQuery]);

  const getDisplayName = () => {
    if (!value) {
      return "Tüm Müşteriler (Cache)";
    }
    if (selectedCustomer) {
      return selectedCustomer.company || selectedCustomer.name || "Müşteri seçin...";
    }
    return placeholder;
  };

  // When searching, use database results directly
  // When not searching, show limited initial list (based on displayCount)
  const filteredCustomers = searchQuery.trim() 
    ? customers 
    : customers?.slice(0, displayCount);

  // Check if there are more customers to load
  const hasMoreCustomers = !searchQuery.trim() && allCustomersWithVKN && (
    allCustomersWithVKN.length > displayCount
  );

  const remainingCustomers = allCustomersWithVKN 
    ? Math.max(0, allCustomersWithVKN.length - displayCount)
    : 0;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setSearchQuery("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn("w-[280px] justify-between border-orange-300 focus:border-orange-500")}
        >
          <div className="flex items-center min-w-0 flex-1">
            <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate min-w-0">{getDisplayName()}</span>
          </div>
          <Search className="ml-1.5 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[400px] max-w-[90vw] p-0 z-[9999] pointer-events-auto overflow-hidden" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-1.5 border-b">
          <Input
            placeholder="Müşteri ara (isim, şirket, VKN)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 text-xs"
            autoComplete="off"
          />
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-3 text-center text-muted-foreground text-xs">
              Yükleniyor...
            </div>
          ) : filteredCustomers && filteredCustomers.length > 0 ? (
            <>
              <div className="grid gap-0.5 p-1">
                {/* Tüm Müşteriler Seçeneği - İlk Sırada */}
                <div
                  className={cn(
                    "flex items-start py-1 px-1.5 cursor-pointer rounded-md hover:bg-muted/50 min-w-0 border-b border-muted",
                    !value && "bg-muted"
                  )}
                  onClick={() => handleSelectCustomer('')}
                >
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-1.5 mt-0.5 text-[10px] font-medium shrink-0">
                    <Building2 className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex justify-between items-center gap-2 min-w-0">
                      <p className="font-medium truncate text-xs min-w-0 flex-1">
                        Tüm Müşteriler
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Sadece cache'den göster (VKN filtresiz)
                    </p>
                  </div>
                </div>

                {/* Müşteri Listesi */}
                {filteredCustomers.map((customer) => {
                  const isSelected = customer.tax_number === value;
                  return (
                    <div
                      key={customer.id}
                      className={cn(
                        "flex items-start py-1 px-1.5 cursor-pointer rounded-md hover:bg-muted/50 min-w-0",
                        isSelected && "bg-muted"
                      )}
                      onClick={() => handleSelectCustomer(customer.tax_number)}
                    >
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-1.5 mt-0.5 text-[10px] font-medium shrink-0">
                        {(customer.company || customer.name || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex justify-between items-center gap-2 min-w-0">
                          <p className="font-medium truncate text-xs min-w-0 flex-1">
                            {customer.company || customer.name || 'İsimsiz Müşteri'}
                          </p>
                        </div>
                        {customer.company && customer.name && customer.company !== customer.name && (
                          <p className="text-[11px] text-muted-foreground truncate">{customer.name}</p>
                        )}
                        <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                          <span className="font-medium">VKN: {customer.tax_number}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center text-[10px] text-muted-foreground mt-0.5 min-w-0">
                            <Mail className="h-2 w-2 mr-0.5 shrink-0" />
                            <span className="truncate min-w-0">{customer.email}</span>
                          </div>
                        )}
                        {customer.mobile_phone && (
                          <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                            <Phone className="h-2 w-2 mr-0.5 shrink-0" />
                            <span className="truncate">{customer.mobile_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {hasMoreCustomers && !searchQuery.trim() && (
                <div className="p-1.5 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    className="w-full h-8 text-xs"
                  >
                    Daha Fazla Yükle ({remainingCustomers} kaldı)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 text-center text-muted-foreground text-xs">
              {searchQuery.trim() 
                ? `"${searchQuery}" ile eşleşen müşteri bulunamadı`
                : "VKN'li müşteri bulunamadı"}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
