import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface CashflowCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  type: 'income' | 'expense';
}

export const useCashflowCategories = () => {
  const [categories, setCategories] = useState<CashflowCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      
      setCategories((data || []) as CashflowCategory[]);
    } catch (err: any) {
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryData) => {
    try {
      // Auth disabled - no user check needed
      const user_id = '00000000-0000-0000-0000-000000000001'; // Default user ID

      const insertData = {
        ...data,
        user_id: user_id,
      };

      const { data: newCategory, error } = await supabase
        .from('cashflow_categories')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, newCategory as CashflowCategory].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      
      return newCategory;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create category: " + err.message,
      });
      throw err;
    }
  };

  const updateCategory = async (id: string, data: Partial<CreateCategoryData>) => {
    try {
      const { data: updatedCategory, error } = await supabase
        .from('cashflow_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => prev.map(c => c.id === id ? updatedCategory as CashflowCategory : c).sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      
      return updatedCategory;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update category: " + err.message,
      });
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cashflow_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category: " + err.message,
      });
      throw err;
    }
  };

  const getCategoriesByType = (type: 'income' | 'expense') => {
    return categories.filter(category => category.type === type);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    refetch: fetchCategories,
  };
};