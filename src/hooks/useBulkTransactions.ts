import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { CreateTransactionData } from "./useCashflowTransactions";

export const useBulkTransactions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createBulkTransactions = async (transactions: CreateTransactionData[]) => {
    try {
      setLoading(true);
      // Auth disabled - no user check needed
      const user_id = '00000000-0000-0000-0000-000000000001'; // Default user ID

      const transactionsWithUserId = transactions.map(transaction => ({
        ...transaction,
        user_id: user_id,
      }));

      const { data, error } = await supabase
        .from('cashflow_transactions')
        .insert(transactionsWithUserId)
        .select(`
          *,
          category:cashflow_categories(
            id,
            name,
            type
          )
        `);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `${transactions.length} işlem başarıyla kaydedildi.`,
      });

      return data;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "İşlemler kaydedilirken bir hata oluştu: " + err.message,
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createBulkTransactions,
    loading,
  };
};