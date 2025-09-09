
import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerSelect } from "@/hooks/useCustomerSelect";
import { UseFormReturn } from "react-hook-form";
import { ServiceRequestFormData } from "@/hooks/service/types";

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
        <FormItem>
          <FormLabel>Müşteri</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
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
