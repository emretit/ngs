import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface OpexCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  subcategories: OpexSubcategory[];
  isAutoPopulated?: boolean;
  categoryType: 'personnel' | 'operational' | 'other';
}

export interface OpexSubcategory {
  id: string;
  name: string;
  category_id: string;
}

export const useOpexCategories = () => {
  const [categories, setCategories] = useState<OpexCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOpexCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch expense categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('cashflow_categories')
        .select(`
          id,
          name,
          type,
          cashflow_subcategories (
            id,
            name,
            category_id
          )
        `)
        .eq('type', 'expense')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Transform data to match OpexCategory interface
      const transformedCategories: OpexCategory[] = (categoriesData || []).map(category => {
        // Determine category type based on name
        let categoryType: 'personnel' | 'operational' | 'other' = 'other';
        if (category.name === 'Personel Giderleri') {
          categoryType = 'personnel';
        } else if (category.name === 'Operasyonel Giderler') {
          categoryType = 'operational';
        }

        return {
          id: category.id,
          name: category.name,
          type: category.type as 'income' | 'expense',
          subcategories: category.cashflow_subcategories || [],
          isAutoPopulated: category.name === 'Personel Giderleri',
          categoryType
        };
      });

      setCategories(transformedCategories);
    } catch (err: any) {
      console.error('fetchOpexCategories error:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "OPEX kategorileri alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string, subcategories: string[] = []) => {
    try {
      // Create main category
      const { data: categoryData, error: categoryError } = await supabase
        .from('cashflow_categories')
        .insert({
          name,
          type: 'expense',
          company_id: null
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Create subcategories
      if (subcategories.length > 0) {
        const subcategoryInserts = subcategories.map(sub => ({
          category_id: categoryData.id,
          name: sub,
          company_id: null
        }));

        const { error: subError } = await supabase
          .from('cashflow_subcategories')
          .insert(subcategoryInserts);

        if (subError) throw subError;
      }

      await fetchOpexCategories();
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla oluşturuldu.",
      });

      return categoryData;
    } catch (err: any) {
      console.error('createCategory error:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori oluşturulurken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  const updateCategory = async (id: string, name: string, subcategories: string[] = []) => {
    try {
      // Update main category
      const { error: categoryError } = await supabase
        .from('cashflow_categories')
        .update({ name })
        .eq('id', id);

      if (categoryError) throw categoryError;

      // Delete existing subcategories
      const { error: deleteError } = await supabase
        .from('cashflow_subcategories')
        .delete()
        .eq('category_id', id);

      if (deleteError) throw deleteError;

      // Create new subcategories
      if (subcategories.length > 0) {
        const subcategoryInserts = subcategories.map(sub => ({
          category_id: id,
          name: sub,
          company_id: null
        }));

        const { error: subError } = await supabase
          .from('cashflow_subcategories')
          .insert(subcategoryInserts);

        if (subError) throw subError;
      }

      await fetchOpexCategories();
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla güncellendi.",
      });
    } catch (err: any) {
      console.error('updateCategory error:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori güncellenirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Delete subcategories first
      const { error: subError } = await supabase
        .from('cashflow_subcategories')
        .delete()
        .eq('category_id', id);

      if (subError) throw subError;

      // Delete main category
      const { error: categoryError } = await supabase
        .from('cashflow_categories')
        .delete()
        .eq('id', id);

      if (categoryError) throw categoryError;

      await fetchOpexCategories();
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla silindi.",
      });
    } catch (err: any) {
      console.error('deleteCategory error:', err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori silinirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchOpexCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchOpexCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};
