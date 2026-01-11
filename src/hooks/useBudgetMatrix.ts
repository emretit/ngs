import { useState, useEffect, useCallback, useMemo } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Budget } from "./useBudget";
import { useCurrentUser } from "./useCurrentUser";
import { sortCategoriesByOrder, sortSubcategoriesByOrder } from "@/utils/categorySort";

export interface MatrixCell {
  id?: string;
  budget_amount: number;
  actual_amount: number;
  forecast_amount: number;
  variance: number;
  variancePercent: number;
  status: "draft" | "approved" | "locked";
  isEditing?: boolean;
}

export interface MatrixRow {
  category: string;
  subcategory: string | null;
  isExpanded?: boolean;
  isSubcategory?: boolean;
  parentCategory?: string;
  months: Record<number, MatrixCell>;
  total: MatrixCell;
  ytd: MatrixCell;
}

export interface MatrixConfig {
  year: number;
  currency: string;
  department_id?: string;
  showActual: boolean;
  showForecast: boolean;
  showVariance: boolean;
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const defaultCell: MatrixCell = {
  budget_amount: 0,
  actual_amount: 0,
  forecast_amount: 0,
  variance: 0,
  variancePercent: 0,
  status: "draft",
};

export const useBudgetMatrix = (config: MatrixConfig) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [cashflowCategories, setCashflowCategories] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { userData } = useCurrentUser();

  const currentMonth = new Date().getMonth() + 1;

