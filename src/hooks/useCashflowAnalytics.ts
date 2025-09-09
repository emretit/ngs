import { useState, useEffect } from "react";
import { CashflowTransaction } from "./useCashflowTransactions";

export interface CashflowSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  type: 'income' | 'expense';
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface PeriodFilter {
  startDate: string;
  endDate: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export const useCashflowAnalytics = (transactions: CashflowTransaction[]) => {
  const [summary, setSummary] = useState<CashflowSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    transactionCount: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  const calculateSummary = (filteredTransactions: CashflowTransaction[]): CashflowSummary => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      transactionCount: filteredTransactions.length,
    };
  };

  const calculateCategoryBreakdown = (filteredTransactions: CashflowTransaction[]): CategoryBreakdown[] => {
    const categoryTotals = filteredTransactions.reduce((acc, transaction) => {
      const categoryName = transaction.category?.name || 'Unknown';
      const key = `${categoryName}-${transaction.type}`;
      
      if (!acc[key]) {
        acc[key] = {
          category: categoryName,
          amount: 0,
          type: transaction.type,
        };
      }
      
      acc[key].amount += transaction.amount;
      return acc;
    }, {} as Record<string, { category: string; amount: number; type: 'income' | 'expense' }>);

    const totalByType = {
      income: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    };

    return Object.values(categoryTotals).map(item => ({
      ...item,
      percentage: totalByType[item.type] > 0 ? (item.amount / totalByType[item.type]) * 100 : 0,
    }));
  };

  const calculateMonthlyData = (filteredTransactions: CashflowTransaction[]): MonthlyData[] => {
    const monthlyTotals = filteredTransactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!acc[month]) {
        acc[month] = {
          month,
          income: 0,
          expenses: 0,
          net: 0,
        };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += transaction.amount;
      }
      
      acc[month].net = acc[month].income - acc[month].expenses;
      return acc;
    }, {} as Record<string, MonthlyData>);

    return Object.values(monthlyTotals).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  };

  const filterTransactionsByPeriod = (filter: PeriodFilter): CashflowTransaction[] => {
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  const getDefaultPeriodFilter = (): PeriodFilter => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      period: 'monthly',
    };
  };

  const updateAnalytics = (filter?: PeriodFilter) => {
    const currentFilter = filter || getDefaultPeriodFilter();
    const filteredTransactions = filterTransactionsByPeriod(currentFilter);
    
    setSummary(calculateSummary(filteredTransactions));
    setCategoryBreakdown(calculateCategoryBreakdown(filteredTransactions));
    setMonthlyData(calculateMonthlyData(filteredTransactions));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  useEffect(() => {
    updateAnalytics();
  }, [transactions]);

  return {
    summary,
    categoryBreakdown,
    monthlyData,
    updateAnalytics,
    filterTransactionsByPeriod,
    formatCurrency,
    getDefaultPeriodFilter,
  };
};