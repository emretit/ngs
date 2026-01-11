import { useInfiniteScroll } from "./useInfiniteScroll";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "./useCurrentUser";

export interface BudgetYearSummary {
  year: number;
  totalBudget: number;
  totalActual: number;
  totalForecast: number;
  remaining: number;
  variancePercent: number;
  utilizationPercent: number;
  status: "draft" | "approved" | "locked" | "mixed";
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface UseBudgetsFilters {
  year?: number;
  status?: string;
  currency?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const useBudgetsList = (filters: UseBudgetsFilters = {}) => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  // Real-time subscription - budgets tablosundaki değişiklikleri dinle
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('budgets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets',
          filter: `company_id=eq.${userData.company_id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["budgets-list"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

  const fetchBudgets = async (page: number, pageSize: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user?.id)
      .single();

    const companyId = profile?.company_id;
    
    if (!companyId) {
      return {
        data: [] as BudgetYearSummary[],
        totalCount: 0,
        hasNextPage: false
      };
    }

    // Tüm bütçeleri tek sorguda çek
    let budgetsQuery = supabase
      .from("budgets")
      .select("year, currency, status, created_at, updated_at, budget_amount, actual_amount, forecast_amount")
      ;

    if (filters.year) {
      budgetsQuery = budgetsQuery.eq("year", filters.year);
    }

    if (filters.status && filters.status !== "all") {
      budgetsQuery = budgetsQuery.eq("status", filters.status);
    }

    if (filters.currency) {
      budgetsQuery = budgetsQuery.eq("currency", filters.currency);
    }

    const { data: allBudgets, error: budgetsError } = await budgetsQuery;

    if (budgetsError) {
      logger.error("Error fetching budgets:", budgetsError);
      throw budgetsError;
    }

    if (!allBudgets || allBudgets.length === 0) {
      return {
        data: [] as BudgetYearSummary[],
        totalCount: 0,
        hasNextPage: false
      };
    }

    // Yıl ve para birimi bazlı gruplama ve toplam hesaplama
    const yearMap = new Map<string, {
      year: number;
      currency: string;
      statuses: Set<string>;
      totalBudget: number;
      totalActual: number;
      totalForecast: number;
      createdAt: string;
      updatedAt: string;
    }>();

    allBudgets.forEach((budget: any) => {
      const key = `${budget.year}_${budget.currency}`;
      if (!yearMap.has(key)) {
        yearMap.set(key, {
          year: budget.year,
          currency: budget.currency,
          statuses: new Set(),
          totalBudget: 0,
          totalActual: 0,
          totalForecast: 0,
          createdAt: budget.created_at,
          updatedAt: budget.updated_at,
        });
      }
      const entry = yearMap.get(key)!;
      
      // Toplamları ekle
      entry.totalBudget += Number(budget.budget_amount || 0);
      entry.totalActual += Number(budget.actual_amount || 0);
      entry.totalForecast += Number(budget.forecast_amount || 0);
      
      if (budget.status) {
        entry.statuses.add(budget.status);
      }
      // En güncel tarihi tut
      if (new Date(budget.updated_at) > new Date(entry.updatedAt)) {
        entry.updatedAt = budget.updated_at;
      }
      if (new Date(budget.created_at) < new Date(entry.createdAt)) {
        entry.createdAt = budget.created_at;
      }
    });

    // Summary'leri oluştur
    const summaries: BudgetYearSummary[] = [];

    for (const [key, info] of yearMap.entries()) {
      const remaining = info.totalBudget - info.totalActual;
      const variancePercent = info.totalBudget > 0 ? (remaining / info.totalBudget) * 100 : 0;
      const utilizationPercent = info.totalBudget > 0 ? (info.totalActual / info.totalBudget) * 100 : 0;

      // Durum belirleme
      let status: "draft" | "approved" | "locked" | "mixed" = "draft";
      if (info.statuses.size === 1) {
        status = Array.from(info.statuses)[0] as "draft" | "approved" | "locked";
      } else if (info.statuses.size > 1) {
        status = "mixed";
      }

      summaries.push({
        year: info.year,
        totalBudget: info.totalBudget,
        totalActual: info.totalActual,
        totalForecast: info.totalForecast,
        remaining,
        variancePercent,
        utilizationPercent,
        status,
        currency: info.currency,
        createdAt: info.createdAt,
        updatedAt: info.updatedAt,
      });
    }

    // Sıralama
    const sortField = filters.sortField || 'year';
    const sortDirection = filters.sortDirection || 'desc';
    
    summaries.sort((a, b) => {
      let aValue: any = a[sortField as keyof BudgetYearSummary];
      let bValue: any = b[sortField as keyof BudgetYearSummary];
      
      if (sortField === 'year') {
        aValue = a.year;
        bValue = b.year;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const paginatedSummaries = summaries.slice(from, to + 1);

    return {
      data: paginatedSummaries,
      totalCount: summaries.length,
      hasNextPage: to < summaries.length - 1
    };
  };

  return useInfiniteScroll(
    ["budgets-list", JSON.stringify(filters)],
    fetchBudgets,
    {
      pageSize: 20,
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Her mount'ta veriyi kontrol et ve gerekirse yenile
      staleTime: 3 * 60 * 1000, // 3 dakika - veri bu süre içinde fresh sayılır
      gcTime: 10 * 60 * 1000, // 10 dakika - cache'de kalma süresi
    }
  );
};

