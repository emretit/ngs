import { useState, useEffect, useCallback } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface BudgetForecast {
  id: string;
  company_id: string;
  year: number;
  month: number;
  category: string;
  subcategory: string | null;
  forecast_amount: number;
  forecast_type: "rolling" | "quarterly" | "annual";
  department_id: string | null;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ForecastFilters {
  year: number;
  month?: number;
  category?: string;
  department_id?: string;
  currency?: string;
  forecast_type?: "rolling" | "quarterly" | "annual";
}

export const useBudgetForecast = (filters?: ForecastFilters) => {
  const [forecasts, setForecasts] = useState<BudgetForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch forecasts
  const fetchForecasts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) throw new Error("Şirket bilgisi bulunamadı");

      let query = supabase
        .from("budget_forecasts")
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
      if (filters?.currency) {
        query = query.eq("currency", filters.currency);
      }
      if (filters?.forecast_type) {
        query = query.eq("forecast_type", filters.forecast_type);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setForecasts(data || []);
    } catch (err: any) {
      logger.error("fetchForecasts error:", err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Tahminler alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Create or update forecast
  const upsertForecast = async (forecast: Partial<BudgetForecast>) => {
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

      const forecastData = {
        ...forecast,
        company_id: companyId,
        created_by: user.id,
      };

      const { data, error: upsertError } = await supabase
        .from("budget_forecasts")
        .upsert(forecastData, {
          onConflict: "company_id,year,month,category,subcategory,department_id,currency",
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      await fetchForecasts();

      toast({
        title: "Başarılı",
        description: "Tahmin kaydedildi.",
      });

      return data;
    } catch (err: any) {
      logger.error("upsertForecast error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Tahmin kaydedilirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Delete forecast
  const deleteForecast = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("budget_forecasts")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      await fetchForecasts();

      toast({
        title: "Başarılı",
        description: "Tahmin silindi.",
      });
    } catch (err: any) {
      logger.error("deleteForecast error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Tahmin silinirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, [fetchForecasts]);

  return {
    forecasts,
    loading,
    error,
    fetchForecasts,
    upsertForecast,
    deleteForecast,
  };
};

