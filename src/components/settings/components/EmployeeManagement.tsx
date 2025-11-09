import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, UserCheck, UserX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeManagement } from "../hooks/useEmployeeManagement";
import { EmployeeDeletionDialog } from "./EmployeeDeletionDialog";
import { Employee } from "@/types/employee";

export const EmployeeManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);

  const {
    employees,
    isLoading,
    deleteEmployeeMutation
  } = useEmployeeManagement();

  const filteredEmployees = employees?.filter(employee =>
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeletionDialog(true);
  };

  const handleConfirmDeletion = (deleteUser: boolean) => {
    if (employeeToDelete) {
      deleteEmployeeMutation.mutate({
        employeeId: employeeToDelete.id,
        deleteUser
      });
      setShowDeletionDialog(false);
      setEmployeeToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Çalışan Yönetimi</h2>
            <p className="text-muted-foreground">Şirket çalışanlarını yönetin. Her çalışan otomatik olarak bir kullanıcı hesabına sahiptir.</p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Çalışan
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Çalışan ara..." disabled />
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Çalışan</TableHead>
                <TableHead>Pozisyon</TableHead>
                <TableHead>Departman</TableHead>
                <TableHead>Kullanıcı Durumu</TableHead>
                <TableHead className="text-center">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-8 w-16 rounded-md mx-auto" />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Çalışan Yönetimi</h2>
          <p className="text-muted-foreground">Şirket çalışanlarını yönetin ve kullanıcı hesaplarıyla eşleştirin</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Çalışan
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Çalışan ara..."
          value={searchTerm || ""}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Çalışan</TableHead>
              <TableHead>Pozisyon</TableHead>
              <TableHead>Departman</TableHead>
              <TableHead>Kullanıcı Durumu</TableHead>
              <TableHead className="text-center">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <span>Çalışan bulunamadı</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees?.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {employee.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-sm">{employee.position}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {employee.user_id ? (
                        <>
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Kullanıcı Mevcut
                          </Badge>
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4 text-gray-500" />
                          <Badge variant="secondary">
                            Email Bekleniyor
                          </Badge>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Sil
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EmployeeDeletionDialog
        employee={employeeToDelete}
        isOpen={showDeletionDialog}
        onClose={() => {
          setShowDeletionDialog(false);
          setEmployeeToDelete(null);
        }}
        onConfirm={handleConfirmDeletion}
        isLoading={deleteEmployeeMutation.isPending}
      />
    </div>
  );
};