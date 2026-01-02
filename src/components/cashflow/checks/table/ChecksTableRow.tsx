import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Check } from "@/types/check";
import { Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/formatters";
import { getStatusConfig } from "@/utils/cashflowUtils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChecksTableRowProps {
  check: Check;
  index: number;
  onSelect: (check: Check) => void;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onQuickAction?: (check: Check) => void;
  showCheckType?: boolean;
  showPayee?: boolean;
  isLoading?: boolean;
}

export const ChecksTableRow: React.FC<ChecksTableRowProps> = ({
  check,
  index,
  onSelect,
  onEdit,
  onDelete,
  onQuickAction,
  showCheckType = false,
  showPayee = false,
  isLoading = false
}) => {
  // Loading state için skeleton göster
  if (isLoading || !check) {
    return (
      <TableRow className="h-8">
        <TableCell className="py-2 px-3"><div className="h-3 w-32 bg-gray-200 rounded animate-pulse" /></TableCell>
        {showCheckType && <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>}
        <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
        {showPayee && <TableCell className="py-2 px-3"><div className="h-3 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>}
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-16 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-3 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
        <TableCell className="py-2 px-3"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></TableCell>
      </TableRow>
    );
  }

  const checkTypeValue = check.check_type || "incoming";
  const statusConfig = getStatusConfig(check.status);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(check);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(check.id);
  };

  const handleQuickAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickAction?.(check);
  };

  return (
    <TableRow
      key={check.id}
      className="h-8 cursor-pointer transition-colors hover:bg-gray-50"
      onClick={() => onSelect(check)}
    >
      <TableCell className="py-2 px-3">
        <span className="font-medium text-xs">#{check.check_number}</span>
      </TableCell>
      {showCheckType && (
        <TableCell className="py-2 px-3">
          <Badge 
            variant="outline" 
            className={cn(
              "text-[10px] px-1.5 py-0",
              checkTypeValue === "incoming" 
                ? "bg-green-50 text-green-700 border-green-200" 
                : "bg-blue-50 text-blue-700 border-blue-200"
            )}
          >
            {checkTypeValue === "incoming" ? "Gelen" : "Giden"}
          </Badge>
        </TableCell>
      )}
      <TableCell className="py-2 px-3">
        <span className="text-xs" title={check.issuer_name || "-"}>
          {check.issuer_name || "-"}
        </span>
      </TableCell>
      {showPayee && (
        <TableCell className="py-2 px-3">
          <span className="text-xs" title={check.payee || "-"}>
            {check.payee || "-"}
          </span>
        </TableCell>
      )}
      <TableCell className="py-2 px-3">
        <span className="text-xs" title={check.bank || "-"}>
          {check.bank || "-"}
        </span>
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs font-medium">
        {format(new Date(check.due_date), "dd/MM/yyyy")}
      </TableCell>
      <TableCell className="text-center py-2 px-3 text-xs font-medium">
        {formatCurrency(check.amount)}
      </TableCell>
      <TableCell className="text-center py-2 px-3">
        <Badge variant={statusConfig.variant} className="text-xs">
          {statusConfig.label}
        </Badge>
      </TableCell>
      <TableCell className="py-2 px-3 text-center">
        <div className="flex justify-center space-x-2">
          {onQuickAction && 
           ((checkTypeValue === "incoming" && check.status === "portfoyde") ||
            (checkTypeValue === "outgoing" && check.status === "odenecek")) && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleQuickAction}
              className={cn(
                "h-8 w-8",
                checkTypeValue === "incoming"
                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
              )}
              title={checkTypeValue === "incoming" ? "Ciro Et" : "Ödeme Yap"}
            >
              <span className="text-xs">
                {checkTypeValue === "incoming" ? "Ciro" : "Öde"}
              </span>
            </Button>
          )}
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

