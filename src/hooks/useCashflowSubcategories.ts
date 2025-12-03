import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CashflowSubcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
}

export const useCashflowSubcategories = (categoryId?: string) => {
  const [subcategories, setSubcategories] = useState<CashflowSubcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubcategories = async (catId?: string) => {
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
      
      let query = supabase
        .from('cashflow_subcategories')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('name');

      if (catId) {
        query = query.eq('category_id', catId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setSubcategories((data || []) as CashflowSubcategory[]);
    } catch (err: any) {
      setError(err.message);
      toast.error("Alt kategoriler alınırken hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubcategory = async (categoryId: string, name: string) => {
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
      
      const { data: newSubcategory, error } = await supabase
        .from('cashflow_subcategories')
        .insert([{ category_id: categoryId, name, company_id: profile.company_id }])
        .select()
        .single();

      if (error) throw error;
      
      setSubcategories(prev => [...prev, newSubcategory as CashflowSubcategory].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Alt kategori başarıyla oluşturuldu");
      
      return newSubcategory;
    } catch (err: any) {
      toast.error("Alt kategori oluşturulurken hata oluştu: " + err.message);
      throw err;
    }
  };

  const updateSubcategory = async (id: string, name: string) => {
    try {
      const { data: updatedSubcategory, error } = await supabase
        .from('cashflow_subcategories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setSubcategories(prev => prev.map(s => s.id === id ? updatedSubcategory as CashflowSubcategory : s).sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Alt kategori başarıyla güncellendi");
      
      return updatedSubcategory;
    } catch (err: any) {
      toast.error("Alt kategori güncellenirken hata oluştu: " + err.message);
      throw err;
    }
  };

  const deleteSubcategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cashflow_subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSubcategories(prev => prev.filter(s => s.id !== id));
      toast.success("Alt kategori başarıyla silindi");
    } catch (err: any) {
      toast.error("Alt kategori silinirken hata oluştu: " + err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchSubcategories(categoryId);
  }, [categoryId]);

  // Realtime güncellemeler: alt kategori ekleme/güncelleme/silme olduğunda otomatik yenile
  useEffect(() => {
    const channel = supabase
      .channel(`cashflow_subcategories_${categoryId || 'all'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cashflow_subcategories',
        filter: categoryId ? `category_id=eq.${categoryId}` : undefined,
      }, () => {
        fetchSubcategories(categoryId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryId]);

  return {
    subcategories,
    loading,
    error,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    refetch: fetchSubcategories,
  };
};
