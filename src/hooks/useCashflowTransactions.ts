import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface CashflowTransaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  date: string;
  description: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    type: 'income' | 'expense';
  };
}

export interface CreateTransactionData {
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  date: string;
  description?: string;
  attachment_url?: string;
}

export const useCashflowTransactions = () => {
  const [transactions, setTransactions] = useState<CashflowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kullanıcının şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');
      
      const { data, error } = await supabase
        .from('cashflow_transactions')
        .select(`
          *,
          category:cashflow_categories(
            id,
            name,
            type
          )
        `)
        .eq('company_id', profile.company_id)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setTransactions((data || []) as CashflowTransaction[]);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch transactions: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (data: CreateTransactionData) => {
    try {
      // Kullanıcının şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');

      const insertData = {
        ...data,
        user_id: user.id,
        company_id: profile.company_id,
      };

      const { data: newTransaction, error } = await supabase
        .from('cashflow_transactions')
        .insert([insertData])
        .select(`
          *,
          category:cashflow_categories(
            id,
            name,
            type
          )
        `)
        .single();

      if (error) throw error;
      
      setTransactions(prev => [newTransaction as CashflowTransaction, ...prev]);
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
      
      return newTransaction;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create transaction: " + err.message,
      });
      throw err;
    }
  };

  const updateTransaction = async (id: string, data: Partial<CreateTransactionData>) => {
    try {
      const { data: updatedTransaction, error } = await supabase
        .from('cashflow_transactions')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          category:cashflow_categories(
            id,
            name,
            type
          )
        `)
        .single();

      if (error) throw error;
      
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction as CashflowTransaction : t));
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      
      return updatedTransaction;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update transaction: " + err.message,
      });
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cashflow_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete transaction: " + err.message,
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
};