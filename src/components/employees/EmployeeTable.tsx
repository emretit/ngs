import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Pencil } from "lucide-react";
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

interface EmployeeTableProps {
  employees: Employee[];
  isLoading: boolean;
}

const EmployeeTable = ({ employees, isLoading }: EmployeeTableProps) => {
  const navigate = useNavigate();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  
  const handleRowClick = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-card via-muted/20 to-background rounded-2xl shadow-2xl border border-border/10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50"></div>
        <div className="relative z-10">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50/80 border-b border-gray-200/60">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-card via-muted/20 to-background rounded-2xl shadow-2xl border border-border/10 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50"></div>
        <div className="relative z-10">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50/80 border-b border-gray-200/60">
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
                  <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-4xl">👥</div>
                      <p className="text-lg font-medium">Çalışan bulunamadı</p>
                      <p className="text-sm">Henüz hiç çalışan eklenmemiş</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee) => (
                  <TableRow 
                    key={employee.id}
                    className="h-16 cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-accent/5 transition-all duration-200 border-b border-gray-100/60"
                    onClick={() => handleRowClick(employee)}
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 ring-2 ring-primary/20 shadow-lg">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-lg">
                            {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 text-base">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-sm text-gray-500 font-mono">{employee.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200/50 shadow-sm">
                        🏢 {employee.department}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg">
                        💼 {employee.position}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">{employee.email}</p>
                        <p className="text-sm text-gray-500">{employee.phone || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-900 bg-gray-50 px-3 py-1.5 rounded-lg">
                        📅 {new Date(employee.hire_date).toLocaleDateString("tr-TR")}
                      </span>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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