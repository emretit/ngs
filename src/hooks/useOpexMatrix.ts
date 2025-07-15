import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface OpexMatrixItem {
  id: string;
  user_id: string;
  year: number;
  month: number;
  category: string;
  subcategory: string | null;
  amount: number;
  description: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpexMatrixData {
  category: string;
  subcategory?: string;
  [key: string]: any; // for month values
}

export const useOpexMatrix = () => {
  const [data, setData] = useState<OpexMatrixItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOpexMatrix = async (year?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('opex_matrix')
        .select('*')
        .eq('user_id', user.id)
        .order('category')
        .order('month');

      if (year) {
        query = query.eq('year', year);
      }

      const { data: result, error } = await query;
      if (error) throw error;

      setData(result || []);
    } catch (err: any) {
      console.error('fetchOpexMatrix error:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "OPEX matrix verileri alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const upsertOpexMatrix = async (
    year: number,
    month: number,
    category: string,
    subcategory: string | null,
    amount: number,
    description?: string
  ) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('opex_matrix')
        .upsert({
          user_id: user.id,
          year,
          month,
          category,
          subcategory,
          amount,
          description,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setData(prev => {
        const exists = prev.find(item => 
          item.year === year && 
          item.month === month && 
          item.category === category &&
          item.subcategory === subcategory
        );

        if (exists) {
          return prev.map(item => 
            item.id === exists.id ? data : item
          );
        } else {
          return [...prev, data];
        }
      });

      toast({
        title: "Başarılı",
        description: "OPEX verisi güncellendi.",
      });

      return data;
    } catch (err: any) {
      console.error('upsertOpexMatrix error:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "OPEX verisi güncellenirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  const deleteOpexMatrix = async (id: string) => {
    try {
      const { error } = await supabase
        .from('opex_matrix')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setData(prev => prev.filter(item => item.id !== id));

      toast({
        title: "Başarılı",
        description: "OPEX verisi silindi.",
      });
    } catch (err: any) {
      console.error('deleteOpexMatrix error:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "OPEX verisi silinirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  const refetch = (year?: number) => {
    return fetchOpexMatrix(year);
  };

  useEffect(() => {
    fetchOpexMatrix(new Date().getFullYear());
  }, []);

  return {
    data,
    loading,
    error,
    upsertOpexMatrix,
    deleteOpexMatrix,
    refetch,
  };
};