
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Çalışan</TableHead>
              <TableHead>Departman</TableHead>
              <TableHead>Pozisyon</TableHead>
              <TableHead>İletişim</TableHead>
              <TableHead>İşe Başlama</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded-md ml-auto" />
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
      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Çalışan</TableHead>
              <TableHead>Departman</TableHead>
              <TableHead>Pozisyon</TableHead>
              <TableHead>İletişim</TableHead>
              <TableHead>İşe Başlama</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Çalışan bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow 
                  key={employee.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleRowClick(employee)}
                >
                  <TableCell className="font-medium">
                    {employee.first_name} {employee.last_name}
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.position}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{employee.email}</span>
                      <span className="text-xs text-gray-500">{employee.phone || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(employee.hire_date).toLocaleDateString("tr-TR")}</TableCell>
                  <TableCell>
                    <StatusBadge status={employee.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/employees/${employee.id}`);
                        }}
                        className="h-8 w-8"
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
                        className="h-8 w-8"
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
      
      <EmployeeDetailPanel
        employee={selectedEmployee}
        isOpen={isDetailPanelOpen}
        onClose={() => setIsDetailPanelOpen(false)}
      />
    </>
  );
};

export default EmployeeTable;
