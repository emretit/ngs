import { Table, TableBody } from "@/components/ui/table";
import { Check } from "@/types/check";
import ChecksTableHeader from "./table/ChecksTableHeader";
import { ChecksTableRow } from "./table/ChecksTableRow";
import ChecksTableEmpty from "./table/ChecksTableEmpty";

interface ChecksTableProps {
  checks: Check[];
  isLoading?: boolean;
  onCheckSelect?: (check: Check) => void;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onQuickAction?: (check: Check) => void;
  searchQuery?: string;
  statusFilter?: string;
  checkTypeFilter?: string;
  showPayee?: boolean;
  showCheckType?: boolean;
}

export const ChecksTable = ({
  checks,
  isLoading = false,
  onCheckSelect,
  onEdit,
  onDelete,
  onQuickAction,
  showPayee = true,
  showCheckType = true,
}: ChecksTableProps) => {
  return (
      <Table>
      <ChecksTableHeader
        showCheckType={showCheckType}
        showPayee={showPayee}
      />
        <TableBody>
        {checks.length === 0 && !isLoading ? (
          <ChecksTableEmpty colSpan={showCheckType && showPayee ? 9 : showCheckType || showPayee ? 8 : 7} />
        ) : (
          checks.map((check, index) => (
            <ChecksTableRow
              key={check.id}
              check={check}
              index={index}
              onSelect={onCheckSelect || onEdit}
              onEdit={onEdit}
              onDelete={onDelete}
              onQuickAction={onQuickAction}
              showCheckType={showCheckType}
              showPayee={showPayee}
              isLoading={isLoading}
            />
          ))
          )}
        </TableBody>
      </Table>
  );
};

