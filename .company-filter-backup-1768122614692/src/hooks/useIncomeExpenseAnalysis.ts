import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

export interface IncomeExpenseAnalysisData {
  income: {
    total: number;
    byCustomer: CustomerIncome[];
    byMonth: MonthlyAmount[];
    byProduct?: ProductIncome[];
  };
  expenses: {
    total: number;
    byCategory: CategoryExpense[];
    byMonth: MonthlyAmount[];
    bySubcategory: SubcategoryExpense[];
  };
  profit: {
    total: number;
    margin: number;
    byMonth: MonthlyProfit[];
  };
  comparisons: {
    vsBudget: BudgetComparison;
    vsPreviousYear: PreviousYearComparison;
  };
}

export interface CustomerIncome {
  customerId: string;
  customerName: string;
  amount: number;
  percentage: number;
  invoiceCount: number;
}

export interface ProductIncome {
  productName: string;
  amount: number;
  quantity: number;
  percentage: number;
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  expenseCount: number;
}

export interface SubcategoryExpense {
  categoryName: string;
  subcategory: string;
  amount: number;
  percentage: number;
}

export interface MonthlyAmount {
  month: number;
  monthName: string;
  amount: number;
}

export interface MonthlyProfit {
  month: number;
  monthName: string;
  income: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface BudgetComparison {
  income: {
    budget: number;
    actual: number;
    variance: number;
    variancePercent: number;
  };
  expenses: {
    budget: number;
    actual: number;
    variance: number;
    variancePercent: number;
  };
  profit: {
    budget: number;
    actual: number;
    variance: number;
    variancePercent: number;
  };
}

export interface PreviousYearComparison {
  income: {
    previous: number;
    current: number;
    change: number;
    changePercent: number;
  };
  expenses: {
    previous: number;
    current: number;
    change: number;
    changePercent: number;
  };
  profit: {
    previous: number;
    current: number;
    change: number;
    changePercent: number;
  };
}

export interface IncomeExpenseFilters {
  year: number;
  currency: "TRY" | "USD" | "EUR";
  department_id?: string;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

export const useIncomeExpenseAnalysis = (filters: IncomeExpenseFilters) => {
  const { userData } = useCurrentUser();

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "incomeExpenseAnalysis",
      userData?.company_id,
      filters.year,
      filters.currency,
      filters.department_id,
      filters.startDate,
      filters.endDate,
      filters.categoryId,
    ],
    queryFn: async (): Promise<IncomeExpenseAnalysisData> => {
      if (!userData?.company_id) {
        return {
          income: { total: 0, byCustomer: [], byMonth: [] },
          expenses: { total: 0, byCategory: [], byMonth: [], bySubcategory: [] },
          profit: { total: 0, margin: 0, byMonth: [] },
          comparisons: {
            vsBudget: {
              income: { budget: 0, actual: 0, variance: 0, variancePercent: 0 },
              expenses: { budget: 0, actual: 0, variance: 0, variancePercent: 0 },
              profit: { budget: 0, actual: 0, variance: 0, variancePercent: 0 },
            },
            vsPreviousYear: {
              income: { previous: 0, current: 0, change: 0, changePercent: 0 },
              expenses: { previous: 0, current: 0, change: 0, changePercent: 0 },
              profit: { previous: 0, current: 0, change: 0, changePercent: 0 },
            },
          },
        };
      }

      const startDate = filters.startDate || `${filters.year}-01-01`;
      const endDate = filters.endDate || `${filters.year}-12-31`;
      const previousYear = filters.year - 1;
      const previousYearStart = `${previousYear}-01-01`;
      const previousYearEnd = `${previousYear}-12-31`;

      // Fetch current year sales invoices
      let incomeQuery = supabase
        .from("sales_invoices")
        .select(`
          toplam_tutar,
          fatura_tarihi,
          para_birimi,
          customer_id,
          customers(name, company)
        `)
        .eq("company_id", userData.company_id)
        .eq("para_birimi", filters.currency)
        .gte("fatura_tarihi", startDate)
        .lte("fatura_tarihi", endDate)
        .eq("durum", "onaylandi");

      if (filters.categoryId) {
        // If filtering by category, we might need to join with invoice items
        // For now, we'll skip this filter for income
      }

      const { data: salesInvoices, error: salesError } = await incomeQuery;
      if (salesError) throw salesError;

      // Fetch previous year sales invoices for comparison
      const { data: previousYearInvoices } = await supabase
        .from("sales_invoices")
        .select("toplam_tutar")
        .eq("company_id", userData.company_id)
        .eq("para_birimi", filters.currency)
        .gte("fatura_tarihi", previousYearStart)
        .lte("fatura_tarihi", previousYearEnd)
        .eq("durum", "onaylandi");

      // Fetch current year expenses
      let expensesQuery = supabase
        .from("expenses")
        .select(`
          amount,
          date,
          category_id,
          subcategory,
          cashflow_categories(name)
        `)
        .eq("company_id", userData.company_id)
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate);

