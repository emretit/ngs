import { Table, TableBody } from "@/components/ui/table";
import { LeaveRequest } from "./types";
import LeaveTableHeader, { LeaveSortField, LeaveSortDirection } from "./table/LeaveTableHeader";
import { LeaveTableRow } from "./table/LeaveTableRow";
import { useState } from "react";

interface LeaveTableProps {
  leaves: LeaveRequest[];
  isLoading?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onSelectLeave?: (id: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;
}

export const LeaveTable = ({ 
  leaves, 
  isLoading = false,
  onApprove,
  onReject,
  onSelectLeave,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort: externalOnSort,
}: LeaveTableProps) => {
  // Internal state for sorting (fallback)
  const [internalSortField, setInternalSortField] = useState<LeaveSortField>("start_date");
  const [internalSortDirection, setInternalSortDirection] = useState<LeaveSortDirection>("desc");

  // Use external props if provided, otherwise use internal state
  const sortField = (externalSortField as LeaveSortField) ?? internalSortField;
  const sortDirection = (externalSortDirection as LeaveSortDirection) ?? internalSortDirection;

  const handleSort = (field: LeaveSortField) => {
    if (externalOnSort) {
      externalOnSort(field);
    } else {
      // Internal sorting logic
      if (field === internalSortField) {
        setInternalSortDirection(internalSortDirection === "asc" ? "desc" : "asc");
      } else {
        setInternalSortField(field);
        setInternalSortDirection("asc");
      }
    }
  };

  // Sort leaves internally if external sorting is not provided
  const sortedLeaves = externalOnSort 
    ? leaves 
    : [...leaves].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case "employee":
            aValue = a.employee?.full_name || `${a.employee?.first_name} ${a.employee?.last_name}`;
            bValue = b.employee?.full_name || `${b.employee?.first_name} ${b.employee?.last_name}`;
            break;
          case "leave_type":
            aValue = a.leave_type;
            bValue = b.leave_type;
            break;
          case "start_date":
            aValue = new Date(a.start_date).getTime();
            bValue = new Date(b.start_date).getTime();
            break;
          case "days":
            aValue = a.days;
            bValue = b.days;
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            aValue = a.start_date;
            bValue = b.start_date;
        }

        if (aValue < bValue) return internalSortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return internalSortDirection === "asc" ? 1 : -1;
        return 0;
      });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <LeaveTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <LeaveTableRow key={i} leave={null} isLoading={true} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (leaves.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <LeaveTableHeader
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            <tr>
              <td colSpan={7} className="h-[400px]">
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
                  <div className="text-center space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                      <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-4xl">📅</span>
                      </div>
                    </div>
                    
                    {/* Text */}
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-900">
                        İzin kaydı bulunamadı
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Henüz hiç izin kaydı yok. Yeni bir izin kaydı oluşturmak için yukarıdaki "Yeni İzin" butonuna tıklayın.
                      </p>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <Table>
        <LeaveTableHeader
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
        <TableBody>
          {sortedLeaves.map((leave) => (
            <LeaveTableRow
              key={leave.id}
              leave={leave}
              onApprove={onApprove}
              onReject={onReject}
              onSelect={onSelectLeave}
            />
          ))}
        </TableBody>
      </Table>
      
      {/* Footer - Toplam kayıt sayısı */}
      {leaves.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-3 text-center">
          <span className="text-xs text-muted-foreground font-medium">
            Toplam {leaves.length} izin kaydı
          </span>
        </div>
      )}
    </div>
  );
};
