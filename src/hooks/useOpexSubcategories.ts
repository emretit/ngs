import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface OpexSubcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const useOpexSubcategories = (categoryId?: string) => {
  const [subcategories, setSubcategories] = useState<OpexSubcategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubcategories = async (catId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('opex_subcategories')
        .select('*')
        .order('name');

      if (catId) {
        query = query.eq('category_id', catId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setSubcategories((data || []) as OpexSubcategory[]);
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
      const { data: newSubcategory, error } = await supabase
        .from('opex_subcategories')
        .insert([{ category_id: categoryId, name }])
        .select()
        .single();

      if (error) throw error;
      
      setSubcategories(prev => [...prev, newSubcategory as OpexSubcategory].sort((a, b) => a.name.localeCompare(b.name)));
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
        .from('opex_subcategories')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setSubcategories(prev => prev.map(s => s.id === id ? updatedSubcategory as OpexSubcategory : s).sort((a, b) => a.name.localeCompare(b.name)));
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
        .from('opex_subcategories')
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
