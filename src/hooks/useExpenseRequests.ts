import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "@/hooks/useCompany";
import { ExpenseRequest } from "@/types/expense";
import {
  fetchExpenseRequests,
  createExpenseRequest,
  submitExpenseRequest,
} from "@/api/expense";

/**
 * Hook for managing expense requests
 *
 * Migrated to use expense API layer instead of direct Supabase queries
 *
 * @see Phase 2.4 of PAFTA Refactoring Plan
 */
export const useExpenseRequests = () => {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ["expense-requests", companyId],
    queryFn: async () => {
      if (!companyId) {
        throw new Error("Company ID is required");
      }
      return fetchExpenseRequests(companyId);
    },
    enabled: !!companyId,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: Partial<ExpenseRequest>) => {
      if (!companyId) {
        throw new Error("Company ID is required");
      }
      return createExpenseRequest(expense, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requests"] });
    },
  });

  const submitExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      return submitExpenseRequest(expenseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-requests"] });
    },
  });

  return {
    expenses,
    isLoading,
    createExpense: createExpense.mutate,
    submitExpense: submitExpense.mutate,
  };
};

