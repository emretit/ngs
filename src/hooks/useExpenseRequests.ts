import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/hooks/useCompany";
import { ExpenseRequest } from "@/types/expense";

export const useExpenseRequests = () => {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expense-requests", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_requests")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ExpenseRequest[];
    },
    enabled: !!companyId,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: Partial<ExpenseRequest>) => {
      const { data, error } = await supabase
        .from("expense_requests")
        .insert({ ...expense, company_id: companyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requests"] });
      toast({ title: "Başarılı", description: "Harcama talebi oluşturuldu" });
    },
  });

  const submitExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      const { data, error } = await supabase
        .from("expense_requests")
        .update({ status: "submitted" })
        .eq("id", expenseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requests"] });
      toast({ title: "Başarılı", description: "Harcama talebi onaya gönderildi" });
    },
  });

  return {
    expenses,
    isLoading,
    createExpense: createExpense.mutate,
    submitExpense: submitExpense.mutate,
  };
};

