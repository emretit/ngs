import React, { useState } from "react";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProposalCustomerSelectProps {
  selectedCustomerId?: string;
  onSelectCustomer: (customerId: string) => void;
  error?: string;
}

const ProposalFormCustomerSelect: React.FC<ProposalCustomerSelectProps> = ({
  selectedCustomerId,
  onSelectCustomer,
  error
}) => {
  const { customers, isLoading } = useCustomerSelect();
  const [open, setOpen] = useState(false);

  const selectedCustomer = customers?.find(customer => customer.id === selectedCustomerId);

  return (
    <div className="space-y-4">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">Müşteri Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2">
          <Label htmlFor="customer" className={error ? "text-red-500" : ""}>
            Müşteri <span className="text-red-500">*</span>
          </Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "w-full justify-between",
                  error ? "border-red-500" : "",
                  !selectedCustomerId && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                {selectedCustomer
                  ? selectedCustomer.company 
                    ? `${selectedCustomer.name} (${selectedCustomer.company})`
                    : selectedCustomer.name
                  : "Müşteri ara..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Müşteri ara..." />
                <CommandList>
                  <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                  <CommandGroup>
                    {customers?.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={`${customer.name} ${customer.company || ''}`}
                        onSelect={() => {
                          onSelectCustomer(customer.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.name}</span>
                          {customer.company && (
                            <span className="text-sm text-muted-foreground">{customer.company}</span>
                          )}
                          {customer.email && (
                            <span className="text-xs text-muted-foreground">{customer.email}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </CardContent>
    </div>
  );
};

export default ProposalFormCustomerSelect;