import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useEarchiveInvoices = (enabled = true) => {
  const query = useQuery({
    queryKey: ["earchive-invoices"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("invoices")
          .select("*")
          .eq("document_type", "e_arsiv")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching e-archive invoices:", error);
        return [];
      }
    },
    enabled, // Hook'u koşullu olarak etkinleştir
    staleTime: 5 * 60 * 1000, // 5 dakika boyunca fresh kabul et
    gcTime: 10 * 60 * 1000, // 10 dakika cache'de tut
    refetchOnWindowFocus: false, // Pencere odaklandığında refetch etme
  });

  return { 
    earchiveInvoices: query.data || [], 
    isLoading: query.isLoading, 
    error: query.error,
    refetch: query.refetch 
  };
};