import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { ChecksStatusCards } from "./ChecksStatusCards";
import { ChecksFilterBar } from "./ChecksFilterBar";
import { ChecksTable } from "./ChecksTable";

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

interface ChecksSummaryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBgColor: string;
  checks: Check[];
  totalAmount: number;
  statusConfig: {
    key: string;
    label: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    textColorDark: string;
  }[];
  checkType: "incoming" | "outgoing";
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  startDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  endDate?: Date;
  onEndDateChange: (date: Date | undefined) => void;
  searchPlaceholder: string;
  statusOptions: { value: string; label: string }[];
  onAddNew: () => void;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onQuickAction?: (check: Check) => void;
  quickActionLabel?: string;
  sectionTitle: string;
  emptyMessage: string;
  totalAmountColor: string;
}

export const ChecksSummaryCard = ({
  title,
  description,
  icon,
  iconBgColor,
  checks,
  totalAmount,
  statusConfig,
  checkType,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  searchPlaceholder,
  statusOptions,
  onAddNew,
  onEdit,
  onDelete,
  onQuickAction,
  quickActionLabel,
  sectionTitle,
  emptyMessage,
  totalAmountColor,
}: ChecksSummaryCardProps) => {
  return (
    <Card className="group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <CardContent className="relative p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconBgColor} rounded-lg shadow-md`}>
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Toplam Tutar</span>
            <span className={`text-lg font-semibold ${totalAmountColor}`}>
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <ChecksStatusCards checks={checks} statusConfig={statusConfig} />
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900">{sectionTitle}</h4>
            <Button size="sm" onClick={onAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Çek
            </Button>
          </div>

          <ChecksFilterBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            statusFilter={statusFilter}
            onStatusChange={onStatusChange}
            startDate={startDate}
            onStartDateChange={onStartDateChange}
            endDate={endDate}
            onEndDateChange={onEndDateChange}
            searchPlaceholder={searchPlaceholder}
            statusOptions={statusOptions}
          />

          <ChecksTable
            checks={checks}
            checkType={checkType}
            onEdit={onEdit}
            onDelete={onDelete}
            onQuickAction={onQuickAction}
            quickActionLabel={quickActionLabel}
            showPayee={checkType === "outgoing"}
            limit={5}
            emptyMessage={emptyMessage}
          />

          {checks.length > 5 && (
            <div className="mt-2 text-center">
              <Button variant="outline" size="sm" className="text-xs">
                Tümünü Gör ({checks.length} çek)
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

