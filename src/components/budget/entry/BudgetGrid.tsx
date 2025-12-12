import React, { useState, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronDown,
  Check,
  X,
  Edit2
} from "lucide-react";
import { useBudgetMatrix, MatrixRow } from "@/hooks/useBudgetMatrix";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { cn } from "@/lib/utils";

interface BudgetGridProps {
  filters: BudgetFiltersState;
  onDataChange?: () => void;
}

const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const BudgetGrid = ({ filters, onDataChange }: BudgetGridProps) => {
  const {
    matrixRows,
    grandTotals,
    expandedCategories,
    loading,
    currentMonth,
    toggleCategory,
    updateCell,
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
    field: "budget_amount" | "actual_amount" | "forecast_amount";
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleCellClick = (
    row: MatrixRow,
    month: number,
    field: "budget_amount" | "actual_amount" | "forecast_amount"
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
      onDataChange?.();
    } catch (error) {
      console.error("Save error:", error);
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

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const renderCell = (row: MatrixRow, month: number, field: "budget_amount" | "actual_amount" | "forecast_amount" = "budget_amount") => {
    const cell = row.months[month] || {
      budget_amount: 0,
      actual_amount: 0,
      forecast_amount: 0,
      variance: 0,
      variancePercent: 0,
    };

    const isEditing = editingCell &&
      editingCell.category === row.category &&
      editingCell.subcategory === row.subcategory &&
      editingCell.month === month &&
      editingCell.field === field;

    const isPastMonth = month <= currentMonth;
    const isCurrentMonth = month === currentMonth;

    if (isEditing) {
      return (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 w-24 text-xs"
            step="0.01"
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

    const value = cell[field];
    const displayValue = value > 0 ? formatAmount(value) : "-";

    return (
      <div
        className={cn(
          "text-center py-1 px-1 rounded cursor-pointer transition-colors text-xs",
          row.isSubcategory && "hover:bg-slate-100",
          isCurrentMonth && "ring-1 ring-blue-200",
          value === 0 && "text-gray-400"
        )}
        onClick={() => row.isSubcategory && handleCellClick(row, month, field)}
      >
        <div className="font-medium text-slate-800">
          {displayValue}
        </div>
      </div>
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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b-2 border-slate-200 sticky top-0 z-30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 bg-gradient-to-r from-slate-50 to-slate-100/50 z-20 w-[200px] font-semibold text-xs text-slate-900 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-3">
              Kategori
            </TableHead>
            {MONTHS_SHORT.map((month, index) => (
              <TableHead
                key={index}
                className={cn(
                  "text-center w-[100px] font-medium text-xs text-slate-700 py-2 px-1 border-r border-slate-200/50",
                  index + 1 === currentMonth && "bg-blue-50"
                )}
              >
                {month}
              </TableHead>
            ))}
            <TableHead className="text-center w-[100px] font-semibold text-xs text-slate-900 bg-slate-100/50 py-2 px-1">
              Toplam
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
                    "sticky left-0 z-10 font-medium text-xs border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-3",
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
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700 text-xs">
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
                    {renderCell(row, monthIndex + 1, "budget_amount")}
                  </TableCell>
                ))}

                {/* Total Cell */}
                <TableCell className="text-center py-2 px-1 bg-slate-50/50">
                  <div className="text-xs font-semibold text-slate-900">
                    {formatAmount(row.total.budget_amount)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}

          {/* Grand Total Row */}
          <TableRow className="bg-gradient-to-r from-blue-600 to-blue-700 font-bold border-t-2 border-blue-800">
            <TableCell className="sticky left-0 bg-gradient-to-r from-blue-600 to-blue-700 z-10 text-white border-r border-blue-500 shadow-[2px_0_4px_rgba(0,0,0,0.1)] py-2 px-3 text-xs">
              TOPLAM
            </TableCell>
            {MONTHS_SHORT.map((_, monthIndex) => (
              <TableCell key={monthIndex} className="text-center text-white py-2 px-1 border-r border-blue-500/50">
                <div className="text-xs font-semibold">
                  {formatAmount(grandTotals.months[monthIndex + 1]?.budget_amount || 0)}
                </div>
              </TableCell>
            ))}
            <TableCell className="text-center text-white py-2 px-1 bg-blue-800/50">
              <div className="text-xs font-bold">
                {formatAmount(grandTotals.total.budget_amount)}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default BudgetGrid;

