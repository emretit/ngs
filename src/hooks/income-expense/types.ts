/**
 * Income/Expense Analysis - Type Definitions
 */

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

export const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];
