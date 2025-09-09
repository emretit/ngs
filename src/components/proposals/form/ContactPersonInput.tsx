import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ContactPersonInputProps {
  value: string;
  onChange: (value: string) => void;
  customerId?: string;
  error?: string;
}

interface Customer {
  id: string;
  name: string;
  representative?: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

const ContactPersonInput: React.FC<ContactPersonInputProps> = ({
  value,
  onChange,
  customerId,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch customer's representative info when customer is selected
  const { data: customerData } = useQuery({
    queryKey: ["customer-representative", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      
      const { data, error } = await supabase
        .from("customers")
        .select(`
          id,
          name,
          representative,
          employees:representative(
            id,
            first_name,
            last_name
          )
        `)
        .eq("id", customerId)
        .single();
        
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!customerId,
  });

  // Auto-fill contact person when customer representative is available
  useEffect(() => {
    if (customerData?.employees && !value) {
      const fullName = `${customerData.employees.first_name} ${customerData.employees.last_name}`;
      onChange(fullName);
    }
  }, [customerData, value, onChange]);

  const suggestions = customerData?.employees ? [
    `${customerData.employees.first_name} ${customerData.employees.last_name}`
  ] : [];

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1">
      <Label className="text-base font-medium">İletişim Kişisi *</Label>
      <div className="relative">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="İletişim kişisi adını girin"
              className={`flex-1 ${suggestions.length > 0 ? 'rounded-r-none' : ''} ${
                error ? "border-red-500" : ""
              }`}
            />
            {suggestions.length > 0 && (
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-l-none border-l-0 px-3"
                  type="button"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            )}
          </div>
          
          {suggestions.length > 0 && (
            <PopoverContent className="w-80 p-0" align="end">
              <Command>
                <CommandInput
                  placeholder="Ara..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                  <CommandGroup heading="Müşteri Yetkilileri">
                    {filteredSuggestions.map((suggestion, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => handleSelect(suggestion)}
                        className="flex items-center gap-2"
                      >
                        <UserCircle className="h-4 w-4 opacity-50" />
                        <span>{suggestion}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ContactPersonInput;