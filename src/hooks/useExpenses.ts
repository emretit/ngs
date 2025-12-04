import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";
import { format } from "date-fns";
import { ExpenseItem } from "@/components/cashflow/ExpensesManager";
import { useEffect } from "react";

interface UseExpensesOptions {
  startDate: Date;
  endDate: Date;
}

export const useExpenses = ({ startDate, endDate }: UseExpensesOptions) => {
  const { userData, loading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["expenses", userData?.company_id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const { data, error } = await supabase
        .from('expenses')
        .select(`*, category:cashflow_categories(id, name), employee:employees(first_name, last_name, department)`)
        .eq('type', 'expense')
        .eq('company_id', userData.company_id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      return (data as unknown as ExpenseItem[]) || [];
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 10 * 60 * 1000, // 10 dakika
    refetchOnMount: false, // Cache'den okusun
  });

  // Realtime subscription - expenses tablosundaki değişiklikleri dinle
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'expenses',
          filter: `company_id=eq.${userData.company_id}`,
        },
        () => {
          // Expenses tablosunda herhangi bir değişiklik olduğunda query'yi invalidate et
          queryClient.invalidateQueries({ queryKey: ["expenses"] });
        }
      )
      .subscribe();

    // Cleanup subscription when component unmounts or company_id changes
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

  return {
    data: data || [],
    isLoading: isLoading || userLoading,
    error
  };
};

