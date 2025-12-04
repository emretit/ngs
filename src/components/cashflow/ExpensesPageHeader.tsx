import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Settings, CheckCircle2, Clock, Building2, User, Receipt } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { ExpenseItem } from "./ExpensesManager";

export type ExpenseViewType = "list" | "grid";

interface ExpensesPageHeaderProps {
  expenses: ExpenseItem[];
  startDate: Date;
  endDate: Date;
  onCreateExpense: () => void;
  onNavigateCategories?: () => void;
}

const ExpensesPageHeader = ({
  expenses,
  startDate,
  endDate,
  onCreateExpense,
  onNavigateCategories
}: ExpensesPageHeaderProps) => {
  // Masrafları durumlarına göre grupla
  const paidExpenses = expenses.filter(e => e.is_paid);
  const pendingExpenses = expenses.filter(e => !e.is_paid);
  const companyExpenses = expenses.filter(e => e.expense_type === 'company');
  const employeeExpenses = expenses.filter(e => e.expense_type === 'employee');

  const totalCount = expenses.length;

  // Durum kartları
  const statusCards = [
    { 
      status: 'paid', 
      icon: CheckCircle2, 
      label: 'Ödenen', 
      count: paidExpenses.length,
      color: 'bg-green-100 text-green-800 border-green-200' 
    },
    { 
      status: 'pending', 
      icon: Clock, 
      label: 'Bekleyen', 
      count: pendingExpenses.length,
      color: 'bg-amber-100 text-amber-800 border-amber-200' 
    },
    { 
      status: 'company', 
      icon: Building2, 
      label: 'Şirket', 
      count: companyExpenses.length,
      color: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    { 
      status: 'employee', 
      icon: User, 
      label: 'Çalışan', 
      count: employeeExpenses.length,
      color: 'bg-purple-100 text-purple-800 border-purple-200' 
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white shadow-lg">
          <Receipt className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Masraflar
          </h1>
          <p className="text-xs text-muted-foreground/70">
            {format(startDate, 'dd MMM', { locale: tr })} - {format(endDate, 'dd MMM yyyy', { locale: tr })} • {totalCount} kayıt
          </p>
        </div>
      </div>
      
      {/* Orta - Durum Kartları ve Toplam */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam masraf sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-600 shadow-sm">
          <span className="font-bold">Toplam</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>
        
        {/* Durum kartları */}
        {statusCards.map(({ status, icon: Icon, label, count, color }) => {
          return (
            <div
              key={status}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm ${color}`}
            >
              <Icon className="h-3 w-3" />
              <span className="font-medium">{label}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        {onNavigateCategories && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateCategories}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Kategoriler</span>
          </Button>
        )}
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg transition-all duration-300" 
          onClick={onCreateExpense}
        >
          <Plus className="h-4 w-4" />
          <span>Masraf Ekle</span>
        </Button>
      </div>
    </div>
  );
};

export default ExpensesPageHeader;

