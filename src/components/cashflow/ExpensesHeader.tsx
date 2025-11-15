import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Receipt, TrendingUp, TrendingDown, DollarSign, Tag } from "lucide-react";
import { ExpenseItem } from "./ExpensesManager";

interface ExpensesHeaderProps {
  expenses?: ExpenseItem[];
  onAddClick: () => void;
  onCategoriesClick: () => void;
  totalAmount: number;
  startDate: Date;
  endDate: Date;
}

const ExpensesHeader = ({ 
  expenses = [], 
  onAddClick,
  onCategoriesClick,
  totalAmount,
  startDate,
  endDate
}: ExpensesHeaderProps) => {
  // İstatistikleri hesapla
  const totalCount = expenses.length;
  const incomeCount = expenses.filter(e => e.type === 'income').length;
  const expenseCount = expenses.filter(e => e.type === 'expense' || !e.type).length;
  const paidCount = expenses.filter(e => e.is_paid).length;
  const unpaidCount = expenses.filter(e => !e.is_paid).length;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-white shadow-lg">
          <Receipt className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Gelirler ve Giderler
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Tüm gelir ve gider işlemlerinizi yönetin ve kategorilere ayırın.
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam İşlem */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-orange-600 to-orange-700 text-white border border-orange-600 shadow-sm">
          <Receipt className="h-3 w-3" />
          <span className="font-bold">Toplam İşlem</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>

        {/* Gelir */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Gelir</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {incomeCount}
          </span>
        </div>

        {/* Gider */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300">
          <TrendingDown className="h-3 w-3" />
          <span className="font-medium">Gider</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {expenseCount}
          </span>
        </div>

        {/* Toplam Tutar */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
          <DollarSign className="h-3 w-3" />
          <span className="font-medium">Toplam</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
          </span>
        </div>
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onCategoriesClick}
          className="border-gray-300 hover:bg-gray-50"
        >
          <Tag className="mr-2 h-4 w-4" />
          Kategoriler
        </Button>
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 shadow-lg transition-all duration-300" 
          onClick={onAddClick}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni İşlem</span>
        </Button>
      </div>
    </div>
  );
};

export default ExpensesHeader;

