import { useState, useMemo, useCallback } from 'react';
import { ExpenseItem } from '@/components/cashflow/ExpensesManager';

export function useExpenseFilters(expenses: ExpenseItem[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company' | 'employee'>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Search filter
      const matchesSearch = 
        searchQuery === '' || 
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.employee && 
          `${expense.employee.first_name} ${expense.employee.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by type
      if (filterType !== 'all' && expense.expense_type !== filterType) {
        return false;
      }
      
      // Filter by employee
      if (filterEmployee !== 'all' && expense.employee_id !== filterEmployee) {
        return false;
      }
      
      // Filter by category
      if (filterCategory !== 'all' && (expense.category as any)?.id !== filterCategory) {
        return false;
      }
      
      return matchesSearch;
    });
  }, [expenses, searchQuery, filterType, filterEmployee, filterCategory]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterType('all');
    setFilterEmployee('all');
    setFilterCategory('all');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    filterEmployee,
    setFilterEmployee,
    filterCategory,
    setFilterCategory,
    filteredExpenses,
    totalAmount,
    resetFilters,
  };
}

