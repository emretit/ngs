import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const fetchOpexCategories = async () => {
    try {
      setLoading(true);
      setError(null);

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
        throw new Error('Şirket bilgisi bulunamadı');
      }

      // Fetch company-specific categories (default kategoriler de company_id ile oluşturuluyor)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('cashflow_categories')
        .select(`
          id,
          name,
          type,
          company_id,
          cashflow_subcategories (
            id,
            name,
            category_id,
            company_id
          )
        `)
        .eq('company_id', companyId)
        .eq('type', 'expense')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Transform data to match OpexCategory interface
      const transformedCategories: OpexCategory[] = (categoriesData || []).map(category => {
        // Determine category type based on name
        let categoryType: 'personnel' | 'operational' | 'other' = 'other';
        if (category.name === 'Maaş ve Ücretler') {
          categoryType = 'personnel';
        } else if (category.name === 'Operasyonel Giderler' || category.name === 'Ham Madde' || category.name === 'Yakıt ve Bakım') {
          categoryType = 'operational';
        }

        return {
          id: category.id,
          name: category.name,
          type: category.type as 'income' | 'expense',
          subcategories: category.cashflow_subcategories || [],
          isAutoPopulated: category.name === 'Maaş ve Ücretler',
          categoryType
        };
      });

      setCategories(transformedCategories);
    } catch (err: any) {
      logger.error('fetchOpexCategories error:', err);
      setError(err.message);
      toast.error("OPEX kategorileri alınırken hata oluştu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string, subcategories: string[] = []) => {
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

      if (!profile?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      // Create main category
      const { data: categoryData, error: categoryError } = await supabase
        .from('cashflow_categories')
        .insert({
          name,
          type: 'expense',
          company_id: profile.company_id
        })
        .select()
        .single();

      if (categoryError) throw categoryError;

      // Create subcategories
      if (subcategories.length > 0) {
        const subcategoryInserts = subcategories.map(sub => ({
          category_id: categoryData.id,
          name: sub,
          company_id: profile.company_id
        }));

        const { error: subError } = await supabase
          .from('cashflow_subcategories')
          .insert(subcategoryInserts);

        if (subError) throw subError;
      }

      await fetchOpexCategories();
      toast.success("Kategori başarıyla oluşturuldu.");

      return categoryData;
    } catch (err: any) {
      logger.error('createCategory error:', err);
      toast.error("Kategori oluşturulurken hata oluştu: " + err.message);
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

      // Get current user's company_id for subcategories
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        throw new Error('Şirket bilgisi bulunamadı');
      }

      // Create new subcategories
      if (subcategories.length > 0) {
        const subcategoryInserts = subcategories.map(sub => ({
          category_id: id,
          name: sub,
          company_id: profile.company_id
        }));

        const { error: subError } = await supabase
          .from('cashflow_subcategories')
          .insert(subcategoryInserts);

        if (subError) throw subError;
      }

      await fetchOpexCategories();
      toast.success("Kategori başarıyla güncellendi.");
    } catch (err: any) {
      logger.error('updateCategory error:', err);
      toast.error("Kategori güncellenirken hata oluştu: " + err.message);
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
      toast.success("Kategori başarıyla silindi.");
    } catch (err: any) {
      logger.error('deleteCategory error:', err);
      toast.error("Kategori silinirken hata oluştu: " + err.message);
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