  // Fetch data
  const fetchData = useCallback(async () => {
    // Get company_id from user profile (like useOpexCategories)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const companyId = profile?.company_id || userData?.company_id;
    if (!companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDate = `${config.year}-01-01`;
      const endDate = `${config.year}-12-31`;

      // Fetch budgets
      let budgetQuery = supabase
        .from("budgets")
        .select("*")
        .eq("year", config.year)
        .eq("currency", config.currency)
        .order("category")
        .order("month");

      if (config.department_id) {
        budgetQuery = budgetQuery.eq("department_id", config.department_id);
      }

      const { data: budgetData, error: budgetError } = await budgetQuery;
      if (budgetError) throw budgetError;

      // Fetch cashflow categories with subcategories (both income and expense)
      const { data: cashflowCategoryData, error: cashflowCategoryError } = await supabase
        .from("cashflow_categories")
        .select(`
          id,
          name,
          type,
          is_default,
          cashflow_subcategories (
            id,
            name,
            category_id,
            is_default
          )
        `)
        .in("type", ["expense", "income"])
        
        .order("name");

      if (cashflowCategoryError) throw cashflowCategoryError;

      // Fetch expenses for actual amounts (OPEX Matrix gibi)
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select(`
          amount,
          date,
          category_id,
          subcategory,
          cashflow_categories!category_id(name)
        `)
        
        .eq("type", "expense")
        .gte("date", startDate)
        .lte("date", endDate);

      if (expensesError) throw expensesError;

      // Fetch sales invoices for income actual amounts
      const { data: incomesData, error: incomesError } = await supabase
        .from("sales_invoices")
        .select(`
          toplam_tutar,
          fatura_tarihi,
          para_birimi
        `)
        
        .eq("para_birimi", config.currency)
        .eq("durum", "onaylandi")
        .gte("fatura_tarihi", startDate)
        .lte("fatura_tarihi", endDate);

      if (incomesError) throw incomesError;

      setBudgets(budgetData || []);
      setExpenses(expensesData || []);
      setIncomes(incomesData || []);
      setCashflowCategories(cashflowCategoryData || []);
    } catch (err: any) {
      logger.error("fetchData error:", err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Veriler alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [config.year, config.currency, config.department_id, toast, userData?.company_id]);

  // Build matrix rows
  const matrixRows = useMemo(() => {
    const rows: MatrixRow[] = [];
    const categoryBudgets = new Map<string, Budget[]>();

    // Group budgets by category
    budgets.forEach((b) => {
      const key = b.category;
      const existing = categoryBudgets.get(key) || [];
      categoryBudgets.set(key, [...existing, b]);
    });

    // Calculate actual amounts from expenses (OPEX Matrix gibi)
    const expensesByCategoryAndMonth = new Map<string, Map<number, number>>();
    expenses.forEach((exp: any) => {
      const categoryName = (exp.cashflow_categories as any)?.name || "Diğer";
      const subcategory = exp.subcategory || "Genel";
      const date = new Date(exp.date);
      const month = date.getMonth() + 1;
      const amount = Number(exp.amount) || 0;

      const key = `${categoryName}|${subcategory}`;
      if (!expensesByCategoryAndMonth.has(key)) {
        expensesByCategoryAndMonth.set(key, new Map());
      }
      const monthMap = expensesByCategoryAndMonth.get(key)!;
      monthMap.set(month, (monthMap.get(month) || 0) + amount);
    });

    // Calculate actual amounts from incomes (sales invoices)
    const incomesByCategoryAndMonth = new Map<string, Map<number, number>>();
    const incomeCategories = cashflowCategories.filter((c: any) => c.type === "income");
    
    // Group incomes by month and category
    // If there are income categories, distribute incomes to first category (or use "Satış Geliri" as default)
    // In the future, this could be enhanced to use invoice items or customer categories
    incomes.forEach((inv: any) => {
      const date = new Date(inv.fatura_tarihi);
      const month = date.getMonth() + 1;
      const amount = Number(inv.toplam_tutar) || 0;

      // Use first income category if available, otherwise use "Satış Geliri" as default
      const defaultCategory = incomeCategories.length > 0 ? incomeCategories[0].name : "Satış Geliri";
      const key = `${defaultCategory}|Genel`;
      
      if (!incomesByCategoryAndMonth.has(key)) {
        incomesByCategoryAndMonth.set(key, new Map());
      }
      const monthMap = incomesByCategoryAndMonth.get(key)!;
      monthMap.set(month, (monthMap.get(month) || 0) + amount);
    });
    
    // Initialize empty maps for all income categories (so they show up even if no data)
    incomeCategories.forEach((cat: any) => {
      const key = `${cat.name}|Genel`;
      if (!incomesByCategoryAndMonth.has(key)) {
        incomesByCategoryAndMonth.set(key, new Map());
      }
    });

    // Get unique categories from cashflow_categories (both income and expense)
    const allCategoriesSet = new Set([
      ...cashflowCategories.map((c: any) => c.name),
      ...Array.from(categoryBudgets.keys()), // Keep budgets categories in case there are custom ones
    ]);

    // Convert to array with metadata for sorting
    const categoriesWithMeta = Array.from(allCategoriesSet).map(name => {
      const cashflowCat = cashflowCategories.find((c: any) => c.name === name);
      return {
        name,
        type: cashflowCat?.type || "expense",
        is_default: cashflowCat?.is_default ?? true, // Assume default if not found
      };
    });

    // Separate income and expense categories
    const incomeCategoriesWithMeta = categoriesWithMeta.filter(c => c.type === "income");
    const expenseCategoriesWithMeta = categoriesWithMeta.filter(c => c.type === "expense");

    // Sort categories by predefined order
    const sortedIncomeCategories = sortCategoriesByOrder(incomeCategoriesWithMeta, 'income');
    const sortedExpenseCategories = sortCategoriesByOrder(expenseCategoriesWithMeta, 'expense');

    // Combine: income categories first, then expense categories
    const sortedCategories = [...sortedIncomeCategories, ...sortedExpenseCategories];

    sortedCategories.forEach((categoryMeta) => {
      const categoryName = categoryMeta.name;
      const categoryType = categoryMeta.type;
      const categoryBudgetItems = categoryBudgets.get(categoryName) || [];
      const isExpanded = expandedCategories.has(categoryName);

      // Create category row
      const categoryRow: MatrixRow = {
        category: categoryName,
        subcategory: null,
        isExpanded,
        isSubcategory: false,
        months: {},
        total: { ...defaultCell },
        ytd: { ...defaultCell },
      };

      // Calculate monthly values for category
      for (let month = 1; month <= 12; month++) {
        const monthBudgets = categoryBudgetItems.filter(b => b.month === month);
        
        let actualAmount = 0;
        
        if (categoryType === "income") {
          // Calculate actual amount from incomes for this category
          let actualAmountFromIncomes = 0;
          cashflowCategories.forEach((cfCategory: any) => {
            if (cfCategory.name === categoryName && cfCategory.type === "income") {
              (cfCategory.cashflow_subcategories || []).forEach((subcat: any) => {
                const key = `${categoryName}|${subcat.name}`;
                const monthMap = incomesByCategoryAndMonth.get(key);
                if (monthMap) {
                  actualAmountFromIncomes += monthMap.get(month) || 0;
                }
              });
            }
          });
          
          // If no subcategories, use general income for this category
          if (actualAmountFromIncomes === 0) {
            const generalKey = `${categoryName}|Genel`;
            const monthMap = incomesByCategoryAndMonth.get(generalKey);
            actualAmountFromIncomes = monthMap?.get(month) || 0;
          }
          
          const budgetActualAmount = monthBudgets.reduce((sum, b) => sum + Number(b.actual_amount), 0);
          actualAmount = actualAmountFromIncomes > 0 ? actualAmountFromIncomes : budgetActualAmount;
        } else {
          // Calculate actual amount from expenses for this category (all subcategories)
          let actualAmountFromExpenses = 0;
          cashflowCategories.forEach((cfCategory: any) => {
            if (cfCategory.name === categoryName) {
              (cfCategory.cashflow_subcategories || []).forEach((subcat: any) => {
                const key = `${categoryName}|${subcat.name}`;
                const monthMap = expensesByCategoryAndMonth.get(key);
                if (monthMap) {
                  actualAmountFromExpenses += monthMap.get(month) || 0;
                }
              });
            }
          });

          // Use expenses data if available, otherwise use budget actual_amount
          const budgetActualAmount = monthBudgets.reduce((sum, b) => sum + Number(b.actual_amount), 0);
          actualAmount = actualAmountFromExpenses > 0 ? actualAmountFromExpenses : budgetActualAmount;
        }

        const cell: MatrixCell = {
          budget_amount: monthBudgets.reduce((sum, b) => sum + Number(b.budget_amount), 0),
          actual_amount: actualAmount,
          forecast_amount: monthBudgets.reduce((sum, b) => sum + Number(b.forecast_amount), 0),
          variance: 0,
          variancePercent: 0,
          status: monthBudgets.length > 0 ? monthBudgets[0].status : "draft",
        };
        cell.variance = cell.budget_amount - cell.actual_amount;
        cell.variancePercent = cell.budget_amount > 0 
          ? (cell.variance / cell.budget_amount) * 100 
          : 0;
        categoryRow.months[month] = cell;

        // Add to total
        categoryRow.total.budget_amount += cell.budget_amount;
        categoryRow.total.actual_amount += cell.actual_amount;
        categoryRow.total.forecast_amount += cell.forecast_amount;

        // Add to YTD (only months up to current month)
        if (month <= currentMonth) {
          categoryRow.ytd.budget_amount += cell.budget_amount;
          categoryRow.ytd.actual_amount += cell.actual_amount;
          categoryRow.ytd.forecast_amount += cell.forecast_amount;
        }
      }

      // Calculate total and YTD variance
      categoryRow.total.variance = categoryRow.total.budget_amount - categoryRow.total.actual_amount;
      categoryRow.total.variancePercent = categoryRow.total.budget_amount > 0
        ? (categoryRow.total.variance / categoryRow.total.budget_amount) * 100
        : 0;
      categoryRow.ytd.variance = categoryRow.ytd.budget_amount - categoryRow.ytd.actual_amount;
      categoryRow.ytd.variancePercent = categoryRow.ytd.budget_amount > 0
        ? (categoryRow.ytd.variance / categoryRow.ytd.budget_amount) * 100
        : 0;

      rows.push(categoryRow);

      // Add subcategory rows if expanded (OPEX Matrix gibi - cashflow_subcategories kullan)
      if (isExpanded) {
        // Get subcategories from cashflow_categories (OPEX Matrix gibi)
        const cashflowCategory = cashflowCategories.find((c: any) => c.name === categoryName);
        const subcategoriesFromCashflow = cashflowCategory?.cashflow_subcategories || [];
        
        // Also get subcategories from budgets
        const subcategoriesFromBudgets = new Set(
          categoryBudgetItems
            .filter(b => b.subcategory)
            .map(b => b.subcategory!)
        );

        // Combine both sources with metadata
        const allSubcategoriesSet = new Set([
          ...subcategoriesFromCashflow.map((s: any) => s.name),
          ...Array.from(subcategoriesFromBudgets),
        ]);

        const subcategoriesWithMeta = Array.from(allSubcategoriesSet).map(name => {
          const cashflowSub = subcategoriesFromCashflow.find((s: any) => s.name === name);
          return {
            name,
            is_default: cashflowSub?.is_default ?? true,
          };
        });

        // Sort subcategories by predefined order
        const sortedSubcategories = sortSubcategoriesByOrder(subcategoriesWithMeta, categoryName);

        sortedSubcategories.forEach((subcategoryMeta) => {
          const subcategory = subcategoryMeta.name;
          const subcategoryBudgets = categoryBudgetItems.filter(
            b => b.subcategory === subcategory
          );

          const subcategoryRow: MatrixRow = {
            category: categoryName,
            subcategory,
            isSubcategory: true,
            parentCategory: categoryName,
            months: {},
            total: { ...defaultCell },
            ytd: { ...defaultCell },
          };

          for (let month = 1; month <= 12; month++) {
            const monthBudget = subcategoryBudgets.find(b => b.month === month);
            
            let actualAmount = 0;
            
            if (categoryType === "income") {
              // Get actual amount from incomes for this subcategory
              const key = `${categoryName}|${subcategory}`;
              const monthMap = incomesByCategoryAndMonth.get(key);
              const actualAmountFromIncomes = monthMap?.get(month) || 0;
              
              // Use incomes data if available, otherwise use budget actual_amount
              const budgetActualAmount = Number(monthBudget?.actual_amount || 0);
              actualAmount = actualAmountFromIncomes > 0 ? actualAmountFromIncomes : budgetActualAmount;
            } else {
              // Get actual amount from expenses for this subcategory
              const key = `${categoryName}|${subcategory}`;
              const monthMap = expensesByCategoryAndMonth.get(key);
              const actualAmountFromExpenses = monthMap?.get(month) || 0;
              
              // Use expenses data if available, otherwise use budget actual_amount
              const budgetActualAmount = Number(monthBudget?.actual_amount || 0);
              actualAmount = actualAmountFromExpenses > 0 ? actualAmountFromExpenses : budgetActualAmount;
            }

            const cell: MatrixCell = {
              id: monthBudget?.id,
              budget_amount: Number(monthBudget?.budget_amount || 0),
              actual_amount: actualAmount,
              forecast_amount: Number(monthBudget?.forecast_amount || 0),
              variance: 0,
              variancePercent: 0,
              status: monthBudget?.status || "draft",
            };
            cell.variance = cell.budget_amount - cell.actual_amount;
            cell.variancePercent = cell.budget_amount > 0
              ? (cell.variance / cell.budget_amount) * 100
              : 0;
            subcategoryRow.months[month] = cell;

            subcategoryRow.total.budget_amount += cell.budget_amount;
            subcategoryRow.total.actual_amount += cell.actual_amount;
            subcategoryRow.total.forecast_amount += cell.forecast_amount;

            if (month <= currentMonth) {
              subcategoryRow.ytd.budget_amount += cell.budget_amount;
              subcategoryRow.ytd.actual_amount += cell.actual_amount;
              subcategoryRow.ytd.forecast_amount += cell.forecast_amount;
            }
          }

          subcategoryRow.total.variance = subcategoryRow.total.budget_amount - subcategoryRow.total.actual_amount;
          subcategoryRow.total.variancePercent = subcategoryRow.total.budget_amount > 0
            ? (subcategoryRow.total.variance / subcategoryRow.total.budget_amount) * 100
            : 0;
          subcategoryRow.ytd.variance = subcategoryRow.ytd.budget_amount - subcategoryRow.ytd.actual_amount;
          subcategoryRow.ytd.variancePercent = subcategoryRow.ytd.budget_amount > 0
            ? (subcategoryRow.ytd.variance / subcategoryRow.ytd.budget_amount) * 100
            : 0;

          rows.push(subcategoryRow);
        });
      }
    });

    return rows;
  }, [budgets, cashflowCategories, expenses, incomes, expandedCategories, currentMonth]);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const totals: MatrixRow = {
      category: "TOPLAM",
      subcategory: null,
      months: {},
      total: { ...defaultCell },
      ytd: { ...defaultCell },
    };

    // Only sum category rows (not subcategories)
    const categoryRows = matrixRows.filter(r => !r.isSubcategory);

    for (let month = 1; month <= 12; month++) {
      const cell: MatrixCell = {
        budget_amount: categoryRows.reduce((sum, r) => sum + (r.months[month]?.budget_amount || 0), 0),
        actual_amount: categoryRows.reduce((sum, r) => sum + (r.months[month]?.actual_amount || 0), 0),
        forecast_amount: categoryRows.reduce((sum, r) => sum + (r.months[month]?.forecast_amount || 0), 0),
        variance: 0,
        variancePercent: 0,
        status: "draft",
      };
      cell.variance = cell.budget_amount - cell.actual_amount;
      cell.variancePercent = cell.budget_amount > 0
        ? (cell.variance / cell.budget_amount) * 100
        : 0;
      totals.months[month] = cell;

      totals.total.budget_amount += cell.budget_amount;
      totals.total.actual_amount += cell.actual_amount;
      totals.total.forecast_amount += cell.forecast_amount;

      if (month <= currentMonth) {
        totals.ytd.budget_amount += cell.budget_amount;
        totals.ytd.actual_amount += cell.actual_amount;
        totals.ytd.forecast_amount += cell.forecast_amount;
      }
    }

    totals.total.variance = totals.total.budget_amount - totals.total.actual_amount;
    totals.total.variancePercent = totals.total.budget_amount > 0
      ? (totals.total.variance / totals.total.budget_amount) * 100
      : 0;
    totals.ytd.variance = totals.ytd.budget_amount - totals.ytd.actual_amount;
    totals.ytd.variancePercent = totals.ytd.budget_amount > 0
      ? (totals.ytd.variance / totals.ytd.budget_amount) * 100
      : 0;

    return totals;
  }, [matrixRows, currentMonth]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Expand all categories
  const expandAll = useCallback(() => {
    const allCategories = new Set(matrixRows.filter(r => !r.isSubcategory).map(r => r.category));
    setExpandedCategories(allCategories);
  }, [matrixRows]);

  // Collapse all categories
  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set());
  }, []);

  // Update cell value
  const updateCell = async (
    category: string,
    subcategory: string | null,
    month: number,
    field: "budget_amount" | "actual_amount" | "forecast_amount",
    value: number
  ) => {
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

      // Find existing budget or create new one
      const existing = budgets.find(
        b => b.category === category && 
             b.subcategory === subcategory && 
             b.month === month
      );

      const budgetData = {
        company_id: companyId,
        year: config.year,
        month,
        category,
        subcategory,
        currency: config.currency,
        department_id: config.department_id || null,
        [field]: value,
        created_by: user.id,
        ...(existing ? {} : {
          budget_amount: field === "budget_amount" ? value : 0,
          actual_amount: field === "actual_amount" ? value : 0,
          forecast_amount: field === "forecast_amount" ? value : 0,
        }),
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
        const index = prev.findIndex(
          b => b.category === category && 
               b.subcategory === subcategory && 
               b.month === month
        );
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });

      return data;
    } catch (err: any) {
      logger.error("updateCell error:", err);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Değer güncellenirken hata oluştu: " + err.message,
      });
      throw err;
    }
  };

  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = ["Kategori", "Alt Kategori", ...MONTHS, "Toplam", "YTD"];
    const csvRows = [headers.join(",")];

    matrixRows.forEach((row) => {
      const monthValues = MONTHS.map((_, i) => row.months[i + 1]?.budget_amount || 0);
      csvRows.push([
        row.category,
        row.subcategory || "",
        ...monthValues,
        row.total.budget_amount,
        row.ytd.budget_amount,
      ].join(","));
    });

    // Add totals row
    const totalMonthValues = MONTHS.map((_, i) => grandTotals.months[i + 1]?.budget_amount || 0);
    csvRows.push([
      "TOPLAM",
      "",
      ...totalMonthValues,
      grandTotals.total.budget_amount,
      grandTotals.ytd.budget_amount,
    ].join(","));

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `budget_matrix_${config.year}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [matrixRows, grandTotals, config.year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-expand all categories when cashflow categories are loaded (to show subcategories like OPEX Matrix)
  // Only auto-expand on initial load, not when user manually collapses
  const [hasInitialExpanded, setHasInitialExpanded] = useState(false);
  useEffect(() => {
    if (cashflowCategories.length > 0 && expandedCategories.size === 0 && !hasInitialExpanded) {
      const allCategoryNames = new Set(
        cashflowCategories
          .filter((c: any) => c.type === "expense" || c.type === "income")
          .map((c: any) => c.name)
      );
      if (allCategoryNames.size > 0) {
        setExpandedCategories(allCategoryNames);
        setHasInitialExpanded(true);
      }
    }
  }, [cashflowCategories, expandedCategories, hasInitialExpanded]);

  return {
    matrixRows,
    grandTotals,
    expandedCategories,
    loading,
    error,
    months: MONTHS,
    currentMonth,
    cashflowCategories,
    fetchData,
    toggleCategory,
    expandAll,
    collapseAll,
    updateCell,
    exportToCSV,
  };
};

