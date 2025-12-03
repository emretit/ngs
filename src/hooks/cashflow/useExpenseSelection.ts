import { useState, useCallback, useEffect } from 'react';
import { ExpenseItem } from '@/components/cashflow/ExpensesManager';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useExpenseSelection(filteredExpenses: ExpenseItem[], onRefetch: () => void) {
  const [selectedExpenses, setSelectedExpenses] = useState<ExpenseItem[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const handleSelectExpense = useCallback((expense: ExpenseItem) => {
    setSelectedExpenses(prev => {
      const isSelected = prev.some(e => e.id === expense.id);
      if (isSelected) {
        return prev.filter(e => e.id !== expense.id);
      } else {
        return [...prev, expense];
      }
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedExpenses(filteredExpenses);
      setIsAllSelected(true);
    } else {
      setSelectedExpenses([]);
      setIsAllSelected(false);
    }
  }, [filteredExpenses]);

  const handleClearSelection = useCallback(() => {
    setSelectedExpenses([]);
    setIsAllSelected(false);
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedExpenses.length === 0) return;

    switch (action) {
      case 'delete':
        try {
          const ids = selectedExpenses.map(e => e.id);
          const { error } = await supabase
            .from('expenses')
            .delete()
            .in('id', ids);

          if (error) throw error;

          toast.success(`${selectedExpenses.length} işlem başarıyla silindi`);

          setSelectedExpenses([]);
          setIsAllSelected(false);
          onRefetch();
        } catch (error: any) {
          toast.error("İşlemler silinirken bir hata oluştu");
        }
        break;
      case 'export':
        toast.info("Excel export özelliği yakında eklenecek");
        break;
      default:
        break;
    }
  }, [selectedExpenses, toast, onRefetch]);

  // Update isAllSelected when filteredExpenses change
  useEffect(() => {
    if (filteredExpenses.length > 0) {
      setIsAllSelected(selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedExpenses, filteredExpenses]);

  const isSelected = useCallback((expense: ExpenseItem) => {
    return selectedExpenses.some(e => e.id === expense.id);
  }, [selectedExpenses]);

  return {
    selectedExpenses,
    isAllSelected,
    handleSelectExpense,
    handleSelectAll,
    handleClearSelection,
    handleBulkAction,
    isSelected,
  };
}

