import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

export interface ProfitLossData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  monthlyData: MonthlyProfitLoss[];
  incomeByCategory: CategoryAmount[];
  expensesByCategory: CategoryAmount[];
  budgetComparison?: {
    incomeBudget: number;
    expensesBudget: number;
    incomeVariance: number;
    expensesVariance: number;
    incomeVariancePercent: number;
    expensesVariancePercent: number;
  };
}

export interface MonthlyProfitLoss {
  month: number;
  monthName: string;
  income: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}

export interface CategoryAmount {
  category: string;
  amount: number;
  percentage: number;
}

export interface ProfitLossFilters {
  year: number;
  currency: "TRY" | "USD" | "EUR";
  department_id?: string;
  month?: number; // Optional: filter by specific month
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const useProfitLoss = (filters: ProfitLossFilters) => {
  const { userData } = useCurrentUser();

  const { data, isLoading, error } = useQuery({
    queryKey: ["profitLoss", userData?.company_id, filters.year, filters.currency, filters.department_id, filters.month],
    queryFn: async (): Promise<ProfitLossData> => {
      if (!userData?.company_id) {
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          monthlyData: [],
          incomeByCategory: [],
          expensesByCategory: [],
        };
      }

      const startDate = `${filters.year}-01-01`;
      const endDate = `${filters.year}-12-31`;

      // Fetch sales invoices (income)
      let incomeQuery = supabase
        .from("sales_invoices")
        .select("toplam_tutar, fatura_tarihi, para_birimi")
        .eq("company_id", userData.company_id)
        .eq("para_birimi", filters.currency)
        .gte("fatura_tarihi", startDate)
        .lte("fatura_tarihi", endDate)
        .eq("durum", "onaylandi"); // Only approved invoices

      if (filters.month) {
        const monthStart = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
        const monthEnd = `${filters.year}-${String(filters.month).padStart(2, "0")}-31`;
        incomeQuery = incomeQuery
          .gte("fatura_tarihi", monthStart)
          .lte("fatura_tarihi", monthEnd);
      }

      const { data: salesInvoices, error: salesError } = await incomeQuery;

      if (salesError) {
        console.error("Sales invoices fetch error:", salesError);
        throw salesError;
      }

      console.log(`Fetched ${salesInvoices?.length || 0} sales invoices for year ${filters.year}, currency ${filters.currency}`);

      // Fetch expenses
      let expensesQuery = supabase
        .from("expenses")
        .select("amount, date, category_id, cashflow_categories(name)")
        .eq("company_id", userData.company_id)
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

      const { data: expenses, error: expensesError } = await expensesQuery;

      if (expensesError) {
        console.error("Expenses fetch error:", expensesError);
        throw expensesError;
      }

      console.log(`Fetched ${expenses?.length || 0} expenses for year ${filters.year}`);

      // Calculate monthly data
      const monthlyData: MonthlyProfitLoss[] = MONTHS.map((monthName, index) => {
        const month = index + 1;
        const monthStart = `${filters.year}-${String(month).padStart(2, "0")}-01`;
        const monthEnd = `${filters.year}-${String(month).padStart(2, "0")}-31`;

        const monthIncome = (salesInvoices || [])
          .filter((inv: any) => {
            const invoiceDate = inv.fatura_tarihi;
            return invoiceDate >= monthStart && invoiceDate <= monthEnd;
          })
          .reduce((sum: number, inv: any) => sum + (Number(inv.toplam_tutar) || 0), 0);

        const monthExpenses = (expenses || [])
          .filter((exp: any) => {
            const expenseDate = exp.date;
            return expenseDate >= monthStart && expenseDate <= monthEnd;
          })
          .reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0);

        const monthProfit = monthIncome - monthExpenses;
        const monthProfitMargin = monthIncome > 0 ? (monthProfit / monthIncome) * 100 : 0;

        return {
          month,
          monthName,
          income: monthIncome,
          expenses: monthExpenses,
          profit: monthProfit,
          profitMargin: monthProfitMargin,
        };
      });

      // Calculate totals
      const totalIncome = (salesInvoices || []).reduce(
        (sum: number, inv: any) => sum + (Number(inv.toplam_tutar) || 0),
        0
      );

      const totalExpenses = (expenses || []).reduce(
        (sum: number, exp: any) => sum + (Number(exp.amount) || 0),
        0
      );

      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      // Group income by customer (we'll use a simple approach - could be enhanced)
      const incomeByCategory: CategoryAmount[] = [];
      // For now, we'll just show total income as one category
      if (totalIncome > 0) {
        incomeByCategory.push({
          category: "Satış Gelirleri",
          amount: totalIncome,
          percentage: 100,
        });
      }

      // Group expenses by category
      const expensesByCategoryMap = new Map<string, number>();
      (expenses || []).forEach((exp: any) => {
        const categoryName = (exp.cashflow_categories as any)?.name || "Diğer";
        const current = expensesByCategoryMap.get(categoryName) || 0;
        expensesByCategoryMap.set(categoryName, current + (Number(exp.amount) || 0));
      });

      const expensesByCategory: CategoryAmount[] = Array.from(expensesByCategoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Fetch budget data for comparison
      let budgetQuery = supabase
        .from("budgets")
        .select("budget_amount, actual_amount, category, month")
        .eq("year", filters.year)
        .eq("currency", filters.currency);

      if (filters.department_id) {
        budgetQuery = budgetQuery.eq("department_id", filters.department_id);
      }

      const { data: budgets, error: budgetError } = await budgetQuery;

      let budgetComparison;
      if (!budgetError && budgets) {
        // Calculate income budget (from revenue categories)
        const incomeBudget = budgets
          .filter((b: any) => {
            // Assuming revenue categories might be named differently
            // This is a simple approach - you might need to adjust based on your category naming
            const category = (b.category || "").toLowerCase();
            return category.includes("gelir") || category.includes("satış") || category.includes("revenue");
          })
          .reduce((sum: number, b: any) => sum + (Number(b.budget_amount) || 0), 0);

        // Calculate expenses budget (from expense categories)
        const expensesBudget = budgets
          .filter((b: any) => {
            const category = (b.category || "").toLowerCase();
            return !category.includes("gelir") && !category.includes("satış") && !category.includes("revenue");
          })
          .reduce((sum: number, b: any) => sum + (Number(b.budget_amount) || 0), 0);

        const incomeVariance = incomeBudget - totalIncome;
        const expensesVariance = expensesBudget - totalExpenses;
        const incomeVariancePercent = incomeBudget > 0 ? (incomeVariance / incomeBudget) * 100 : 0;
        const expensesVariancePercent = expensesBudget > 0 ? (expensesVariance / expensesBudget) * 100 : 0;

        budgetComparison = {
          incomeBudget,
          expensesBudget,
          incomeVariance,
          expensesVariance,
          incomeVariancePercent,
          expensesVariancePercent,
        };
      }

      return {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin,
        monthlyData,
        incomeByCategory,
        expensesByCategory,
        budgetComparison,
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  return {
    data: data || {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      monthlyData: [],
      incomeByCategory: [],
      expensesByCategory: [],
    },
    isLoading,
    error: error as Error | null,
  };
};

