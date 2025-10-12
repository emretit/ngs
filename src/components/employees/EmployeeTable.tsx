import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Employee } from "@/types/employee";
import { StatusBadge } from "./StatusBadge";
import { EmployeeDetailPanel } from "./details/EmployeeDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteEmployee } from "@/hooks/useEmployeeMutations";
import { Checkbox } from "@/components/ui/checkbox";

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
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const deleteEmployeeMutation = useDeleteEmployee();
  
  const handleRowClick = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleDelete = async (employeeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Bu çalışanı silmek istediğinizden emin misiniz?")) {
      return;
    }

    deleteEmployeeMutation.mutate(employeeId);
  };

  if (isLoading) {
    return (
      <div className="relative">
        <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50/80 border-b border-gray-200/60">
                {onEmployeeSelectToggle && (
                  <TableHead className="h-12 w-[40px] px-6 text-center align-middle font-bold text-foreground/80 text-sm tracking-wide">
                    <Checkbox
                      checked={selectedEmployees.length === employees.length && employees.length > 0}
                      onCheckedChange={(checked) => {
                        if (setSelectedEmployees) {
                          if (checked) {
                            setSelectedEmployees(employees);
                          } else {
                            setSelectedEmployees([]);
                          }
                        }
                      }}
                    />
                  </TableHead>
                )}
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  👤 Çalışan
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  🏢 Departman
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  💼 Pozisyon
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  📞 İletişim
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  📅 İşe Başlama
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  🟢 Durum
                </TableHead>
                <TableHead className="h-12 px-6 text-right align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  ⚙️ İşlemler
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="h-16 border-b border-gray-100/60">
                  {onEmployeeSelectToggle && (
                    <TableCell className="py-4 px-6 text-center">
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                  )}
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex justify-end space-x-2">
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
            <TableHeader>
              <TableRow className="bg-gray-50/80 border-b border-gray-200/60">
                {onEmployeeSelectToggle && (
                  <TableHead className="h-12 w-[40px] px-6 text-center align-middle font-bold text-foreground/80 text-sm tracking-wide">
                    <Checkbox
                      checked={selectedEmployees.length === employees.length && employees.length > 0}
                      onCheckedChange={(checked) => {
                        if (setSelectedEmployees) {
                          if (checked) {
                            setSelectedEmployees(employees);
                          } else {
                            setSelectedEmployees([]);
                          }
                        }
                      }}
                    />
                  </TableHead>
                )}
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  👤 Çalışan
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  🏢 Departman
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  💼 Pozisyon
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  📞 İletişim
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  📅 İşe Başlama
                </TableHead>
                <TableHead className="h-12 px-6 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  🟢 Durum
                </TableHead>
                <TableHead className="h-12 px-6 text-right align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                  ⚙️ İşlemler
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={onEmployeeSelectToggle ? 8 : 7} className="h-32 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-4xl">👥</div>
                      <p className="text-lg font-medium">Çalışan bulunamadı</p>
                      <p className="text-sm">Henüz hiç çalışan eklenmemiş</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => {
                  const isSelected = selectedEmployees.some(e => e.id === employee.id);
                  return (
                    <TableRow 
                      key={employee.id}
                      className="h-16 cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-200 border-b border-gray-100/60"
                      onClick={() => handleRowClick(employee)}
                    >
                      {onEmployeeSelectToggle && (
                        <TableCell className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onEmployeeSelectToggle(employee)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="py-4 px-6">
                      <p className="text-sm font-medium text-gray-900">
                        {employee.first_name} {employee.last_name}
                      </p>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-sm text-gray-900">{employee.department}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-sm text-gray-900">{employee.position}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">{employee.email}</p>
                        <p className="text-sm text-gray-500">{employee.phone || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-sm text-gray-900">{new Date(employee.hire_date).toLocaleDateString("tr-TR")}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <StatusBadge status={employee.status} />
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/employees/${employee.id}`);
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                          title="Görüntüle"
                        >
                          <span className="sr-only">Görüntüle</span>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/employee-form/${employee.id}`);
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                          title="Düzenle"
                        >
                          <span className="sr-only">Düzenle</span>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(employee.id, e)}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                          title="Sil"
                          disabled={deleteEmployeeMutation.isPending}
                        >
                          <span className="sr-only">Sil</span>
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
    </>
  );
};

export default EmployeeTable;