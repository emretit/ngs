import EmployeeTable from "../EmployeeTable";
import { EmployeeGrid } from "../EmployeeGrid";
import type { Employee, ViewMode } from "@/types/employee";

interface EmployeeListContentProps {
  employees: Employee[];
  isLoading: boolean;
  viewMode: ViewMode;
}

export const EmployeeListContent = ({
  employees,
  isLoading,
  viewMode
}: EmployeeListContentProps) => {
  return (
    <div className="space-y-6">
      {viewMode === 'table' ? (
        <EmployeeTable 
          employees={employees} 
          isLoading={isLoading} 
        />
      ) : (
        <EmployeeGrid 
          employees={employees} 
          isLoading={isLoading} 
        />
      )}
    </div>
  );
};