import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

export interface OpexAnalysisData {
  totalExpenses: number;
  byCategory: CategoryExpenseData[];
  bySubcategory: SubcategoryExpenseData[];
  monthlyData: MonthlyExpenseData[];
  budgetComparison?: {
    budgeted: number;
    actual: number;
    variance: number;
    variancePercent: number;
  };
}

export interface CategoryExpenseData {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  subcategories: SubcategoryExpenseData[];
  budgetedAmount?: number;
  variance?: number;
}

export interface SubcategoryExpenseData {
  subcategoryId: string;
  subcategoryName: string;
  categoryName: string;
  amount: number;
  percentage: number;
  monthlyBreakdown: { month: number; amount: number }[];
}

export interface MonthlyExpenseData {
  month: number;
  monthName: string;
  total: number;
  byCategory: { categoryName: string; amount: number }[];
}

export interface OpexAnalysisFilters {
  year: number;
  currency: "TRY" | "USD" | "EUR";
  department_id?: string;
  month?: number;
  categoryId?: string;
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const useOpexAnalysis = (filters: OpexAnalysisFilters) => {
  const { userData } = useCurrentUser();

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "opexAnalysis",
      userData?.company_id,
      filters.year,
      filters.currency,
      filters.department_id,
      filters.month,
      filters.categoryId,
    ],
    queryFn: async (): Promise<OpexAnalysisData> => {
      if (!userData?.company_id) {
        return {
          totalExpenses: 0,
          byCategory: [],
          bySubcategory: [],
          monthlyData: [],
        };
      }

      const startDate = `${filters.year}-01-01`;
      const endDate = `${filters.year}-12-31`;

      // Fetch OPEX data from opex_matrix table
      let opexQuery = supabase
        .from("opex_matrix")
        .select(`
          id,
          category,
          subcategory,
          amount,
          month,
          year
        `)
        
        .eq("year", filters.year);

      if (filters.month) {
        opexQuery = opexQuery.eq("month", filters.month);
      }

      if (filters.categoryId) {
        opexQuery = opexQuery.eq("category", filters.categoryId);
      }

      const { data: opexData, error: opexError } = await opexQuery;

      if (opexError) {
        logger.error("OPEX data fetch error:", opexError);
        throw opexError;
      }

      logger.debug(`Fetched ${opexData?.length || 0} OPEX records for year ${filters.year}`);

      // Also fetch expenses from expenses table as fallback
      let expensesQuery = supabase
        .from("expenses")
        .select(`
          amount,
          date,
          category_id,
          subcategory,
          cashflow_categories(id, name)
        `)
        
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate);

      if (filters.month) {
        const monthStart = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
        const monthEnd = `${filters.year}-${String(filters.month).padStart(2, "0")}-31`;
        expensesQuery = expensesQuery
          .gte("date", monthStart)
          .lte("date", monthEnd);
      }

      if (filters.categoryId) {
        expensesQuery = expensesQuery.eq("category_id", filters.categoryId);
      }

      const { data: expenses, error: expensesError } = await expensesQuery;

      if (expensesError) {
        logger.error("Expenses fetch error:", expensesError);
        throw expensesError;
      }

      logger.debug(`Fetched ${expenses?.length || 0} expense records for year ${filters.year}`);

      // Combine OPEX and expenses data
      const categoryMap = new Map<string, {
        categoryId: string;
        categoryName: string;
        amount: number;
        subcategories: Map<string, {
          subcategoryId: string;
          subcategoryName: string;
          amount: number;
          monthlyBreakdown: Map<number, number>;
        }>;
      }>();

      const monthlyMap = new Map<number, {
        total: number;
        byCategory: Map<string, number>;
      }>();

      // Initialize monthly data
      for (let i = 1; i <= 12; i++) {
        monthlyMap.set(i, {
          total: 0,
          byCategory: new Map(),
        });
      }

