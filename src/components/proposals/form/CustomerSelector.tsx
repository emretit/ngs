
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ value, onChange, error }) => {
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="customer">Müşteri</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="customer" className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="Müşteri seçin" />
        </SelectTrigger>
        <SelectContent>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name} {customer.company ? `(${customer.company})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default CustomerSelector;
