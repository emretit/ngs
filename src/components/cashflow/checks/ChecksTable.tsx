import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { formatCurrency, getStatusConfig } from "@/utils/cashflowUtils";
import { format } from "date-fns";

interface Check {
  id: string;
  check_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  bank: string;
  issuer_name?: string;
  payee: string;
  status: string;
  notes?: string;
  created_at: string;
  check_type?: 'incoming' | 'outgoing';
}

interface ChecksTableProps {
  checks: Check[];
  checkType: "incoming" | "outgoing";
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onQuickAction?: (check: Check) => void;
  quickActionLabel?: string;
  showPayee?: boolean;
  limit?: number;
  emptyMessage: string;
}

export const ChecksTable = ({
  checks,
  checkType,
  onEdit,
  onDelete,
  onQuickAction,
  quickActionLabel,
  showPayee = false,
  limit,
  emptyMessage,
}: ChecksTableProps) => {
  const displayedChecks = limit ? checks.slice(0, limit) : checks;

  return (
    <div className="rounded-md border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs font-medium text-gray-600">Çek No</TableHead>
            {checkType === "incoming" && (
              <TableHead className="text-xs font-medium text-gray-600">Keşideci</TableHead>
            )}
            {checkType === "outgoing" && (
              <>
                <TableHead className="text-xs font-medium text-gray-600">Keşideci</TableHead>
                {showPayee && (
                  <TableHead className="text-xs font-medium text-gray-600">Lehtar</TableHead>
                )}
              </>
            )}
            <TableHead className="text-xs font-medium text-gray-600">Vade</TableHead>
            <TableHead className="text-xs font-medium text-gray-600 text-right">Tutar</TableHead>
            <TableHead className="text-xs font-medium text-gray-600">Durum</TableHead>
            <TableHead className="text-xs font-medium text-gray-600 text-center">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedChecks.map((check) => (
            <TableRow key={check.id} className="hover:bg-gray-50">
              <TableCell className="text-xs font-medium">{check.check_number}</TableCell>
              {checkType === "incoming" && (
                <TableCell className="text-xs">{check.issuer_name || "-"}</TableCell>
              )}
              {checkType === "outgoing" && (
                <>
                  <TableCell className="text-xs">{check.issuer_name}</TableCell>
                  {showPayee && (
                    <TableCell className="text-xs">{check.payee}</TableCell>
                  )}
                </>
              )}
              <TableCell className="text-xs">
                {format(new Date(check.due_date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell className="text-xs text-right font-medium">
                {formatCurrency(check.amount)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusConfig(check.status).variant}>
                  {getStatusConfig(check.status).label}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center space-x-1">
                  {onQuickAction && check.status === (checkType === "incoming" ? "portfoyde" : "odenecek") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 px-2 text-xs ${
                        checkType === "incoming"
                          ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      }`}
                      onClick={() => onQuickAction(check)}
                    >
                      {quickActionLabel}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEdit(check)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={() => onDelete(check.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {checks.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={checkType === "incoming" ? 6 : 7}
                className="text-center text-sm text-gray-500 py-4"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

