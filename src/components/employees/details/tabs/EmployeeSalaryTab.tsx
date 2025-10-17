import React from "react";
import { Employee } from "@/types/employee";
import { EmployeeFinancialStatement } from "../salary/EmployeeFinancialStatement";

interface EmployeeSalaryTabProps {
  employee: Employee;
}

export const EmployeeSalaryTab = ({ employee }: EmployeeSalaryTabProps) => {

  return (
    <div className="space-y-6">

      {/* Main Financial Statement */}
      <EmployeeFinancialStatement
        employeeId={employee.id}
      />
    </div>
  );
};