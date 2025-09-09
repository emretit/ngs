import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOutgoingInvoices = () => {
  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ["outgoing-invoices"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching outgoing invoices:", error);
        return [];
      }
    },
  });

  return { invoices, isLoading, error };
};