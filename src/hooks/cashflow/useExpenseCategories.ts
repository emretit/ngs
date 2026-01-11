import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}

export function useExpenseCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
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
      
      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('id, name')
        .eq('type', 'expense')
        .eq('company_id', profile.company_id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      logger.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubcategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cashflow_subcategories')
        .select('id, name, category_id')
        .order('name');
      if (error) throw error;
      setSubcategoriesList((data as any) || []);
    } catch (error) {
      logger.error('Error fetching subcategories:', error);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, [fetchCategories, fetchSubcategories]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getSubcategoriesByCategory = useCallback((categoryId: string) => {
    return subcategoriesList.filter(s => s.category_id === categoryId);
  }, [subcategoriesList]);

  return {
    categories,
    subcategoriesList,
    loading,
    fetchCategories,
    fetchSubcategories,
    getCategoryById,
    getSubcategoriesByCategory,
  };
}

