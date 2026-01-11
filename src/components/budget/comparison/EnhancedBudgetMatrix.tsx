import React, { useState } from "react";
import { logger } from '@/utils/logger';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ChevronRight, 
  ChevronDown, 
  Download, 
  Expand, 
  Minimize2,
  Edit2,
  Check,
  X,
  Plus,
  Calculator,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useBudgetMatrix, MatrixCell, MatrixRow } from "@/hooks/useBudgetMatrix";
import { cn } from "@/lib/utils";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";

interface EnhancedBudgetMatrixProps {
  filters: BudgetFiltersState;
  onAddBudget?: (category: string, month: number) => void;
  showSubcategories?: boolean;
  editable?: boolean;
}

const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const EnhancedBudgetMatrix = ({ 
  filters, 
  onAddBudget,
  showSubcategories = true,
  editable = true
}: EnhancedBudgetMatrixProps) => {
  const {
    matrixRows,
    grandTotals,
    expandedCategories,
    loading,
    months,
    currentMonth,
    cashflowCategories,
    toggleCategory,
    expandAll,
    collapseAll,
    updateCell,
    exportToCSV,
  } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: true,
    showVariance: true,
  });

  const [editingCell, setEditingCell] = useState<{
    category: string;
    subcategory: string | null;
    month: number;
    field: "budget_amount" | "actual_amount";
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  
  // Section collapse states
  const [isIncomeSectionExpanded, setIsIncomeSectionExpanded] = useState(true);
  const [isExpenseSectionExpanded, setIsExpenseSectionExpanded] = useState(true);
  const [hasUserCollapsedAll, setHasUserCollapsedAll] = useState(false);

  const getCurrencySymbol = () => {
    switch (filters.currency) {
      case "USD": return "$";
      case "EUR": return "€";
      default: return "₺";
    }
  };

  const formatAmount = (amount: number) => {
    const symbol = getCurrencySymbol();
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  };

  const getVarianceColor = (variance: number, percent: number) => {
    if (Math.abs(percent) < 5) return "text-green-600 bg-green-50 border-green-200";
    if (Math.abs(percent) < 15) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return variance < 0 ? "text-red-600 bg-red-50 border-red-200" : "text-green-600 bg-green-50 border-green-200";
  };

  const getVarianceIcon = (variance: number, percent: number) => {
    if (Math.abs(percent) < 5) return null;
    if (Math.abs(percent) < 15) return <AlertTriangle className="h-3 w-3" />;
    return variance < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />;
  };

  const handleCellClick = (
    row: MatrixRow,
    month: number,
    field: "budget_amount" | "actual_amount"
  ) => {
    if (editable && row.isSubcategory) {
      const cell = row.months[month];
      setEditingCell({
        category: row.category,
        subcategory: row.subcategory,
        month,
        field,
      });
      setEditValue(cell?.[field]?.toString() || "0");
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    try {
      await updateCell(
        editingCell.category,
        editingCell.subcategory,
        editingCell.month,
        editingCell.field,
        parseFloat(editValue) || 0
      );
    } catch (error) {
      logger.error("Save error:", error);
    }
    
    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave();
    } else if (e.key === "Escape") {
      handleCellCancel();
    }
  };

  const renderCell = (row: MatrixRow, month: number) => {
    const cell = row.months[month] || {
      budget_amount: 0,
      actual_amount: 0,
      variance: 0,
      variancePercent: 0,
    };

    const isEditing = editingCell &&
      editingCell.category === row.category &&
      editingCell.subcategory === row.subcategory &&
      editingCell.month === month;

    const isPastMonth = month <= currentMonth;
    const isCurrentMonth = month === currentMonth;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 w-20 text-xs"
            autoFocus
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCellSave}>
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCellCancel}>
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      );
    }

    // Main category cells - show only totals
    if (!row.isSubcategory) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "text-center py-0 px-1 rounded",
                  isCurrentMonth && "ring-1 ring-blue-200"
                )}
              >
                <div className="text-[11px] font-semibold text-slate-900 leading-none">
                  {formatAmount(cell.budget_amount)}
                </div>
                {isPastMonth && cell.actual_amount > 0 && (
                  <>
                    <div className="text-[9px] text-slate-600 leading-none">
                      {formatAmount(cell.actual_amount)}
                    </div>
                    {cell.budget_amount > 0 && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[8px] px-0.5 py-0 mt-0 flex items-center justify-center gap-0.5 border leading-none",
                          getVarianceColor(cell.variance, cell.variancePercent)
                        )}
                      >
                        {getVarianceIcon(cell.variance, cell.variancePercent)}
                        {cell.variancePercent.toFixed(0)}%
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <div className="space-y-1">
                <div>Bütçe: {formatAmount(cell.budget_amount)}</div>
                <div>Gerçekleşen: {formatAmount(cell.actual_amount)}</div>
                <div>Varyans: {formatAmount(cell.variance)} ({cell.variancePercent.toFixed(1)}%)</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Subcategory cells - editable with enhanced display
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "text-center py-0 px-1 rounded transition-colors",
                editable && "cursor-pointer hover:bg-slate-100",
                isCurrentMonth && "ring-1 ring-blue-200"
              )}
              onClick={() => editable && handleCellClick(row, month, "budget_amount")}
            >
              <div className="text-[11px] font-medium text-slate-800 leading-none">
                {formatAmount(cell.budget_amount)}
              </div>
              {isPastMonth && cell.actual_amount > 0 && (
                <>
                  <div className="text-[9px] text-slate-600 leading-tight">
                    Gerçek: {formatAmount(cell.actual_amount)}
                  </div>
                  {cell.budget_amount > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px] px-0.5 py-0 mt-0 flex items-center justify-center gap-0.5 border leading-tight",
                        getVarianceColor(cell.variance, cell.variancePercent)
                      )}
                    >
                      {getVarianceIcon(cell.variance, cell.variancePercent)}
                      {cell.variancePercent.toFixed(0)}%
                    </Badge>
                  )}
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <div className="space-y-1">
              <div>Bütçe: {formatAmount(cell.budget_amount)}</div>
              <div>Gerçekleşen: {formatAmount(cell.actual_amount)}</div>
              <div>Varyans: {formatAmount(cell.variance)} ({cell.variancePercent.toFixed(1)}%)</div>
              {editable && <div className="text-[10px] italic text-muted-foreground mt-1">Düzenlemek için tıkla</div>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter rows based on showSubcategories prop
  const allDisplayRows = showSubcategories 
    ? matrixRows 
    : matrixRows.filter(r => !r.isSubcategory);

  // Separate income and expense rows
  const incomeRows = allDisplayRows.filter(row => {
    const cashflowCategory = cashflowCategories?.find((c: any) => c.name === row.category);
    return cashflowCategory?.type === "income";
  });
  
  const expenseRows = allDisplayRows.filter(row => {
    const cashflowCategory = cashflowCategories?.find((c: any) => c.name === row.category);
    return cashflowCategory?.type === "expense" || !cashflowCategory; // Default to expense if not found
  });

  // Calculate totals for income and expense sections
  const calculateSectionTotals = (rows: typeof allDisplayRows) => {
    const totals: Record<number, { budget: number; actual: number }> = {};
    const sectionTotal = { budget: 0, actual: 0 };
    const sectionYTD = { budget: 0, actual: 0 };

    // Only count main categories (not subcategories)
    const mainRows = rows.filter(r => !r.isSubcategory);

    for (let month = 1; month <= 12; month++) {
      totals[month] = { budget: 0, actual: 0 };
      mainRows.forEach(row => {
        const cell = row.months[month];
        if (cell) {
          totals[month].budget += cell.budget_amount || 0;
          totals[month].actual += cell.actual_amount || 0;
          sectionTotal.budget += cell.budget_amount || 0;
          sectionTotal.actual += cell.actual_amount || 0;
          if (month <= currentMonth) {
            sectionYTD.budget += cell.budget_amount || 0;
            sectionYTD.actual += cell.actual_amount || 0;
          }
        }
      });
    }

    return { totals, sectionTotal, sectionYTD };
  };

  const incomeTotals = calculateSectionTotals(incomeRows);
  const expenseTotals = calculateSectionTotals(expenseRows);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 p-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md text-white">
              <Calculator className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-base font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Detaylı Bütçe ve Varyans Matrisi
              </h2>
              <p className="text-[10px] text-slate-600">
                {filters.year} yılı - Bütçe, Gerçekleşen ve Varyans Detayları
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {showSubcategories && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const allExpanded = isIncomeSectionExpanded && isExpenseSectionExpanded && expandedCategories.size > 0;
                  if (allExpanded) {
                    // Tümünü kapat
                    setIsIncomeSectionExpanded(false);
                    setIsExpenseSectionExpanded(false);
                    collapseAll();
                    setHasUserCollapsedAll(true);
                  } else {
                    // Tümünü aç
                    setIsIncomeSectionExpanded(true);
                    setIsExpenseSectionExpanded(true);
                    expandAll();
                    setHasUserCollapsedAll(false);
                  }
                }} 
                className="h-7 text-xs px-2"
              >
                {isIncomeSectionExpanded && isExpenseSectionExpanded && expandedCategories.size > 0 ? (
                  <>
                    <Minimize2 className="h-3 w-3 mr-1" />
                    Tümünü Kapat
                  </>
                ) : (
                  <>
                    <Expand className="h-3 w-3 mr-1" />
                    Tümünü Aç
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-7 text-xs px-2">
              <Download className="h-3 w-3 mr-1" />
              Excel
            </Button>
            {onAddBudget && (
              <Button size="sm" className="h-7 text-xs px-2" onClick={() => onAddBudget("", 0)}>
                <Plus className="h-3 w-3 mr-1" />
                Bütçe Ekle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b-2 border-slate-200 sticky top-0 z-30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 bg-gradient-to-r from-slate-50 to-slate-100/50 z-20 w-[250px] font-semibold text-xs text-slate-900 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-1 px-2">
                Kategori
              </TableHead>
              {MONTHS_SHORT.map((month, index) => (
                <TableHead
                  key={index}
                  className={cn(
                    "text-center w-[110px] font-medium text-[10px] text-slate-700 py-1 px-1 border-r border-slate-200/50",
                    index + 1 === currentMonth && "bg-blue-50"
                  )}
                >
                  {month}
                </TableHead>
              ))}
              <TableHead className="text-center w-[110px] font-semibold text-[10px] text-slate-900 bg-slate-100/50 py-1 px-1 border-r border-slate-200">
                Toplam
              </TableHead>
              <TableHead className="text-center w-[110px] font-semibold text-[10px] text-slate-900 bg-slate-100/50 py-1 px-1">
                YTD
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* GELİRLER Başlığı */}
            {incomeRows.length > 0 && (
              <TableRow className="h-8 bg-gradient-to-r from-green-100 to-green-50 border-b-2 border-green-200 cursor-pointer hover:from-green-200 hover:to-green-100 transition-colors">
                <TableCell 
                  colSpan={15}
                  className="sticky left-0 z-10 font-bold text-sm text-green-900 bg-gradient-to-r from-green-100 to-green-50 border-r border-green-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-3"
                  onClick={() => {
                    const newState = !isIncomeSectionExpanded;
                    setIsIncomeSectionExpanded(newState);
                    // Eğer kullanıcı daha önce tümünü kapatmışsa, bölümü açtığında alt kategorileri açma
                    if (newState && hasUserCollapsedAll) {
                      // Alt kategorileri açma, sadece bölümü aç
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isIncomeSectionExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>📈 GELİRLER</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Gelir Kategorileri */}
            {isIncomeSectionExpanded && incomeRows.map((row, rowIndex) => {
              const isExpanded = expandedCategories.has(row.category);
              const isEven = rowIndex % 2 === 0;
              const cashflowCategory = cashflowCategories?.find((c: any) => c.name === row.category);
              const isIncomeCategory = cashflowCategory?.type === "income" && !row.isSubcategory;

              return (
                <TableRow
                  key={`${row.category}-${row.subcategory || "main"}`}
                  className={cn(
                    "h-7 hover:bg-slate-50/80 transition-colors border-b border-slate-100",
                    row.isSubcategory 
                      ? "bg-slate-50/40" 
                      : isIncomeCategory 
                        ? "bg-green-50/30" 
                        : isEven 
                          ? "bg-white" 
                          : "bg-slate-50/20"
                  )}
                >
                  {/* Category Name */}
                  <TableCell
                    className={cn(
                      "sticky left-0 z-10 font-medium text-xs border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-1 px-2",
                      row.isSubcategory 
                        ? "bg-slate-50/40" 
                        : isIncomeCategory 
                          ? "bg-green-50/30" 
                          : isEven 
                            ? "bg-white" 
                            : "bg-slate-50/20"
                    )}
                  >
                    {!row.isSubcategory ? (
                      <button
                        onClick={() => showSubcategories && toggleCategory(row.category)}
                        className={cn(
                          "flex items-center gap-1.5 transition-colors w-full text-left group",
                          showSubcategories && "hover:text-blue-600"
                        )}
                        disabled={!showSubcategories}
                      >
                        {showSubcategories && (
                          <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </div>
                        )}
                        <span className="font-semibold text-slate-900 group-hover:text-blue-700 text-xs">
                          {row.category}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 pl-6">
                        <span className="text-slate-400 text-[10px]">└</span>
                        <span className="text-slate-700 text-xs">{row.subcategory}</span>
                        {editable && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                            <Edit2 className="h-2 w-2 mr-0.5" />
                            Düzenle
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Month Cells */}
                  {MONTHS_SHORT.map((_, monthIndex) => (
                    <TableCell
                      key={monthIndex}
                      className={cn(
                        "text-center py-1 px-1 border-r border-slate-200/50",
                        monthIndex + 1 === currentMonth && "bg-blue-50/50"
                      )}
                    >
                      {renderCell(row, monthIndex + 1)}
                    </TableCell>
                  ))}

                  {/* Total Cell */}
                  <TableCell className="text-center py-1 px-1 bg-slate-50/50 border-r border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-900 leading-none">
                      {formatAmount(row.total.budget_amount)}
                    </div>
                    {row.total.actual_amount > 0 && (
                      <>
                        <div className="text-[9px] text-slate-600 leading-none">
                          {formatAmount(row.total.actual_amount)}
                        </div>
                        {row.total.budget_amount > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] px-0.5 py-0 mt-0 inline-flex items-center gap-0.5 border leading-none",
                              getVarianceColor(row.total.variance, row.total.variancePercent)
                            )}
                          >
                            {getVarianceIcon(row.total.variance, row.total.variancePercent)}
                            {row.total.variancePercent.toFixed(1)}%
                          </Badge>
                        )}
                      </>
                    )}
                  </TableCell>

                  {/* YTD Cell */}
                  <TableCell className="text-center py-1 px-1 bg-slate-50/50">
                    <div className="text-[11px] font-semibold text-slate-900 leading-none">
                      {formatAmount(row.ytd.budget_amount)}
                    </div>
                    {row.ytd.actual_amount > 0 && (
                      <>
                        <div className="text-[9px] text-slate-600 leading-none">
                          {formatAmount(row.ytd.actual_amount)}
                        </div>
                        {row.ytd.budget_amount > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] px-0.5 py-0 mt-0 inline-flex items-center gap-0.5 border leading-none",
                              getVarianceColor(row.ytd.variance, row.ytd.variancePercent)
                            )}
                          >
                            {getVarianceIcon(row.ytd.variance, row.ytd.variancePercent)}
                            {row.ytd.variancePercent.toFixed(1)}%
                          </Badge>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Gelir Toplam Satırı */}
            {incomeRows.length > 0 && (
              <TableRow className="h-7 bg-gradient-to-r from-green-600/20 to-green-500/20 font-semibold border-t-2 border-green-300 border-b-2 border-green-300">
                <TableCell className="sticky left-0 bg-gradient-to-r from-green-600/20 to-green-500/20 z-10 text-green-900 border-r border-green-300 shadow-[2px_0_4px_rgba(0,0,0,0.1)] py-1 px-2 text-xs font-bold">
                  GELİR TOPLAMI
                </TableCell>
                {MONTHS_SHORT.map((_, monthIndex) => {
                  const month = monthIndex + 1;
                  const cell = incomeTotals.totals[month] || { budget: 0, actual: 0 };
                  const isPastMonth = month <= currentMonth;

                  return (
                    <TableCell key={monthIndex} className="text-center text-green-900 py-1 px-1 border-r border-green-300/50">
                      <div className="text-[11px] font-semibold leading-none">
                        {formatAmount(cell.budget)}
                      </div>
                      {isPastMonth && cell.actual > 0 && (
                        <div className="text-[9px] opacity-90 leading-none">
                          {formatAmount(cell.actual)}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center text-green-900 py-1 px-1 bg-green-600/10 border-r border-green-300">
                  <div className="text-[11px] font-bold leading-none">
                    {formatAmount(incomeTotals.sectionTotal.budget)}
                  </div>
                  {incomeTotals.sectionTotal.actual > 0 && (
                    <div className="text-[9px] opacity-90 leading-tight">
                      {formatAmount(incomeTotals.sectionTotal.actual)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center text-green-900 py-1 px-1 bg-green-600/10">
                  <div className="text-[11px] font-bold leading-none">
                    {formatAmount(incomeTotals.sectionYTD.budget)}
                  </div>
                  {incomeTotals.sectionYTD.actual > 0 && (
                    <div className="text-[9px] opacity-90 leading-tight">
                      {formatAmount(incomeTotals.sectionYTD.actual)}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}

            {/* GİDERLER Başlığı */}
            {expenseRows.length > 0 && (
              <TableRow className="h-8 bg-gradient-to-r from-red-100 to-red-50 border-b-2 border-red-200 border-t-4 border-red-300 cursor-pointer hover:from-red-200 hover:to-red-100 transition-colors">
                <TableCell 
                  colSpan={15}
                  className="sticky left-0 z-10 font-bold text-sm text-red-900 bg-gradient-to-r from-red-100 to-red-50 border-r border-red-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-3"
                  onClick={() => {
                    const newState = !isExpenseSectionExpanded;
                    setIsExpenseSectionExpanded(newState);
                    // Eğer kullanıcı daha önce tümünü kapatmışsa, bölümü açtığında alt kategorileri açma
                    if (newState && hasUserCollapsedAll) {
                      // Alt kategorileri açma, sadece bölümü aç
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isExpenseSectionExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>📉 GİDERLER</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Gider Kategorileri */}
            {isExpenseSectionExpanded && expenseRows.map((row, rowIndex) => {
              const isExpanded = expandedCategories.has(row.category);
              const isEven = rowIndex % 2 === 0;
              const cashflowCategory = cashflowCategories?.find((c: any) => c.name === row.category);
              const isIncomeCategory = false; // This is expense section

              return (
                <TableRow
                  key={`${row.category}-${row.subcategory || "main"}`}
                  className={cn(
                    "h-7 hover:bg-slate-50/80 transition-colors border-b border-slate-100",
                    row.isSubcategory 
                      ? "bg-slate-50/40" 
                      : isEven 
                        ? "bg-white" 
                        : "bg-slate-50/20"
                  )}
                >
                  {/* Category Name */}
                  <TableCell
                    className={cn(
                      "sticky left-0 z-10 font-medium text-xs border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-1 px-2",
                      row.isSubcategory 
                        ? "bg-slate-50/40" 
                        : isEven 
                          ? "bg-white" 
                          : "bg-slate-50/20"
                    )}
                  >
                    {!row.isSubcategory ? (
                      <button
                        onClick={() => showSubcategories && toggleCategory(row.category)}
                        className={cn(
                          "flex items-center gap-1.5 transition-colors w-full text-left group",
                          showSubcategories && "hover:text-blue-600"
                        )}
                        disabled={!showSubcategories}
                      >
                        {showSubcategories && (
                          <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                          </div>
                        )}
                        <span className="font-semibold text-slate-900 group-hover:text-blue-700 text-xs">
                          {row.category}
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 pl-6">
                        <span className="text-slate-400 text-[10px]">└</span>
                        <span className="text-slate-700 text-xs">{row.subcategory}</span>
                        {editable && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                            <Edit2 className="h-2 w-2 mr-0.5" />
                            Düzenle
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Month Cells */}
                  {MONTHS_SHORT.map((_, monthIndex) => (
                    <TableCell
                      key={monthIndex}
                      className={cn(
                        "text-center py-1 px-1 border-r border-slate-200/50",
                        monthIndex + 1 === currentMonth && "bg-blue-50/50"
                      )}
                    >
                      {renderCell(row, monthIndex + 1)}
                    </TableCell>
                  ))}

                  {/* Total Cell */}
                  <TableCell className="text-center py-1 px-1 bg-slate-50/50 border-r border-slate-200">
                    <div className="text-[11px] font-semibold text-slate-900 leading-none">
                      {formatAmount(row.total.budget_amount)}
                    </div>
                    {row.total.actual_amount > 0 && (
                      <>
                        <div className="text-[9px] text-slate-600 leading-none">
                          {formatAmount(row.total.actual_amount)}
                        </div>
                        {row.total.budget_amount > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] px-0.5 py-0 mt-0 inline-flex items-center gap-0.5 border leading-none",
                              getVarianceColor(row.total.variance, row.total.variancePercent)
                            )}
                          >
                            {getVarianceIcon(row.total.variance, row.total.variancePercent)}
                            {row.total.variancePercent.toFixed(1)}%
                          </Badge>
                        )}
                      </>
                    )}
                  </TableCell>

                  {/* YTD Cell */}
                  <TableCell className="text-center py-1 px-1 bg-slate-50/50">
                    <div className="text-[11px] font-semibold text-slate-900 leading-none">
                      {formatAmount(row.ytd.budget_amount)}
                    </div>
                    {row.ytd.actual_amount > 0 && (
                      <>
                        <div className="text-[9px] text-slate-600 leading-none">
                          {formatAmount(row.ytd.actual_amount)}
                        </div>
                        {row.ytd.budget_amount > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] px-0.5 py-0 mt-0 inline-flex items-center gap-0.5 border leading-none",
                              getVarianceColor(row.ytd.variance, row.ytd.variancePercent)
                            )}
                          >
                            {getVarianceIcon(row.ytd.variance, row.ytd.variancePercent)}
                            {row.ytd.variancePercent.toFixed(1)}%
                          </Badge>
                        )}
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Gider Toplam Satırı */}
            {expenseRows.length > 0 && (
              <TableRow className="h-7 bg-gradient-to-r from-red-600/20 to-red-500/20 font-semibold border-t-2 border-red-300 border-b-2 border-red-300">
                <TableCell className="sticky left-0 bg-gradient-to-r from-red-600/20 to-red-500/20 z-10 text-red-900 border-r border-red-300 shadow-[2px_0_4px_rgba(0,0,0,0.1)] py-1 px-2 text-xs font-bold">
                  GİDER TOPLAMI
                </TableCell>
                {MONTHS_SHORT.map((_, monthIndex) => {
                  const month = monthIndex + 1;
                  const cell = expenseTotals.totals[month] || { budget: 0, actual: 0 };
                  const isPastMonth = month <= currentMonth;

                  return (
                    <TableCell key={monthIndex} className="text-center text-red-900 py-1 px-1 border-r border-red-300/50">
                      <div className="text-[11px] font-semibold leading-none">
                        {formatAmount(cell.budget)}
                      </div>
                      {isPastMonth && cell.actual > 0 && (
                        <div className="text-[9px] opacity-90 leading-none">
                          {formatAmount(cell.actual)}
                        </div>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center text-red-900 py-1 px-1 bg-red-600/10 border-r border-red-300">
                  <div className="text-[11px] font-bold leading-none">
                    {formatAmount(expenseTotals.sectionTotal.budget)}
                  </div>
                  {expenseTotals.sectionTotal.actual > 0 && (
                    <div className="text-[9px] opacity-90 leading-tight">
                      {formatAmount(expenseTotals.sectionTotal.actual)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center text-red-900 py-1 px-1 bg-red-600/10">
                  <div className="text-[11px] font-bold leading-none">
                    {formatAmount(expenseTotals.sectionYTD.budget)}
                  </div>
                  {expenseTotals.sectionYTD.actual > 0 && (
                    <div className="text-[9px] opacity-90 leading-tight">
                      {formatAmount(expenseTotals.sectionYTD.actual)}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}

            {/* Grand Total Row - NET KAR */}
            <TableRow className="h-7 bg-gradient-to-r from-blue-600 to-blue-700 font-bold border-t-4 border-blue-800">
              <TableCell className="sticky left-0 bg-gradient-to-r from-blue-600 to-blue-700 z-10 text-white border-r border-blue-500 shadow-[2px_0_4px_rgba(0,0,0,0.1)] py-1 px-2 text-xs">
                TOPLAM
              </TableCell>
              {MONTHS_SHORT.map((_, monthIndex) => {
                const month = monthIndex + 1;
                const incomeCell = incomeTotals.totals[month] || { budget: 0, actual: 0 };
                const expenseCell = expenseTotals.totals[month] || { budget: 0, actual: 0 };
                const netBudget = incomeCell.budget - expenseCell.budget;
                const netActual = incomeCell.actual - expenseCell.actual;
                const netVariance = netBudget - netActual;
                const netVariancePercent = netBudget !== 0 ? (netVariance / netBudget) * 100 : 0;
                const isPastMonth = month <= currentMonth;

                return (
                  <TableCell key={monthIndex} className="text-center text-white py-1 px-1 border-r border-blue-500/50">
                    <div className="text-[11px] font-semibold leading-none">
                      {formatAmount(netBudget)}
                    </div>
                    {isPastMonth && netActual !== 0 && (
                      <>
                        <div className="text-[9px] opacity-90 leading-none">
                          {formatAmount(netActual)}
                        </div>
                        {netBudget !== 0 && (
                          <div className={cn(
                            "text-[8px] opacity-80 leading-none",
                            netVariancePercent >= 0 ? "text-green-200" : "text-red-200"
                          )}>
                            {netVariancePercent >= 0 ? "+" : ""}{netVariancePercent.toFixed(1)}%
                          </div>
                        )}
                      </>
                    )}
                  </TableCell>
                );
              })}
              <TableCell className="text-center text-white py-0.5 px-1 bg-blue-800/50 border-r border-blue-500">
                <div className="text-[11px] font-bold leading-none">
                  {formatAmount(incomeTotals.sectionTotal.budget - expenseTotals.sectionTotal.budget)}
                </div>
                {(incomeTotals.sectionTotal.actual > 0 || expenseTotals.sectionTotal.actual > 0) && (
                  <>
                    <div className="text-[9px] opacity-90 leading-tight">
                      {formatAmount(incomeTotals.sectionTotal.actual - expenseTotals.sectionTotal.actual)}
                    </div>
                    {(incomeTotals.sectionTotal.budget - expenseTotals.sectionTotal.budget) !== 0 && (
                      <div className={cn(
                        "text-[8px] opacity-80 leading-none",
                        (incomeTotals.sectionTotal.actual - expenseTotals.sectionTotal.actual) >= (incomeTotals.sectionTotal.budget - expenseTotals.sectionTotal.budget) 
                          ? "text-green-200" 
                          : "text-red-200"
                      )}>
                        {((incomeTotals.sectionTotal.actual - expenseTotals.sectionTotal.actual) - (incomeTotals.sectionTotal.budget - expenseTotals.sectionTotal.budget)) >= 0 ? "+" : ""}
                        {(((incomeTotals.sectionTotal.actual - expenseTotals.sectionTotal.actual) - (incomeTotals.sectionTotal.budget - expenseTotals.sectionTotal.budget)) / (incomeTotals.sectionTotal.budget - expenseTotals.sectionTotal.budget) * 100).toFixed(1)}%
                      </div>
                    )}
                  </>
                )}
              </TableCell>
              <TableCell className="text-center text-white py-1 px-1 bg-blue-800/50">
                <div className="text-[11px] font-bold leading-none">
                  {formatAmount(incomeTotals.sectionYTD.budget - expenseTotals.sectionYTD.budget)}
                </div>
                {(incomeTotals.sectionYTD.actual > 0 || expenseTotals.sectionYTD.actual > 0) && (
                  <>
                    <div className="text-[9px] opacity-90 leading-tight">
                      {formatAmount(incomeTotals.sectionYTD.actual - expenseTotals.sectionYTD.actual)}
                    </div>
                    {(incomeTotals.sectionYTD.budget - expenseTotals.sectionYTD.budget) !== 0 && (
                      <div className={cn(
                        "text-[8px] opacity-80 leading-none",
                        (incomeTotals.sectionYTD.actual - expenseTotals.sectionYTD.actual) >= (incomeTotals.sectionYTD.budget - expenseTotals.sectionYTD.budget) 
                          ? "text-green-200" 
                          : "text-red-200"
                      )}>
                        {((incomeTotals.sectionYTD.actual - expenseTotals.sectionYTD.actual) - (incomeTotals.sectionYTD.budget - expenseTotals.sectionYTD.budget)) >= 0 ? "+" : ""}
                        {(((incomeTotals.sectionYTD.actual - expenseTotals.sectionYTD.actual) - (incomeTotals.sectionYTD.budget - expenseTotals.sectionYTD.budget)) / (incomeTotals.sectionYTD.budget - expenseTotals.sectionYTD.budget) * 100).toFixed(1)}%
                      </div>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Footer Legend */}
      <div className="border-t border-slate-200 p-2 bg-slate-50/50">
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>Hedefte (&lt;5%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
            <span>Dikkat (5-15%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
            <span>Aşım (&gt;15%)</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span>Mevcut ay</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedBudgetMatrix;

