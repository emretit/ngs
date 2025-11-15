import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface CashflowCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  company_id: string | null;
  created_at: string;
  updated_at: string;
  is_default?: boolean;
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
      
      // Kullanıcının şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');
      
      // Kullanıcının şirketinin kategorilerini çek (varsayılan kategoriler de dahil)
      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('*')
        .eq('company_id', profile.company_id)
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
      // Kullanıcının şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.company_id) throw new Error('Şirket bilgisi bulunamadı');

      const insertData = {
        ...data,
        company_id: profile.company_id,
      };

      const { data: newCategory, error } = await supabase
        .from('cashflow_categories')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [...prev, newCategory as CashflowCategory].sort((a, b) => a.name.localeCompare(b.name)));
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla oluşturuldu",
      });
      
      return newCategory;
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kategori oluşturulurken hata oluştu: " + err.message,
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
        title: "Başarılı",
        description: "Kategori başarıyla güncellendi",
      });
      
      return updatedCategory;
    } catch (err: any) {
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
      // Önce kategoriyi bul ve varsayılan olup olmadığını kontrol et
      const category = categories.find(c => c.id === id);
      
      if (category?.is_default) {
        const errorMessage = "Bu varsayılan kategori silinemez. Sistem tarafından otomatik oluşturulan kategoriler korunmalıdır.";
        toast({
          variant: "destructive",
          title: "Hata",
          description: errorMessage,
        });
        throw new Error(errorMessage);
      }

      // Önce bu kategoriyi kullanan işlemleri kontrol et (sadece expenses tablosu)
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('id')
        .eq('category_id', id)
        .limit(1);

      if (expensesError) throw expensesError;

      if (expensesData && expensesData.length > 0) {
        const errorMessage = "Bu kategori kullanılıyor ve silinemez. Lütfen önce bu kategoriyi kullanan işlemleri başka bir kategoriye taşıyın.";
        toast({
          variant: "destructive",
          title: "Hata",
          description: errorMessage,
        });
        throw new Error(errorMessage);
      }

      const { error } = await supabase
        .from('cashflow_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla silindi",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: err.message || "Kategori silinirken hata oluştu: " + err.message,
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