import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BudgetYearSummary } from "@/hooks/useBudgetsList";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/utils/formatters";

interface BudgetsTableRowProps {
  budget: BudgetYearSummary;
  index: number;
  formatAmount: (amount: number, currency: string) => string;
  onView: (budget: BudgetYearSummary) => void;
}

const BudgetsTableRow = ({ 
  budget, 
  index, 
  formatAmount,
  onView
}: BudgetsTableRowProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'locked':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'mixed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Taslak';
      case 'approved':
        return 'Onaylı';
      case 'locked':
        return 'Kilitli';
      case 'mixed':
        return 'Karışık';
      default:
        return status;
    }
  };

  const getVarianceColor = (variancePercent: number) => {
    if (Math.abs(variancePercent) < 5) return 'text-green-600';
    if (Math.abs(variancePercent) < 15) return 'text-yellow-600';
    return variancePercent < 0 ? 'text-red-600' : 'text-green-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleRowClick = () => {
    navigate(`/budget/${budget.year}?currency=${budget.currency}`);
  };

  return (
    <TableRow 
      className="cursor-pointer hover:bg-blue-50 h-10"
      onClick={handleRowClick}
    >
      {/* Yıl */}
      <TableCell className="py-2 px-3">
        <div className="text-sm font-semibold text-gray-900">
          {budget.year}
        </div>
      </TableCell>

      {/* Para Birimi */}
      <TableCell className="py-2 px-3 text-sm text-gray-600">
        {budget.currency}
      </TableCell>

      {/* Toplam Bütçe */}
      <TableCell className="py-2 px-3 text-sm font-medium text-right">
        {formatAmount(budget.totalBudget, budget.currency)}
      </TableCell>

      {/* Gerçekleşen */}
      <TableCell className="py-2 px-3 text-sm font-medium text-right text-blue-600">
        {formatAmount(budget.totalActual, budget.currency)}
      </TableCell>

      {/* Kalan */}
      <TableCell className="py-2 px-3 text-sm font-medium text-right">
        <span className={budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatAmount(budget.remaining, budget.currency)}
        </span>
      </TableCell>

      {/* Sapma % */}
      <TableCell className="py-2 px-3 text-sm font-medium text-right">
        <span className={getVarianceColor(budget.variancePercent)}>
          {budget.variancePercent >= 0 ? '+' : ''}{budget.variancePercent.toFixed(1)}%
        </span>
      </TableCell>

      {/* Durum */}
      <TableCell className="py-2 px-2 text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(budget.status)}`}>
          {getStatusLabel(budget.status)}
        </span>
      </TableCell>

      {/* Oluşturma Tarihi */}
      <TableCell className="py-2 px-2 text-center text-xs text-gray-600">
        {formatDate(budget.createdAt)}
      </TableCell>

      {/* İşlemler */}
      <TableCell className="py-2 px-2">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick();
            }}
            className="h-8 w-8"
            title="Detayları Görüntüle"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8"
                title="Daha Fazla"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handleRowClick();
              }}>
                Detayları Görüntüle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                navigate(`/budget/entry?year=${budget.year}&currency=${budget.currency}`);
              }}>
                Bütçe Düzenle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BudgetsTableRow;

