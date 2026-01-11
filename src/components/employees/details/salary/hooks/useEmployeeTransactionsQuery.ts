import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface RawTransaction {
  source: 'employee' | 'expense' | 'cash' | 'bank' | 'card' | 'partner';
  data: any;
}

export const useEmployeeTransactionsQuery = (employeeId: string) => {
  const { userData, loading: userLoading } = useCurrentUser();

  return useQuery({
    queryKey: ['employee-transactions', employeeId, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      const transactions: RawTransaction[] = [];

      // 1. Çalışan bilgisi - Maaş tahakkuku için
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, net_salary, effective_date, salary_notes')
        .eq('id', employeeId)
        .single();

      if (employeeError) throw employeeError;

      if (employee && employee.net_salary && employee.effective_date) {
        transactions.push({
          source: 'employee',
          data: employee,
        });
      }

      // 2. Masraflar - expenses tablosundan
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          date,
          description,
          category:cashflow_categories(id, name),
          is_paid,
          paid_date,
          payment_account_type,
          payment_account_id
        `)
        .eq('employee_id', employeeId)
        .eq('expense_type', 'employee')
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      if (expenses) {
        expenses.forEach(expense => {
          transactions.push({
            source: 'expense',
            data: expense,
          });
        });
      }

      // 3. Ödemeler - transaction tablolarından (reference pattern: EMP-PAYMENT-{employeeId}-*)
      const referencePattern = `EMP-PAYMENT-${employeeId}-%`;

      // Cash transactions
      const { data: cashTransactions } = await supabase
        .from('cash_transactions')
        .select('*')
        
        .like('reference', referencePattern)
        .order('transaction_date', { ascending: false });

      if (cashTransactions) {
        cashTransactions.forEach(transaction => {
          transactions.push({
            source: 'cash',
            data: transaction,
          });
        });
      }

      // Bank transactions
      const { data: bankTransactions } = await supabase
        .from('bank_transactions')
        .select('*')
        .like('reference', referencePattern)
        .order('transaction_date', { ascending: false });

      if (bankTransactions) {
        bankTransactions.forEach(transaction => {
          transactions.push({
            source: 'bank',
            data: transaction,
          });
        });
      }

      // Credit card transactions
      const { data: cardTransactions } = await supabase
        .from('card_transactions')
        .select('*')
        .like('reference_number', referencePattern)
        .order('transaction_date', { ascending: false });

      if (cardTransactions) {
        cardTransactions.forEach(transaction => {
          transactions.push({
            source: 'card',
            data: transaction,
          });
        });
      }

      // Partner transactions
      const { data: partnerTransactions } = await supabase
        .from('partner_transactions')
        .select('*')
        .like('reference', referencePattern)
        .order('transaction_date', { ascending: false });

      if (partnerTransactions) {
        partnerTransactions.forEach(transaction => {
          transactions.push({
            source: 'partner',
            data: transaction,
          });
        });
      }

      return transactions;
    },
    enabled: !!employeeId && !!userData?.company_id && !userLoading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};
