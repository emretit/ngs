import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { Employee } from "@/types/employee";
import { EmployeeFinancialStatement } from "../salary/EmployeeFinancialStatement";
import { SalaryForm } from "../salary/SalaryForm";

interface EmployeeSalaryTabProps {
  employee: Employee;
}

export const EmployeeSalaryTab = ({ employee }: EmployeeSalaryTabProps) => {
  const [open, setOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSaveSalary = async (values: any) => {
    setOpen(false);
    setEditingSalary(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditSalary = (salaryData: any) => {
    setEditingSalary(salaryData);
    setOpen(true);
  };

  const handleNewSalary = () => {
    setEditingSalary(null);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewSalary}>
              <Plus className="h-4 w-4 mr-2" />
              Maaş Bilgilerini Düzenle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto p-2">
            <DialogHeader>
              <DialogTitle>
                {editingSalary ? "Maaş Bilgilerini Güncelle" : "Yeni Maaş Kaydı"}
              </DialogTitle>
            </DialogHeader>
            <SalaryForm
              employeeId={employee.id}
              existingSalary={editingSalary}
              onSave={handleSaveSalary}
              onClose={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Financial Statement */}
      <EmployeeFinancialStatement
        employeeId={employee.id}
        onEdit={handleEditSalary}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};