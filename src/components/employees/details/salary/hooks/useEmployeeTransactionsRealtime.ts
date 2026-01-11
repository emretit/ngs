import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const useEmployeeTransactionsRealtime = (employeeId: string) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  useEffect(() => {
    if (!employeeId || !userData?.company_id) return;

    // Expenses tablosu değişikliklerini dinle
    const expensesChannel = supabase
      .channel(`expenses-employee-${employeeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `employee_id=eq.${employeeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['employee-transactions', employeeId] });
        }
      )
      .subscribe();

    // Employees tablosu değişikliklerini dinle (maaş güncellemeleri için)
    const employeeChannel = supabase
      .channel(`employee-salary-${employeeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'employees',
          filter: `id=eq.${employeeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['employee-transactions', employeeId] });
        }
      )
      .subscribe();

    // Transaction tablolarını dinle (EMP-PAYMENT pattern'i için)
    // Not: Realtime subscription'lar reference pattern filter'ı desteklemediği için
    // tüm company transaction'larını dinleyip invalidate ediyoruz
    const transactionsChannel = supabase
      .channel(`transactions-employee-${employeeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cash_transactions',
          filter: `company_id=eq.${userData.company_id}`,
        },
        (payload: any) => {
          // Sadece bu çalışana ait ödemeleri invalidate et
          if (payload.new?.reference?.includes(`EMP-PAYMENT-${employeeId}`)) {
            queryClient.invalidateQueries({ queryKey: ['employee-transactions', employeeId] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_transactions',
        },
        (payload: any) => {
          if (payload.new?.reference?.includes(`EMP-PAYMENT-${employeeId}`)) {
            queryClient.invalidateQueries({ queryKey: ['employee-transactions', employeeId] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_transactions',
        },
        (payload: any) => {
          if (payload.new?.reference_number?.includes(`EMP-PAYMENT-${employeeId}`)) {
            queryClient.invalidateQueries({ queryKey: ['employee-transactions', employeeId] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_transactions',
        },
        (payload: any) => {
          if (payload.new?.reference?.includes(`EMP-PAYMENT-${employeeId}`)) {
            queryClient.invalidateQueries({ queryKey: ['employee-transactions', employeeId] });
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(expensesChannel);
      supabase.removeChannel(employeeChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [employeeId, userData?.company_id, queryClient]);
};
