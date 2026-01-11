import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OpexMatrixItem {
  id: string;
  company_id: string | null;
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

  const fetchOpexMatrix = async (year?: number) => {
    try {
      setLoading(true);
      setError(null);

      // Temporarily bypass authentication
      let query = supabase
        .from('opex_matrix')
        .select('*')
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
      toast.error("OPEX matrix verileri alınırken hata oluştu: " + err.message);
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
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      // Get user's company_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) {
        throw new Error('Kullanıcının şirket bilgisi bulunamadı');
      }

      const { data, error } = await supabase
        .from('opex_matrix')
        .upsert({
          company_id: companyId,
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

      toast.success("OPEX verisi güncellendi.");

      return data;
    } catch (err: any) {
      console.error('upsertOpexMatrix error:', err);
      toast.error("OPEX verisi güncellenirken hata oluştu: " + err.message);
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

      toast.success("OPEX verisi silindi.");
    } catch (err: any) {
      console.error('deleteOpexMatrix error:', err);
      toast.error("OPEX verisi silinirken hata oluştu: " + err.message);
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