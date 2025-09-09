import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface InvoiceAnalysisData {
  id: string;
  user_id: string;
  year: number;
  month: number;
  purchase_vat: number;
  sales_vat: number;
  vat_difference: number;
  purchase_invoice: number;
  returns_received: number;
  sales_invoice: number;
  returns_given: number;
  profit_loss: number;
  created_at: string;
  updated_at: string;
}

interface InvoiceAnalysisInput {
  year: number;
  month: number;
  purchase_vat?: number;
  sales_vat?: number;
  vat_difference?: number;
  purchase_invoice?: number;
  returns_received?: number;
  sales_invoice?: number;
  returns_given?: number;
  profit_loss?: number;
}

export const useInvoiceAnalysis = (year?: number) => {
  const [data, setData] = useState<InvoiceAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch invoice analysis data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Auth disabled - no user check needed
      const user_id = '00000000-0000-0000-0000-000000000001'; // Default user ID
      
      // Auth disabled - use default query without user filtering
      let query = supabase
        .from('invoice_analysis')
        .select('*')
        .order('year', { ascending: true })
        .order('month', { ascending: true });

      if (year) {
        query = query.eq('year', year);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setData(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Upsert invoice analysis data
  const upsertInvoiceAnalysis = async (input: InvoiceAnalysisInput) => {
    try {
      // Auth disabled - no user check needed
      const user_id = '00000000-0000-0000-0000-000000000001'; // Default user ID
      
      // Auth disabled - use default user ID
      const { error } = await supabase
        .from('invoice_analysis')
        .upsert({
          user_id: user_id,
          year: input.year,
          month: input.month,
          purchase_vat: input.purchase_vat || 0,
          sales_vat: input.sales_vat || 0,
          vat_difference: input.vat_difference || 0,
          purchase_invoice: input.purchase_invoice || 0,
          returns_received: input.returns_received || 0,
          sales_invoice: input.sales_invoice || 0,
          returns_given: input.returns_given || 0,
          profit_loss: input.profit_loss || 0,
        }, {
          onConflict: 'user_id, year, month'
        });

      if (error) throw error;
      
      // Refresh data after successful upsert
      await fetchData();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      return false;
    }
  };

  // Get data for a specific month
  const getDataForMonth = (year: number, month: number): InvoiceAnalysisData | null => {
    return data.find(item => item.year === year && item.month === month) || null;
  };

  // Calculate totals for a specific field across all months
  const getFieldTotal = (field: keyof InvoiceAnalysisData, targetYear?: number): number => {
    const filteredData = targetYear ? data.filter(item => item.year === targetYear) : data;
    return filteredData.reduce((sum, item) => {
      const value = item[field];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  };

  // Delete invoice analysis data
  const deleteInvoiceAnalysis = async (year: number, month: number) => {
    try {
      // Auth disabled - no user check needed
      const user_id = '00000000-0000-0000-0000-000000000001'; // Default user ID
      
      // Auth disabled - use default user ID
      const { error } = await supabase
        .from('invoice_analysis')
        .delete()
        .eq('user_id', user_id)
        .eq('year', year)
        .eq('month', month);

      if (error) throw error;
      
      // Refresh data after successful delete
      await fetchData();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, [year]);

  return {
    data,
    loading,
    error,
    upsertInvoiceAnalysis,
    getDataForMonth,
    getFieldTotal,
    deleteInvoiceAnalysis,
    refetch: fetchData,
  };
};