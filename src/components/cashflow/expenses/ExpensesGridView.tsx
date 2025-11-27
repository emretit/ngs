import React, { memo } from "react";
import { FileText } from "lucide-react";
import { ExpenseItem } from "../ExpensesManager";
import ExpenseCard from "./ExpenseCard";

interface ExpensesGridViewProps {
  expenses: ExpenseItem[];
  loading: boolean;
  selectedExpenses: ExpenseItem[];
  onSelectExpense: (expense: ExpenseItem) => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (expense: ExpenseItem) => void;
  getAccountName: (type: string, id: string) => string;
}

const ExpensesGridView = memo(({
  expenses,
  loading,
  selectedExpenses,
  onSelectExpense,
  onEditExpense,
  onDeleteExpense,
  getAccountName
}: ExpensesGridViewProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Masraflar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Bu dönem için masraf kaydı bulunamadı
        </h3>
        <p className="text-gray-600 max-w-sm">
          Yeni masraf eklemek için yukarıdaki "Masraf Ekle" butonunu kullanabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {expenses.map((expense) => (
        <ExpenseCard
          key={expense.id}
          expense={expense}
          isSelected={selectedExpenses.some(e => e.id === expense.id)}
          onSelect={() => onSelectExpense(expense)}
          onEdit={() => onEditExpense(expense)}
          onDelete={() => onDeleteExpense(expense)}
          getAccountName={getAccountName}
        />
      ))}
    </div>
  );
});

ExpensesGridView.displayName = 'ExpensesGridView';

export default ExpensesGridView;

