import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useBudgetMatrix, MatrixRow } from "@/hooks/useBudgetMatrix";
import { BudgetFiltersState } from "@/pages/BudgetManagement";
import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

interface VarianceTableProps {
  filters: BudgetFiltersState;
}

const MONTHS_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const VarianceTable = ({ filters }: VarianceTableProps) => {
  const {
    matrixRows,
    grandTotals,
    loading,
    currentMonth,
  } = useBudgetMatrix({
    year: filters.year,
    currency: filters.currency,
    department_id: filters.department === "all" ? undefined : filters.department,
    showActual: true,
    showForecast: true,
    showVariance: true,
  });

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
                  "text-center w-[120px] font-medium text-xs text-slate-700 py-2 px-1 border-r border-slate-200/50",
                  index + 1 === currentMonth && "bg-blue-50"
                )}
              >
                {month}
              </TableHead>
            ))}
            <TableHead className="text-center w-[120px] font-semibold text-xs text-slate-900 bg-slate-100/50 py-2 px-1">
              Toplam Varyans
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrixRows.filter(r => !r.isSubcategory).map((row, rowIndex) => {
            const isEven = rowIndex % 2 === 0;

            return (
              <TableRow
                key={row.category}
                className={cn(
                  "hover:bg-slate-50/80 transition-colors border-b border-slate-100",
                  isEven ? "bg-white" : "bg-slate-50/20"
                )}
              >
                <TableCell
                  className={cn(
                    "sticky left-0 z-10 font-medium text-xs border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.05)] py-2 px-3",
                    isEven ? "bg-white" : "bg-slate-50/20"
                  )}
                >
                  <span className="font-semibold text-slate-900">{row.category}</span>
                </TableCell>

                {MONTHS_SHORT.map((_, monthIndex) => {
                  const month = monthIndex + 1;
                  const cell = row.months[month] || {
                    budget_amount: 0,
                    actual_amount: 0,
                    forecast_amount: 0,
                    variance: 0,
                    variancePercent: 0,
                  };

                  const isPastMonth = month <= currentMonth;
                  const varianceColor = getVarianceColor(cell.variance, cell.variancePercent);
                  const varianceIcon = getVarianceIcon(cell.variance, cell.variancePercent);

                  return (
                    <TableCell
                      key={monthIndex}
                      className={cn(
                        "text-center py-2 px-1 border-r border-slate-200/50",
                        month === currentMonth && "bg-blue-50/50"
                      )}
                    >
                      {isPastMonth && cell.budget_amount > 0 ? (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-800">
                            {formatAmount(cell.budget_amount)}
                          </div>
                          <div className="text-[10px] text-slate-600">
                            Gerçek: {formatAmount(cell.actual_amount)}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 border flex items-center justify-center gap-1",
                              varianceColor
                            )}
                          >
                            {varianceIcon}
                            {cell.variancePercent.toFixed(1)}%
                          </Badge>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">-</div>
                      )}
                    </TableCell>
                  );
                })}

                <TableCell className="text-center py-2 px-1 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-900">
                      {formatAmount(row.total.variance)}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 border",
                        getVarianceColor(row.total.variance, row.total.variancePercent)
                      )}
                    >
                      {row.total.variancePercent.toFixed(1)}%
                    </Badge>
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
            {MONTHS_SHORT.map((_, monthIndex) => {
              const month = monthIndex + 1;
              const cell = grandTotals.months[month] || {
                budget_amount: 0,
                actual_amount: 0,
                forecast_amount: 0,
                variance: 0,
                variancePercent: 0,
              };
              const isPastMonth = month <= currentMonth;

              return (
                <TableCell key={monthIndex} className="text-center text-white py-2 px-1 border-r border-blue-500/50">
                  {isPastMonth ? (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold">
                        {formatAmount(cell.variance)}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {cell.variancePercent.toFixed(1)}%
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs opacity-60">-</div>
                  )}
                </TableCell>
              );
            })}
            <TableCell className="text-center text-white py-2 px-1 bg-blue-800/50">
              <div className="space-y-1">
                <div className="text-xs font-bold">
                  {formatAmount(grandTotals.total.variance)}
                </div>
                <div className="text-[10px] opacity-80">
                  {grandTotals.total.variancePercent.toFixed(1)}%
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default VarianceTable;

