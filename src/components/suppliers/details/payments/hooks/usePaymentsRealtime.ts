import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";

export const usePaymentsRealtime = (
  supplier: Supplier, 
  companyId: string | undefined, 
  isEnabled: boolean
) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supplier.id || !companyId || !isEnabled) return;

    const channel = supabase
      .channel(`supplier-payments-realtime-${supplier.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `supplier_id=eq.${supplier.id}`
        },
        () => {
          if (supplier.id) {
            queryClient.invalidateQueries({ queryKey: ['supplier-payments', supplier.id, companyId] });
            queryClient.invalidateQueries({ queryKey: ['supplier', supplier.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_invoices',
          filter: `supplier_id=eq.${supplier.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['supplier-purchase-invoices', supplier.id, companyId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_invoices',
          filter: `customer_id=eq.${supplier.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['supplier-sales-invoices', supplier.id, companyId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'suppliers',
          filter: `id=eq.${supplier.id}`
        },
        () => {
          if (supplier.id) {
            queryClient.invalidateQueries({ queryKey: ['supplier', supplier.id] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checks',
          filter: `issuer_supplier_id=eq.${supplier.id}`
        },
        () => {
          if (supplier.id) {
            queryClient.invalidateQueries({ queryKey: ['supplier-payments', supplier.id, companyId] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checks',
          filter: `payee_supplier_id=eq.${supplier.id}`
        },
        () => {
          if (supplier.id) {
            queryClient.invalidateQueries({ queryKey: ['supplier-payments', supplier.id, companyId] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checks',
          filter: `transferred_to_supplier_id=eq.${supplier.id}`
        },
        () => {
          if (supplier.id) {
            queryClient.invalidateQueries({ queryKey: ['supplier-payments', supplier.id, companyId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supplier.id, companyId, isEnabled, queryClient]);
};
