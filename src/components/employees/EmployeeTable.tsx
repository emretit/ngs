import { useMemo, useState } from "react";
import { logger } from '@/utils/logger';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import type { Employee } from "@/types/employee";
import { StatusBadge } from "./StatusBadge";
import { EmployeeDetailPanel } from "./details/EmployeeDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteEmployee } from "@/hooks/useEmployeeMutations";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import EmployeeTableHeader from "@/components/employees/table/EmployeeTableHeader";

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
  onEmployeeSelectToggle?: (employee: Employee) => void;
  selectedEmployees?: Employee[];
  setSelectedEmployees?: (employees: Employee[]) => void;
}

const EmployeeTable = ({ 
  employees, 
  isLoading,
  onEmployeeSelectToggle,
  selectedEmployees = [],
  setSelectedEmployees
}: EmployeeTableProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const deleteEmployeeMutation = useDeleteEmployee();
  
  // Confirmation dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortField, setSortField] = useState<string>("hire_date");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>("desc");

  const [columns] = useState([
    { id: "name", label: "👤 Çalışan", visible: true, sortable: true, align: 'left' as const },
    { id: "department", label: "🏢 Departman", visible: true, sortable: true, align: 'left' as const },
    { id: "contact", label: "📞 İletişim", visible: true, sortable: false, align: 'left' as const },
    { id: "hire_date", label: "📅 Başlama", visible: true, sortable: true, align: 'center' as const },
    { id: "net_salary", label: "💰 Net", visible: true, sortable: true, align: 'right' as const },
    { id: "manual_employer_sgk_cost", label: "🏥 Netten Brüte", visible: true, sortable: true, align: 'right' as const },
    { id: "meal_allowance", label: "🍽️ Yemek", visible: true, sortable: true, align: 'right' as const },
    { id: "transport_allowance", label: "🚗 Ulaşım", visible: true, sortable: true, align: 'right' as const },
    { id: "total_employer_cost", label: "🏢 Toplam", visible: true, sortable: true, align: 'right' as const },
    { id: "balance", label: "💳 Bakiye", visible: true, sortable: true, align: 'right' as const },
    { id: "status", label: "📊 Durum", visible: true, sortable: true, align: 'center' as const },
    { id: "actions", label: "⚙️ İşlemler", visible: true, sortable: false, align: 'center' as const },
  ]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEmployees = useMemo(() => {
    const list = [...employees];
    const getValue = (e: Employee, field: string): any => {
      switch (field) {
        case 'name':
          return `${e.first_name ?? ''} ${e.last_name ?? ''}`.toLowerCase();
        case 'department':
          return `${e.department ?? ''} ${e.position ?? ''}`.toLowerCase();
        case 'contact':
          return `${e.email ?? ''} ${e.phone ?? ''}`.toLowerCase();
        case 'hire_date':
          return e.hire_date ? new Date(e.hire_date).getTime() : 0;
        case 'net_salary':
          return e.net_salary ?? 0;
        case 'manual_employer_sgk_cost':
          return e.manual_employer_sgk_cost ?? 0;
        case 'meal_allowance':
          return e.meal_allowance ?? 0;
        case 'transport_allowance':
          return e.transport_allowance ?? 0;
        case 'total_employer_cost':
          return e.total_employer_cost ?? 0;
        case 'balance':
          return e.balance ?? 0;
        case 'status':
          return (e.status ?? '').toString();
        default:
          return '';
      }
    };

    list.sort((a, b) => {
      const av = getValue(a, sortField);
      const bv = getValue(b, sortField);
      if (av === bv) return 0;
      const comp = av > bv ? 1 : -1;
      return sortDirection === 'asc' ? comp : -comp;
    });
    return list;
  }, [employees, sortField, sortDirection]);
  
  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "-";
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const handleRowClick = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleDeleteClick = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    try {
      deleteEmployeeMutation.mutate(employeeToDelete.id);
    } catch (error) {
      logger.error('Error deleting employee:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="relative">
        <Table className="border-collapse">
            <EmployeeTableHeader
              columns={columns}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={() => {}}
              hasSelection={Boolean(onEmployeeSelectToggle)}
              onSelectAll={(checked: boolean) => {
                if (!setSelectedEmployees) return;
                if (checked) {
                  setSelectedEmployees(employees);
                } else {
                  setSelectedEmployees([]);
                }
              }}
              isAllSelected={selectedEmployees.length === employees.length && employees.length > 0}
            />
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="h-12 border-b border-gray-100/60">
                  {onEmployeeSelectToggle && (
                    <TableCell className="py-2 px-3 text-center">
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                  )}
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-lg" />
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Table className="border-collapse">
            <EmployeeTableHeader
              columns={columns}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              hasSelection={Boolean(onEmployeeSelectToggle)}
              onSelectAll={(checked: boolean) => {
                if (!setSelectedEmployees) return;
                if (checked) {
                  setSelectedEmployees(employees);
                } else {
                  setSelectedEmployees([]);
                }
              }}
              isAllSelected={selectedEmployees.length === employees.length && employees.length > 0}
            />
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onEmployeeSelectToggle ? 13 : 12} className="h-32 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-4xl">👥</div>
                      <p className="text-lg font-medium">Çalışan bulunamadı</p>
                      <p className="text-sm">Henüz hiç çalışan eklenmemiş</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedEmployees.map((employee) => {
                  const isSelected = selectedEmployees.some(e => e.id === employee.id);
                  return (
                    <TableRow 
                      key={employee.id}
                      className="h-12 cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-200 border-b border-gray-100/60"
                      onClick={() => handleRowClick(employee)}
                    >
                      {onEmployeeSelectToggle && (
                        <TableCell className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onEmployeeSelectToggle(employee)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="py-2 px-3">
                      <p className="text-sm font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </p>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">{employee.department}</div>
                        <div className="text-xs text-gray-500">{employee.position}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">{employee.email}</p>
                        <p className="text-sm text-gray-500">{employee.phone || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <span className="text-sm text-gray-900">{new Date(employee.hire_date).toLocaleDateString("tr-TR")}</span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(employee.net_salary)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className="text-sm font-medium text-blue-600">
                        {formatCurrency(employee.manual_employer_sgk_cost)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className="text-sm font-medium text-orange-600">
                        {formatCurrency(employee.meal_allowance)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className="text-sm font-medium text-purple-600">
                        {formatCurrency(employee.transport_allowance)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(employee.total_employer_cost)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3 text-right">
                      <span className={`text-sm font-medium ${
                        (employee.balance || 0) > 0 
                          ? 'text-green-600' 
                          : (employee.balance || 0) < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                      }`}>
                        {formatCurrency(employee.balance)}
                      </span>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <StatusBadge status={employee.status} />
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/employees/${employee.id}/edit`);
                          }}
                          className="h-8 w-8"
                          title="Düzenle"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteClick(employee, e)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Sil"
                          disabled={deleteEmployeeMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
      </div>
      
      <EmployeeDetailPanel
        employee={selectedEmployee}
        isOpen={isDetailPanelOpen}
        onClose={() => setIsDetailPanelOpen(false)}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Çalışanı Sil"
        description={`"${employeeToDelete?.first_name} ${employeeToDelete?.last_name}" çalışanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </>
  );
};

export default EmployeeTable;