
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number?: string;
  branch_name?: string;
  iban?: string;
  swift_code?: string;
  account_type: "vadesiz" | "vadeli" | "kredi" | "pos";
  currency: "TRY" | "USD" | "EUR" | "GBP";
  current_balance: number;
  credit_limit: number;
  interest_rate?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  last_transaction_date?: string;
};

export const useBankAccounts = () => {
  const queryClient = useQueryClient();

  // Real-time subscription - bank_accounts tablosundaki değişiklikleri dinle
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Subscribe to bank_accounts table changes
      const channel = supabase
        .channel('bank_accounts_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'bank_accounts',
            filter: `company_id=eq.${profile.company_id}`
          },
          (payload) => {
            console.log('🔄 Bank account changed:', payload.eventType, payload.new || payload.old);
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["bankAccounts"],
    queryFn: async () => {
      // Şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq('company_id', profile.company_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BankAccount[];
    },
    refetchOnMount: true, // Mount olduğunda yeniden yükleme
  });
};

export const useAddBankAccount = () => {
  const addData = async (account: Omit<BankAccount, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("bank_accounts")
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { addData };
};

export const useUpdateBankAccount = () => {
  const updateData = async (id: string, account: Partial<BankAccount>) => {
    const { data, error } = await supabase
      .from("bank_accounts")
      .update(account)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { updateData };
};

export const useDeleteBankAccount = () => {
  const deleteData = async (id: string) => {
    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", id);

    if (error) throw error;
  };

  return { deleteData };
};
