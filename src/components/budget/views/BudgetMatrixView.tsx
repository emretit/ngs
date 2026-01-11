import React, { useState, useCallback } from "react";
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
  Calculator
} from "lucide-react";
import { useBudgetMatrix, MatrixCell, MatrixRow } from "@/hooks/useBudgetMatrix";
import { cn } from "@/lib/utils";
import { BudgetFiltersState } from "@/pages/budget/BudgetDashboard";

interface BudgetMatrixViewProps {
  filters: BudgetFiltersState;
  onAddBudget?: (category: string, month: number) => void;
}

const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const BudgetMatrixView = ({ filters, onAddBudget }: BudgetMatrixViewProps) => {
  const {
    matrixRows,
    grandTotals,
    expandedCategories,
    loading,
    months,
    currentMonth,
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
    if (Math.abs(percent) < 5) return "text-green-600 bg-green-50";
    if (Math.abs(percent) < 15) return "text-yellow-600 bg-yellow-50";
    return variance < 0 ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50";
  };

  const handleCellClick = (
    row: MatrixRow,
    month: number,
    field: "budget_amount" | "actual_amount"
  ) => {
    if (row.isSubcategory) {
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

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "text-center py-1 px-1 rounded cursor-pointer transition-colors",
                row.isSubcategory && "hover:bg-slate-100",
                isCurrentMonth && "ring-1 ring-blue-200"
              )}
              onClick={() => row.isSubcategory && handleCellClick(row, month, "budget_amount")}
            >
              <div className="text-xs font-medium text-slate-800">
                {formatAmount(cell.budget_amount)}
              </div>
              {isPastMonth && cell.actual_amount > 0 && (
                <div className={cn(
                  "text-[10px] font-medium rounded px-1 mt-0.5",
                  getVarianceColor(cell.variance, cell.variancePercent)
                )}>
                  {formatAmount(cell.actual_amount)}
                </div>
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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-md text-white">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Bütçe Matrix
              </h2>
              <p className="text-xs text-slate-600">
                {filters.year} yılı bütçe detayları
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={expandAll} className="h-8">
              <Expand className="h-3.5 w-3.5 mr-1" />
              Tümünü Aç
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll} className="h-8">
              <Minimize2 className="h-3.5 w-3.5 mr-1" />
              Tümünü Kapat
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="h-8">
              <Download className="h-3.5 w-3.5 mr-1" />
              Excel
            </Button>
            {onAddBudget && (
              <Button size="sm" className="h-8" onClick={() => onAddBudget("", 0)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Bütçe Ekle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b-2 border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 bg-gradient-to-r from-slate-50 to-slate-100/50 z-20 w-[200px] font-semibold text-sm text-slate-900 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-3">
                Kategori
              </TableHead>
              {MONTHS_SHORT.map((month, index) => (
                <TableHead
                  key={index}
                  className={cn(
                    "text-center w-[80px] font-medium text-xs text-slate-700 py-2 px-1 border-r border-slate-200/50",
                    index + 1 === currentMonth && "bg-blue-50"
                  )}
                >
                  {month}
                </TableHead>
              ))}
              <TableHead className="text-center w-[90px] font-semibold text-xs text-slate-900 bg-slate-100/50 py-2 px-1 border-r border-slate-200">
                Toplam
              </TableHead>
              <TableHead className="text-center w-[90px] font-semibold text-xs text-slate-900 bg-slate-100/50 py-2 px-1">
                YTD
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrixRows.map((row, rowIndex) => {
              const isExpanded = expandedCategories.has(row.category);
              const isEven = rowIndex % 2 === 0;

              return (
                <TableRow
                  key={`${row.category}-${row.subcategory || "main"}`}
                  className={cn(
                    "hover:bg-slate-50/80 transition-colors border-b border-slate-100",
                    row.isSubcategory ? "bg-slate-50/40" : isEven ? "bg-white" : "bg-slate-50/20"
                  )}
                >
                  {/* Category/Subcategory Name */}
                  <TableCell
                    className={cn(
                      "sticky left-0 z-10 font-medium text-sm border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-3",
                      row.isSubcategory ? "bg-slate-50/40 pl-8" : isEven ? "bg-white" : "bg-slate-50/20"
                    )}
                  >
                    {row.isSubcategory ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs">└</span>
                        <span className="text-slate-700">{row.subcategory}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                          <Edit2 className="h-2.5 w-2.5 mr-0.5" />
                          Düzenle
                        </Badge>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleCategory(row.category)}
                        className="flex items-center gap-2 hover:text-blue-600 transition-colors w-full text-left group"
                      >
                        <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                        <span className="font-semibold text-slate-900 group-hover:text-blue-700">
                          {row.category}
                        </span>
                      </button>
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
                  <TableCell className="text-center py-2 px-1 bg-slate-50/50 border-r border-slate-200">
                    <div className="text-xs font-semibold text-slate-900">
                      {formatAmount(row.total.budget_amount)}
                    </div>
                    {row.total.actual_amount > 0 && (
                      <div className={cn(
                        "text-[10px] font-medium rounded px-1 mt-0.5 inline-block",
                        getVarianceColor(row.total.variance, row.total.variancePercent)
                      )}>
                        {row.total.variancePercent.toFixed(1)}%
                      </div>
                    )}
                  </TableCell>

                  {/* YTD Cell */}
                  <TableCell className="text-center py-2 px-1 bg-slate-50/50">
                    <div className="text-xs font-semibold text-slate-900">
                      {formatAmount(row.ytd.budget_amount)}
                    </div>
                    {row.ytd.actual_amount > 0 && (
                      <div className={cn(
                        "text-[10px] font-medium rounded px-1 mt-0.5 inline-block",
                        getVarianceColor(row.ytd.variance, row.ytd.variancePercent)
                      )}>
                        {formatAmount(row.ytd.actual_amount)}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {/* Grand Total Row */}
            <TableRow className="bg-gradient-to-r from-blue-600 to-blue-700 font-bold border-t-2 border-blue-800">
              <TableCell className="sticky left-0 bg-gradient-to-r from-blue-600 to-blue-700 z-10 text-white border-r border-blue-500 shadow-[2px_0_4px_rgba(0,0,0,0.1)] py-3 px-3 text-sm">
                TOPLAM
              </TableCell>
              {MONTHS_SHORT.map((_, monthIndex) => (
                <TableCell key={monthIndex} className="text-center text-white py-2 px-1 border-r border-blue-500/50">
                  <div className="text-xs font-semibold">
                    {formatAmount(grandTotals.months[monthIndex + 1]?.budget_amount || 0)}
                  </div>
                  {(grandTotals.months[monthIndex + 1]?.actual_amount || 0) > 0 && (
                    <div className="text-[10px] opacity-80">
                      {formatAmount(grandTotals.months[monthIndex + 1]?.actual_amount || 0)}
                    </div>
                  )}
                </TableCell>
              ))}
              <TableCell className="text-center text-white py-2 px-1 bg-blue-800/50 border-r border-blue-500">
                <div className="text-xs font-bold">
                  {formatAmount(grandTotals.total.budget_amount)}
                </div>
                {grandTotals.total.actual_amount > 0 && (
                  <div className="text-[10px] opacity-80">
                    {grandTotals.total.variancePercent.toFixed(1)}%
                  </div>
                )}
              </TableCell>
              <TableCell className="text-center text-white py-2 px-1 bg-blue-800/50">
                <div className="text-xs font-bold">
                  {formatAmount(grandTotals.ytd.budget_amount)}
                </div>
                {grandTotals.ytd.actual_amount > 0 && (
                  <div className="text-[10px] opacity-80">
                    {formatAmount(grandTotals.ytd.actual_amount)}
                  </div>
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Footer Legend */}
      <div className="border-t border-slate-200 p-3 bg-slate-50/50">
        <div className="flex items-center gap-4 text-xs text-slate-600">
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

export default BudgetMatrixView;