      // Process OPEX data
      (opexData || []).forEach((item: any) => {
        const categoryName = item.category || "Genel Giderler";
        const subcategoryName = item.subcategory || "Diğer";
        const amount = Number(item.amount) || 0;
        const month = item.month;

        // Category aggregation
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            categoryId: categoryName,
            categoryName,
            amount: 0,
            subcategories: new Map(),
          });
        }

        const category = categoryMap.get(categoryName)!;
        category.amount += amount;

        // Subcategory aggregation
        if (!category.subcategories.has(subcategoryName)) {
          category.subcategories.set(subcategoryName, {
            subcategoryId: `${categoryName}_${subcategoryName}`,
            subcategoryName,
            amount: 0,
            monthlyBreakdown: new Map(),
          });
        }

        const subcategory = category.subcategories.get(subcategoryName)!;
        subcategory.amount += amount;
        subcategory.monthlyBreakdown.set(
          month,
          (subcategory.monthlyBreakdown.get(month) || 0) + amount
        );

        // Monthly aggregation
        const monthData = monthlyMap.get(month)!;
        monthData.total += amount;
        monthData.byCategory.set(
          categoryName,
          (monthData.byCategory.get(categoryName) || 0) + amount
        );
      });

      // Process expenses data
      (expenses || []).forEach((expense: any) => {
        const categoryName = (expense.cashflow_categories as any)?.name || "Genel Giderler";
        const categoryId = expense.category_id || "unknown";
        const subcategoryName = expense.subcategory || "Diğer";
        const amount = Number(expense.amount) || 0;
        const date = new Date(expense.date);
        const month = date.getMonth() + 1;

        // Category aggregation
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            categoryId,
            categoryName,
            amount: 0,
            subcategories: new Map(),
          });
        }

        const category = categoryMap.get(categoryName)!;
        category.amount += amount;

        // Subcategory aggregation
        if (!category.subcategories.has(subcategoryName)) {
          category.subcategories.set(subcategoryName, {
            subcategoryId: `${categoryName}_${subcategoryName}`,
            subcategoryName,
            amount: 0,
            monthlyBreakdown: new Map(),
          });
        }

        const subcategory = category.subcategories.get(subcategoryName)!;
        subcategory.amount += amount;
        subcategory.monthlyBreakdown.set(
          month,
          (subcategory.monthlyBreakdown.get(month) || 0) + amount
        );

        // Monthly aggregation
        const monthData = monthlyMap.get(month)!;
        monthData.total += amount;
        monthData.byCategory.set(
          categoryName,
          (monthData.byCategory.get(categoryName) || 0) + amount
        );
      });

      // Calculate total expenses
      const totalExpenses = Array.from(categoryMap.values()).reduce(
        (sum, cat) => sum + cat.amount,
        0
      );

      // Transform to output format
      const byCategory: CategoryExpenseData[] = Array.from(categoryMap.values())
        .map(cat => {
          const subcategories: SubcategoryExpenseData[] = Array.from(cat.subcategories.values())
            .map(sub => ({
              subcategoryId: sub.subcategoryId,
              subcategoryName: sub.subcategoryName,
              categoryName: cat.categoryName,
              amount: sub.amount,
              percentage: totalExpenses > 0 ? (sub.amount / totalExpenses) * 100 : 0,
              monthlyBreakdown: Array.from(sub.monthlyBreakdown.entries())
                .map(([month, amount]) => ({ month, amount }))
                .sort((a, b) => a.month - b.month),
            }))
            .sort((a, b) => b.amount - a.amount);

          return {
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            amount: cat.amount,
            percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
            subcategories,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      const bySubcategory: SubcategoryExpenseData[] = byCategory.flatMap(cat => cat.subcategories);

      const monthlyData: MonthlyExpenseData[] = MONTHS.map((monthName, index) => {
        const month = index + 1;
        const data = monthlyMap.get(month)!;
        return {
          month,
          monthName,
          total: data.total,
          byCategory: Array.from(data.byCategory.entries())
            .map(([categoryName, amount]) => ({ categoryName, amount }))
            .sort((a, b) => b.amount - a.amount),
        };
      });

      // Fetch budget comparison if department is selected
      let budgetComparison;
      if (filters.department_id) {
        const { data: budgetData, error: budgetError } = await supabase
          .from("budgets")
          .select("budget_amount, category")
          .eq("year", filters.year)
          .eq("currency", filters.currency)
          .eq("department_id", filters.department_id);

        if (!budgetError && budgetData) {
          const budgeted = budgetData
            .filter(b => b.category !== "Gelirler")
            .reduce((sum, b) => sum + Number(b.budget_amount || 0), 0);

          const variance = budgeted - totalExpenses;

          budgetComparison = {
            budgeted,
            actual: totalExpenses,
            variance,
            variancePercent: budgeted > 0 ? (variance / budgeted) * 100 : 0,
          };
        }
      }

      return {
        totalExpenses,
        byCategory,
        bySubcategory,
        monthlyData,
        budgetComparison,
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
  });

  return {
    data: data || {
      totalExpenses: 0,
      byCategory: [],
      bySubcategory: [],
      monthlyData: [],
    },
    isLoading,
    error,
  };
};

