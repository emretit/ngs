import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const usePaymentsRealtime = (customer: Customer) => {
  const queryClient = useQueryClient();
  const { userData, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!customer.id || !userData?.company_id || userLoading) return;

    const channel = supabase
      .channel(`customer-payments-realtime-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'payments',
          filter: `customer_id=eq.${customer.id}`
        },
        () => {
          // Payments değiştiğinde query'leri invalidate et - company_id ile birlikte
          if (customer.id) {
            queryClient.invalidateQueries({ queryKey: ['customer-payments', customer.id, userData?.company_id] });
            queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_invoices',
          filter: `customer_id=eq.${customer.id}`
        },
        () => {
          // Sales invoices değiştiğinde query'leri invalidate et
          queryClient.invalidateQueries({ queryKey: ['customer-sales-invoices', customer.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_invoices',
          filter: `customer_id=eq.${customer.id}`
        },
        () => {
          // Purchase invoices değiştiğinde query'leri invalidate et
          queryClient.invalidateQueries({ queryKey: ['customer-purchase-invoices', customer.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_invoices',
          filter: `supplier_id=eq.${customer.id}`
        },
        () => {
          // Müşteri aynı zamanda tedarikçi ise supplier_id ile de dinle
          queryClient.invalidateQueries({ queryKey: ['customer-purchase-invoices', customer.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checks',
          filter: `issuer_customer_id=eq.${customer.id}`
        },
        () => {
          // Müşterinin issuer olduğu çekler değiştiğinde query'leri invalidate et
          if (customer.id) {
            queryClient.invalidateQueries({ queryKey: ['customer-checks', customer.id, userData?.company_id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checks',
          filter: `payee_customer_id=eq.${customer.id}`
        },
        () => {
          // Müşterinin payee olduğu çekler değiştiğinde query'leri invalidate et
          if (customer.id) {
            queryClient.invalidateQueries({ queryKey: ['customer-checks', customer.id, userData?.company_id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `id=eq.${customer.id}`
        },
        () => {
          // Customer bilgileri (özellikle balance) güncellendiğinde query'leri invalidate et
          if (customer.id) {
            queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer.id, userData?.company_id, userLoading, queryClient]);
};

