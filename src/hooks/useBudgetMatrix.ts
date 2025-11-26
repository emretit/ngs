import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Budget, BudgetCategory } from "./useBudget";

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
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const currentMonth = new Date().getMonth() + 1;

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

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

      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from("budget_categories")
        .select("*")
        .order("sort_order");

      if (categoryError) throw categoryError;

      setBudgets(budgetData || []);
      setCategories(categoryData || []);
    } catch (err: any) {
      console.error("fetchData error:", err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Veriler alınırken hata oluştu: " + err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [config.year, config.currency, config.department_id, toast]);

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

    // Get unique categories from both budgets and category table
    const allCategories = new Set([
      ...Array.from(categoryBudgets.keys()),
      ...categories.filter(c => c.type === "expense").map(c => c.name),
    ]);

    allCategories.forEach((categoryName) => {
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
        const cell: MatrixCell = {
          budget_amount: monthBudgets.reduce((sum, b) => sum + Number(b.budget_amount), 0),
          actual_amount: monthBudgets.reduce((sum, b) => sum + Number(b.actual_amount), 0),
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

      // Add subcategory rows if expanded
      if (isExpanded) {
        const subcategories = new Set(
          categoryBudgetItems
            .filter(b => b.subcategory)
            .map(b => b.subcategory!)
        );

        subcategories.forEach((subcategory) => {
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
            const cell: MatrixCell = {
              id: monthBudget?.id,
              budget_amount: Number(monthBudget?.budget_amount || 0),
              actual_amount: Number(monthBudget?.actual_amount || 0),
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
  }, [budgets, categories, expandedCategories, currentMonth]);

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
      console.error("updateCell error:", err);
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

  return {
    matrixRows,
    grandTotals,
    categories,
    expandedCategories,
    loading,
    error,
    months: MONTHS,
    currentMonth,
    fetchData,
    toggleCategory,
    expandAll,
    collapseAll,
    updateCell,
    exportToCSV,
  };
};

