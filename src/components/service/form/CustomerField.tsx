
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { UseFormReturn } from "react-hook-form";
import { ServiceRequestFormData } from "@/hooks/service/types";
import { User } from "lucide-react";

type CustomerFieldProps = {
  form: UseFormReturn<ServiceRequestFormData>;
};

export const CustomerField: React.FC<CustomerFieldProps> = ({ form }) => {
  const { customers, isLoading: isLoadingCustomers } = useCustomerSelect();

  return (
    <FormField
      control={form.control}
      name="customer_id"
      render={({ field }) => (
        <FormItem className="space-y-1">
          <FormLabel className="flex items-center gap-1 text-xs font-medium text-gray-700">
            <User className="h-3 w-3 text-green-600" />
            Müşteri
          </FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value}
          >
            <FormControl>
        <SelectTrigger className="h-7 text-sm transition-all duration-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent placeholder-gray-400">
          <SelectValue placeholder="Müşteri seçin" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {isLoadingCustomers ? (
                <SelectItem value="loading" disabled>Yükleniyor...</SelectItem>
              ) : (
                customers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.company && `(${customer.company})`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