      if (filters.categoryId) {
        expensesQuery = expensesQuery.eq("category_id", filters.categoryId);
      }

      const { data: expenses, error: expensesError } = await expensesQuery;
      if (expensesError) throw expensesError;

      // Fetch previous year expenses
      const { data: previousYearExpensesData } = await supabase
        .from("expenses")
        .select("amount")
        .eq("company_id", userData.company_id)
        .eq("type", "expense")
        .gte("date", previousYearStart)
        .lte("date", previousYearEnd);

      // Calculate income totals and by customer
      const totalIncome = (salesInvoices || []).reduce(
        (sum: number, inv: any) => sum + (Number(inv.toplam_tutar) || 0),
        0
      );

      const customerMap = new Map<string, { name: string; amount: number; count: number }>();
      (salesInvoices || []).forEach((inv: any) => {
        const customerId = inv.customer_id || "unknown";
        const customerName = inv.customers?.name || inv.customers?.company || "Bilinmeyen Müşteri";
        const amount = Number(inv.toplam_tutar) || 0;

        const existing = customerMap.get(customerId) || { name: customerName, amount: 0, count: 0 };
        customerMap.set(customerId, {
          name: customerName,
          amount: existing.amount + amount,
          count: existing.count + 1,
        });
      });

      const byCustomer: CustomerIncome[] = Array.from(customerMap.entries())
        .map(([customerId, data]) => ({
          customerId,
          customerName: data.name,
          amount: data.amount,
          percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
          invoiceCount: data.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Calculate monthly income
      const monthlyIncomeMap = new Map<number, number>();
      (salesInvoices || []).forEach((inv: any) => {
        const date = new Date(inv.fatura_tarihi);
        const month = date.getMonth() + 1;
        const amount = Number(inv.toplam_tutar) || 0;
        monthlyIncomeMap.set(month, (monthlyIncomeMap.get(month) || 0) + amount);
      });

      const byMonthIncome: MonthlyAmount[] = MONTHS.map((monthName, index) => ({
        month: index + 1,
        monthName,
        amount: monthlyIncomeMap.get(index + 1) || 0,
      }));

      // Calculate expenses totals and by category
      const totalExpenses = (expenses || []).reduce(
        (sum: number, exp: any) => sum + (Number(exp.amount) || 0),
        0
      );

      const categoryMap = new Map<string, { name: string; amount: number; count: number }>();
      const subcategoryMap = new Map<string, { categoryName: string; amount: number }>();

      (expenses || []).forEach((exp: any) => {
        const categoryName = (exp.cashflow_categories as any)?.name || "Diğer";
        const categoryId = exp.category_id || "unknown";
        const subcategory = exp.subcategory || "Genel";
        const amount = Number(exp.amount) || 0;

        // Category totals
        const existing = categoryMap.get(categoryId) || { name: categoryName, amount: 0, count: 0 };
        categoryMap.set(categoryId, {
          name: categoryName,
          amount: existing.amount + amount,
          count: existing.count + 1,
        });

        // Subcategory totals
        const subKey = `${categoryName}|${subcategory}`;
        const subExisting = subcategoryMap.get(subKey) || { categoryName, amount: 0 };
        subcategoryMap.set(subKey, {
          categoryName,
          amount: subExisting.amount + amount,
        });
      });

      const byCategory: CategoryExpense[] = Array.from(categoryMap.entries())
        .map(([categoryId, data]) => ({
          categoryId,
          categoryName: data.name,
          amount: data.amount,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          expenseCount: data.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      const bySubcategory: SubcategoryExpense[] = Array.from(subcategoryMap.entries())
        .map(([key, data]) => {
          const [categoryName, subcategory] = key.split("|");
          return {
            categoryName,
            subcategory,
            amount: data.amount,
            percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          };
        })
        .sort((a, b) => b.amount - a.amount);

      // Calculate monthly expenses
      const monthlyExpensesMap = new Map<number, number>();
      (expenses || []).forEach((exp: any) => {
        const date = new Date(exp.date);
        const month = date.getMonth() + 1;
        const amount = Number(exp.amount) || 0;
        monthlyExpensesMap.set(month, (monthlyExpensesMap.get(month) || 0) + amount);
      });

      const byMonthExpenses: MonthlyAmount[] = MONTHS.map((monthName, index) => ({
        month: index + 1,
        monthName,
        amount: monthlyExpensesMap.get(index + 1) || 0,
      }));

      // Calculate monthly profit
      const byMonthProfit: MonthlyProfit[] = MONTHS.map((monthName, index) => {
        const month = index + 1;
        const income = monthlyIncomeMap.get(month) || 0;
        const expenses = monthlyExpensesMap.get(month) || 0;
        const profit = income - expenses;
        const margin = income > 0 ? (profit / income) * 100 : 0;

        return {
          month,
          monthName,
          income,
          expenses,
          profit,
          margin,
        };
      });

      // Calculate profit
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      // Fetch budget data
      let budgetQuery = supabase
        .from("budgets")
        .select("budget_amount, actual_amount, category, month")
        .eq("year", filters.year)
        .eq("currency", filters.currency);

      if (filters.department_id) {
        budgetQuery = budgetQuery.eq("department_id", filters.department_id);
      }

      const { data: budgets } = await budgetQuery;

      // Calculate budget comparisons
      let incomeBudget = 0;
      let expensesBudget = 0;

      if (budgets) {
        budgets.forEach((b: any) => {
          const category = (b.category || "").toLowerCase();
          const budgetAmount = Number(b.budget_amount) || 0;
          if (category.includes("gelir") || category.includes("satış") || category.includes("revenue")) {
            incomeBudget += budgetAmount;
          } else {
            expensesBudget += budgetAmount;
          }
        });
      }

      const incomeVariance = incomeBudget - totalIncome;
      const expensesVariance = expensesBudget - totalExpenses;
      const profitBudget = incomeBudget - expensesBudget;
      const profitVariance = profitBudget - netProfit;

      const budgetComparison: BudgetComparison = {
        income: {
          budget: incomeBudget,
          actual: totalIncome,
          variance: incomeVariance,
          variancePercent: incomeBudget > 0 ? (incomeVariance / incomeBudget) * 100 : 0,
        },
        expenses: {
          budget: expensesBudget,
          actual: totalExpenses,
          variance: expensesVariance,
          variancePercent: expensesBudget > 0 ? (expensesVariance / expensesBudget) * 100 : 0,
        },
        profit: {
          budget: profitBudget,
          actual: netProfit,
          variance: profitVariance,
          variancePercent: profitBudget !== 0 ? (profitVariance / Math.abs(profitBudget)) * 100 : 0,
        },
      };

      // Calculate previous year comparisons
      const previousYearIncome = (previousYearInvoices || []).reduce(
        (sum: number, inv: any) => sum + (Number(inv.toplam_tutar) || 0),
        0
      );
      const previousYearExpenses = (previousYearExpensesData || []).reduce(
        (sum: number, exp: any) => sum + (Number(exp.amount) || 0),
        0
      );
      const previousYearProfit = previousYearIncome - previousYearExpenses;

      const previousYearComparison: PreviousYearComparison = {
        income: {
          previous: previousYearIncome,
          current: totalIncome,
          change: totalIncome - previousYearIncome,
          changePercent: previousYearIncome > 0 ? ((totalIncome - previousYearIncome) / previousYearIncome) * 100 : 0,
        },
        expenses: {
          previous: previousYearExpenses,
          current: totalExpenses,
          change: totalExpenses - previousYearExpenses,
          changePercent: previousYearExpenses > 0 ? ((totalExpenses - previousYearExpenses) / previousYearExpenses) * 100 : 0,
        },
        profit: {
          previous: previousYearProfit,
          current: netProfit,
          change: netProfit - previousYearProfit,
          changePercent: previousYearProfit !== 0 ? ((netProfit - previousYearProfit) / Math.abs(previousYearProfit)) * 100 : 0,
        },
      };

      return {
        income: {
          total: totalIncome,
          byCustomer,
          byMonth: byMonthIncome,
        },
        expenses: {
          total: totalExpenses,
          byCategory,
          byMonth: byMonthExpenses,
          bySubcategory,
        },
        profit: {
          total: netProfit,
          margin: profitMargin,
          byMonth: byMonthProfit,
        },
        comparisons: {
          vsBudget: budgetComparison,
          vsPreviousYear: previousYearComparison,
        },
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  });

  return {
    data: data || {
      income: { total: 0, byCustomer: [], byMonth: [] },
      expenses: { total: 0, byCategory: [], byMonth: [], bySubcategory: [] },
      profit: { total: 0, margin: 0, byMonth: [] },
      comparisons: {
        vsBudget: {
          income: { budget: 0, actual: 0, variance: 0, variancePercent: 0 },
          expenses: { budget: 0, actual: 0, variance: 0, variancePercent: 0 },
          profit: { budget: 0, actual: 0, variance: 0, variancePercent: 0 },
        },
        vsPreviousYear: {
          income: { previous: 0, current: 0, change: 0, changePercent: 0 },
          expenses: { previous: 0, current: 0, change: 0, changePercent: 0 },
          profit: { previous: 0, current: 0, change: 0, changePercent: 0 },
        },
      },
    },
    isLoading,
    error: error as Error | null,
  };
};

