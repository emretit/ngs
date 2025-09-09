
import React from "react";
import { Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";

interface CustomerInfoProps {
  customerId?: string;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ customerId }) => {
  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: async (): Promise<Customer | null> => {
      if (!customerId) return null;
      
      console.log("Fetching customer data for ID:", customerId);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();
      
      if (error) {
        console.error("Error fetching customer:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!customerId,
  });

  if (!customerId) return null;
  
  return (
    <div className="bg-muted/20 p-3 rounded-lg">
      <div className="flex items-center mb-2">
        <Building2 className="h-3 w-3 mr-1 text-muted-foreground" />
        <h3 className="text-xs font-medium text-muted-foreground">Müşteri</h3>
      </div>
      
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Yükleniyor...</p>
      ) : customer ? (
        <div className="space-y-1">
          <p className="text-sm font-medium">{customer.name} {customer.company ? `(${customer.company})` : ''}</p>
          <p className="text-xs text-muted-foreground">{customer.email}</p>
          {customer.mobile_phone && (
            <p className="text-xs text-muted-foreground">Tel: {customer.mobile_phone}</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Müşteri ID: {customerId}</p>
      )}
    </div>
  );
};
