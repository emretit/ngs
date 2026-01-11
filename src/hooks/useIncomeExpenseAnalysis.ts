import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

// Re-export types
export type {
  IncomeExpenseAnalysisData,
  CustomerIncome,
  ProductIncome,
  CategoryExpense,
  SubcategoryExpense,
  MonthlyAmount,
  MonthlyProfit,
  BudgetComparison,
  PreviousYearComparison,
  IncomeExpenseFilters
} from './income-expense/types';

import {
  IncomeExpenseAnalysisData,
  IncomeExpenseFilters,
  MONTHS
} from './income-expense/types';

/**
 * Income/Expense Analysis Hook
 * 
 * Gelir-gider analizi, bütçe karşılaştırması ve karlılık hesaplamaları
 * 
 * @example
 * const { data, isLoading } = useIncomeExpenseAnalysis({
 *   year: 2024,
 *   currency: 'TRY'
 * });
 */
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
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate);

      if (filters.categoryId) {
        expensesQuery = expensesQuery.eq("category_id", filters.categoryId);
      }

      const { data: expenses, error: expensesError } = await expensesQuery;
      if (expensesError) throw expensesError;

      // Fetch previous year expenses
      const { data: previousYearExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("type", "expense")
        .gte("date", previousYearStart)
        .lte("date", previousYearEnd);

      // Calculate income totals and by customer
      const customerMap = new Map<string, { name: string; amount: number; count: number }>();
      let totalIncome = 0;

      (salesInvoices || []).forEach((invoice: any) => {
        const amount = invoice.toplam_tutar || 0;
        totalIncome += amount;

        const customerId = invoice.customer_id || "unknown";
        const customerName = invoice.customers?.name || invoice.customers?.company || "Bilinmeyen";

        const existing = customerMap.get(customerId) || { name: customerName, amount: 0, count: 0 };
        existing.amount += amount;
        existing.count += 1;
        customerMap.set(customerId, existing);
      });

      const byCustomer = Array.from(customerMap.entries())
        .map(([id, data]) => ({
          customerId: id,
          customerName: data.name,
          amount: data.amount,
          percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
          invoiceCount: data.count,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Calculate monthly income
      const monthlyIncomeMap = new Map<number, number>();
      (salesInvoices || []).forEach((invoice: any) => {
        const month = new Date(invoice.fatura_tarihi).getMonth();
        const amount = invoice.toplam_tutar || 0;
        monthlyIncomeMap.set(month, (monthlyIncomeMap.get(month) || 0) + amount);
      });

      const byMonthIncome: any[] = MONTHS.map((monthName, index) => ({
        month: index + 1,
        monthName,
        amount: monthlyIncomeMap.get(index) || 0,
      }));

      // Calculate expenses totals and by category
      const categoryMap = new Map<string, { name: string; amount: number; count: number }>();
      const subcategoryMap = new Map<string, { category: string; amount: number }>();
      let totalExpenses = 0;

      (expenses || []).forEach((expense: any) => {
        const amount = expense.amount || 0;
        totalExpenses += amount;

        const categoryId = expense.category_id || "unknown";
        const categoryName = expense.cashflow_categories?.name || "Diğer";

        // Category totals
        const existingCategory = categoryMap.get(categoryId) || { name: categoryName, amount: 0, count: 0 };
        existingCategory.amount += amount;
        existingCategory.count += 1;
        categoryMap.set(categoryId, existingCategory);

        // Subcategory totals
        if (expense.subcategory) {
          const subKey = `${categoryName}:${expense.subcategory}`;
          const existingSub = subcategoryMap.get(subKey) || { category: categoryName, amount: 0 };
          existingSub.amount += amount;
          subcategoryMap.set(subKey, existingSub);
        }
      });

      const byCategory = Array.from(categoryMap.entries())
        .map(([id, data]) => ({
          categoryId: id,
          categoryName: data.name,
          amount: data.amount,
          percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          expenseCount: data.count,
        }))
        .sort((a, b) => b.amount - a.amount);

      const bySubcategory = Array.from(subcategoryMap.entries())
        .map(([key, data]) => {
          const [categoryName, subcategory] = key.split(":");
          return {
            categoryName,
            subcategory,
            amount: data.amount,
            percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
          };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 15);

      // Calculate monthly expenses
      const monthlyExpensesMap = new Map<number, number>();
      (expenses || []).forEach((expense: any) => {
        const month = new Date(expense.date).getMonth();
        const amount = expense.amount || 0;
        monthlyExpensesMap.set(month, (monthlyExpensesMap.get(month) || 0) + amount);
      });

      const byMonthExpenses: any[] = MONTHS.map((monthName, index) => ({
        month: index + 1,
        monthName,
        amount: monthlyExpensesMap.get(index) || 0,
      }));

      // Calculate monthly profit
      const byMonthProfit: any[] = MONTHS.map((monthName, index) => {
        const income = monthlyIncomeMap.get(index) || 0;
        const expenseAmount = monthlyExpensesMap.get(index) || 0;
        const profit = income - expenseAmount;
        return {
          month: index + 1,
          monthName,
          income,
          expenses: expenseAmount,
          profit,
          margin: income > 0 ? (profit / income) * 100 : 0,
        };
      });

      // Calculate profit
      const totalProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;

      // Fetch budget data
      const { data: budgetData } = await supabase
        .from("budget_entries")
        .select("amount, type, category")
        .eq("year", filters.year);

      const budgetIncome = (budgetData || [])
        .filter((b: any) => b.type === "revenue")
        .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

      const budgetExpenses = (budgetData || [])
        .filter((b: any) => b.type === "expense")
        .reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

      const budgetProfit = budgetIncome - budgetExpenses;

      // Previous year comparison
      const previousYearIncome = (previousYearInvoices || []).reduce(
        (sum: number, inv: any) => sum + (inv.toplam_tutar || 0),
        0
      );

      const previousYearExpensesTotal = (previousYearExpenses || []).reduce(
        (sum: number, exp: any) => sum + (exp.amount || 0),
        0
      );

      const previousYearProfit = previousYearIncome - previousYearExpensesTotal;

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
          total: totalProfit,
          margin: profitMargin,
          byMonth: byMonthProfit,
        },
        comparisons: {
          vsBudget: {
            income: {
              budget: budgetIncome,
              actual: totalIncome,
              variance: totalIncome - budgetIncome,
              variancePercent: budgetIncome > 0 ? ((totalIncome - budgetIncome) / budgetIncome) * 100 : 0,
            },
            expenses: {
              budget: budgetExpenses,
              actual: totalExpenses,
              variance: totalExpenses - budgetExpenses,
              variancePercent: budgetExpenses > 0 ? ((totalExpenses - budgetExpenses) / budgetExpenses) * 100 : 0,
            },
            profit: {
              budget: budgetProfit,
              actual: totalProfit,
              variance: totalProfit - budgetProfit,
              variancePercent: budgetProfit !== 0 ? ((totalProfit - budgetProfit) / Math.abs(budgetProfit)) * 100 : 0,
            },
          },
          vsPreviousYear: {
            income: {
              previous: previousYearIncome,
              current: totalIncome,
              change: totalIncome - previousYearIncome,
              changePercent: previousYearIncome > 0 ? ((totalIncome - previousYearIncome) / previousYearIncome) * 100 : 0,
            },
            expenses: {
              previous: previousYearExpensesTotal,
              current: totalExpenses,
              change: totalExpenses - previousYearExpensesTotal,
              changePercent: previousYearExpensesTotal > 0 ? ((totalExpenses - previousYearExpensesTotal) / previousYearExpensesTotal) * 100 : 0,
            },
            profit: {
              previous: previousYearProfit,
              current: totalProfit,
              change: totalProfit - previousYearProfit,
              changePercent: previousYearProfit !== 0 ? ((totalProfit - previousYearProfit) / Math.abs(previousYearProfit)) * 100 : 0,
            },
          },
        },
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    data,
    isLoading,
    error,
  };
};
