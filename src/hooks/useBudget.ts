import { useState, useEffect, useCallback } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface Budget {
  id: string;
  company_id: string;
  year: number;
  month: number;
  category: string;
  subcategory: string | null;
  budget_amount: number;
  actual_amount: number;
  forecast_amount: number;
  department_id: string | null;
  project_id: string | null;
  currency: string;
  status: "draft" | "approved" | "locked";
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BudgetFilters {
  year: number;
  month?: number;
  category?: string;
  department_id?: string;
  status?: string;
  currency?: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalActual: number;
  totalForecast: number;
  variance: number;
  variancePercent: number;
  utilizationPercent: number;
}

export const useBudget = (filters?: BudgetFilters) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch budgets
  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from("budgets")
        .select("*")
        .order("category")
        .order("month");

      if (filters?.year) {
        query = query.eq("year", filters.year);
      }
      if (filters?.month) {
        query = query.eq("month", filters.month);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.department_id) {
        query = query.eq("department_id", filters.department_id);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.currency) {
        query = query.eq("currency", filters.currency);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setBudgets(data || []);
    } catch (err: any) {
      logger.error("fetchBudgets error:", err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bütçe verileri alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);


  // Create or update budget
  const upsertBudget = async (budget: Partial<Budget>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      const budgetData = {
        ...budget,
        company_id: companyId,
        created_by: user.id,
      };

      const { data, error: upsertError } = await supabase
        .from("budgets")
        .upsert(budgetData, {
          onConflict: "company_id,year,month,category,subcategory,department_id,currency",
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      // Update local state
      setBudgets((prev) => {
        const exists = prev.find((b) => b.id === data.id);
        if (exists) {
          return prev.map((b) => (b.id === data.id ? data : b));
        }
        return [...prev, data];
      });

      toast({
        title: "Başarılı",
        description: "Bütçe kaydedildi.",
      });

      return data;
    } catch (err: any) {
      logger.error("upsertBudget error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bütçe kaydedilirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Bulk upsert budgets
  const bulkUpsertBudgets = async (budgetsData: Partial<Budget>[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      const preparedData = budgetsData.map((b) => ({
        ...b,
        company_id: companyId,
        created_by: user.id,
      }));

      const { data, error: upsertError } = await supabase
        .from("budgets")
        .upsert(preparedData, {
          onConflict: "company_id,year,month,category,subcategory,department_id,currency",
        })
        .select();

      if (upsertError) throw upsertError;

      await fetchBudgets();

      toast({
        title: "Başarılı",
        description: `${data?.length || 0} bütçe kaydı güncellendi.`,
      });

      return data;
    } catch (err: any) {
      logger.error("bulkUpsertBudgets error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bütçeler kaydedilirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Delete budget
  const deleteBudget = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setBudgets((prev) => prev.filter((b) => b.id !== id));

      toast({
        title: "Başarılı",
        description: "Bütçe silindi.",
      });
    } catch (err: any) {
      logger.error("deleteBudget error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bütçe silinirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Update budget status
  const updateBudgetStatus = async (id: string, status: Budget["status"]) => {
    try {
      const { data, error: updateError } = await supabase
        .from("budgets")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? data : b))
      );

      toast({
        title: "Başarılı",
        description: `Bütçe durumu güncellendi: ${status}`,
      });

      return data;
    } catch (err: any) {
      logger.error("updateBudgetStatus error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Durum güncellenirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Lock all budgets for a year
  const lockYearBudgets = async (year: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const { error: updateError } = await supabase
        .from("budgets")
        .update({ status: "locked" })
        .eq("year", year)
        ;

      if (updateError) throw updateError;

      await fetchBudgets();

      toast({
        title: "Başarılı",
        description: `${year} yılı bütçeleri kilitlendi.`,
      });
    } catch (err: any) {
      logger.error("lockYearBudgets error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Bütçeler kilitlenirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Copy budget from previous year
  const copyFromPreviousYear = async (sourceYear: number, targetYear: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      // Fetch source year budgets
      const { data: sourceBudgets, error: fetchError } = await supabase
        .from("budgets")
        .select("*")
        .eq("year", sourceYear)
        ;

      if (fetchError) throw fetchError;

      if (!sourceBudgets || sourceBudgets.length === 0) {
        throw new Error(`${sourceYear} yılında kopyalanacak bütçe bulunamadı`);
      }

      // Create new budgets for target year
      const newBudgets = sourceBudgets.map((b) => ({
        company_id: companyId,
        year: targetYear,
        month: b.month,
        category: b.category,
        subcategory: b.subcategory,
        budget_amount: b.budget_amount,
        actual_amount: 0,
        forecast_amount: b.budget_amount,
        department_id: b.department_id,
        project_id: b.project_id,
        currency: b.currency,
        status: "draft" as const,
        notes: `${sourceYear} yılından kopyalandı`,
        created_by: user.id,
      }));

      const { data, error: insertError } = await supabase
        .from("budgets")
        .upsert(newBudgets, {
          onConflict: "company_id,year,month,category,subcategory,department_id,currency",
        })
        .select();

      if (insertError) throw insertError;

      await fetchBudgets();

      toast({
        title: "Başarılı",
        description: `${sourceBudgets.length} bütçe kaydı ${targetYear} yılına kopyalandı.`,
      });

      return data;
    } catch (err: any) {
      logger.error("copyFromPreviousYear error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: err.message,
      });
      throw err;
    }
  };

  // Calculate summary
  const getSummary = useCallback((): BudgetSummary => {
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.budget_amount), 0);
    const totalActual = budgets.reduce((sum, b) => sum + Number(b.actual_amount), 0);
    const totalForecast = budgets.reduce((sum, b) => sum + Number(b.forecast_amount), 0);
    const variance = totalBudget - totalActual;
    const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
    const utilizationPercent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalActual,
      totalForecast,
      variance,
      variancePercent,
      utilizationPercent,
    };
  }, [budgets]);

  // Get budgets by category
  const getBudgetsByCategory = useCallback(() => {
    const categoryMap = new Map<string, Budget[]>();
    
    budgets.forEach((b) => {
      const existing = categoryMap.get(b.category) || [];
      categoryMap.set(b.category, [...existing, b]);
    });

    return categoryMap;
  }, [budgets]);

  // Get monthly totals
  const getMonthlyTotals = useCallback(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      budget: 0,
      actual: 0,
      forecast: 0,
    }));

    budgets.forEach((b) => {
      const monthIndex = b.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex].budget += Number(b.budget_amount);
        monthlyData[monthIndex].actual += Number(b.actual_amount);
        monthlyData[monthIndex].forecast += Number(b.forecast_amount);
      }
    });

    return monthlyData;
  }, [budgets]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    upsertBudget,
    bulkUpsertBudgets,
    deleteBudget,
    updateBudgetStatus,
    lockYearBudgets,
    copyFromPreviousYear,
    getSummary,
    getBudgetsByCategory,
    getMonthlyTotals,
  };
};

