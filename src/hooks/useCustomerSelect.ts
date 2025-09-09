
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { Supplier } from "@/types/supplier";

// Turkish character normalization function - both ways
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

// Create searchable text for each customer
const createSearchableText = (customer: any): string => {
  const fields = [
    customer.name,
    customer.company,
    customer.email,
    customer.mobile_phone,
    customer.office_phone,
    customer.address,
    customer.representative
  ].filter(Boolean).join(' ');
  
  return normalizeTurkish(fields);
};

export const useCustomerSelect = () => {
  const { data: customers, ...customerQuery } = useQuery({
    queryKey: ["customers-select"],
    queryFn: async () => {
      console.log("Fetching customers for select component");
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, company, email, mobile_phone, office_phone, address, representative")
        .order("name");

      if (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }
      
      console.log("Customers data:", data);
      // Add searchable text to each customer
      const customersWithSearch = data?.map(customer => ({
        ...customer,
        searchableText: createSearchableText(customer)
      }));
      
      return customersWithSearch as (Customer & { searchableText: string })[];
    },
  });

  const { data: suppliers, ...supplierQuery } = useQuery({
    queryKey: ["suppliers-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, company, email, mobile_phone, office_phone, address, representative")
        .order("name");

      if (error) throw error;
      return data as Supplier[];
    },
  });

  return {
    customers,
    suppliers,
    isLoading: customerQuery.isLoading || supplierQuery.isLoading,
    error: customerQuery.error || supplierQuery.error,
  };
};
