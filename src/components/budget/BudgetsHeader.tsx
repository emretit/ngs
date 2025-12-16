import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BudgetYearSummary } from "@/hooks/useBudgetsList";
import { formatCurrency } from "@/utils/formatters";

interface BudgetsHeaderProps {
  budgets?: BudgetYearSummary[];
  totalCount?: number;
  statistics?: {
    totalYears: number;
    totalBudget: number;
    totalActual: number;
    totalRemaining: number;
  };
}

const BudgetsHeader = ({ 
  budgets = [],
  totalCount: propTotalCount,
  statistics
}: BudgetsHeaderProps) => {
  const navigate = useNavigate();

  // Statistics varsa onu kullan, yoksa budgets'tan hesapla
  const totalCount = statistics?.totalYears ?? propTotalCount ?? budgets.length;
  const totalBudget = statistics?.totalBudget ?? budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalActual = statistics?.totalActual ?? budgets.reduce((sum, b) => sum + b.totalActual, 0);
  const totalRemaining = statistics?.totalRemaining ?? budgets.reduce((sum, b) => sum + b.remaining, 0);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* Sol taraf - Başlık */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
          <FileText className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Bütçe Yönetimi
          </h1>
          <p className="text-xs text-muted-foreground/70">
            Bütçelerinizi yıl bazında görüntüleyin ve yönetin.
          </p>
        </div>
      </div>
      
      {/* Orta - İstatistik Kartları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {/* Toplam yıl sayısı */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
          <Calendar className="h-3 w-3" />
          <span className="font-bold">Toplam Yıl</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {totalCount}
          </span>
        </div>

        {/* Toplam bütçe */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border border-emerald-300">
          <DollarSign className="h-3 w-3" />
          <span className="font-medium">Toplam Bütçe</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(totalBudget)}
          </span>
        </div>

        {/* Gerçekleşen */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Gerçekleşen</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(totalActual)}
          </span>
        </div>

        {/* Kalan */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 border border-amber-300">
          <FileText className="h-3 w-3" />
          <span className="font-medium">Kalan</span>
          <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
            {formatCurrency(totalRemaining)}
          </span>
        </div>
      </div>
      
      {/* Sağ taraf - Butonlar */}
      <div className="flex items-center gap-2">
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg transition-all duration-300" 
          onClick={() => navigate("/budget/entry")}
        >
          <Plus className="h-4 w-4" />
          <span>Yeni Bütçe</span>
        </Button>
      </div>
    </div>
  );
};

export default BudgetsHeader;

