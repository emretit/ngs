import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface Loan {
  id: string;
  loan_name: string;
  bank: string;
  amount: number;
  start_date: string;
  end_date: string;
  interest_rate: number;
  installment_amount: number;
  installment_count?: number;
  remaining_debt: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface LoansTableRowProps {
  loan: Loan;
  index: number;
  onSelect: (loan: Loan) => void;
  onEdit: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
  isLoading?: boolean;
}

export const LoansTableRow: React.FC<LoansTableRowProps> = ({
  loan,
  index,
  onSelect,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount);
  };

  // Loading state için skeleton göster
  if (isLoading || !loan) {
    return (
      <TableRow className="h-8">
        <TableCell className="py-2 px-3"><div className="h-3 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
      </TableRow>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      odenecek: { label: t("cashflow.toBePaid"), variant: "destructive" as const },
      odendi: { label: t("cashflow.paid"), variant: "default" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <Badge variant={config.variant} className="text-xs">{config.label}</Badge> : null;
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(loan);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(loan);
  };

  return (
    <TableRow
      key={loan.id}
      className="h-8 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelect(loan)}
    >
      <TableCell className="py-2 px-3">
        <span className="font-medium text-xs">{loan.loan_name}</span>
      </TableCell>
      <TableCell className="py-2 px-3">
        <span className="text-xs">{loan.bank}</span>
      </TableCell>
      <TableCell className="py-2 px-3 text-right">
        <span className="text-xs font-medium">{formatCurrency(loan.amount)}</span>
      </TableCell>
      <TableCell className="py-2 px-3 text-right">
        <span className="text-xs font-medium">{formatCurrency(loan.installment_amount)}</span>
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs">
        {loan.installment_count || '-'}
      </TableCell>
      <TableCell className="py-2 px-3 text-right text-xs">
        %{loan.interest_rate}
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs">
        {format(new Date(loan.start_date), "dd/MM/yyyy")}
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs">
        {format(new Date(loan.end_date), "dd/MM/yyyy")}
      </TableCell>
      <TableCell className="py-2 px-3 text-right">
        <span className="text-xs font-bold text-red-600">{formatCurrency(loan.remaining_debt)}</span>
      </TableCell>
      <TableCell className="text-center py-2 px-3">
        {getStatusBadge(loan.status)}
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        <div className="flex justify-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-8 w-8"
            title="Düzenle"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

