import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const fetchSubcategories = async (catId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use NGS İLETİŞİM company ID directly
      const ngsCompanyId = '5a9c24d2-876e-4eb6-aea5-19328bc38a3a';
      
      let query = supabase
        .from('cashflow_subcategories')
        .select('*')
        .or(`company_id.is.null,company_id.eq.${ngsCompanyId}`)
        .order('name');

      if (catId) {
        query = query.eq('category_id', catId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setSubcategories((data || []) as CashflowSubcategory[]);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Alt kategoriler alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubcategory = async (categoryId: string, name: string) => {
    try {
      // Use NGS İLETİŞİM company ID directly
      const ngsCompanyId = '5a9c24d2-876e-4eb6-aea5-19328bc38a3a';
      
      const { data: newSubcategory, error } = await supabase
        .from('cashflow_subcategories')
        .insert([{ category_id: categoryId, name, company_id: ngsCompanyId }])
        .select()
        .single();

      if (error) throw error;
      
      setSubcategories(prev => [...prev, newSubcategory as CashflowSubcategory].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Başarılı",
        description: "Alt kategori başarıyla oluşturuldu",
      });
      
      return newSubcategory;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Alt kategori oluşturulurken hata oluştu: " + err.message,
      });
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
      toast({
        title: "Başarılı",
        description: "Alt kategori başarıyla güncellendi",
      });
      
      return updatedSubcategory;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Alt kategori güncellenirken hata oluştu: " + err.message,
      });
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
      toast({
        title: "Başarılı",
        description: "Alt kategori başarıyla silindi",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Alt kategori silinirken hata oluştu: " + err.message,
      });
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
