import EmployeeTable from "../EmployeeTable";
import { EmployeeGrid } from "../EmployeeGrid";
import type { Employee, ViewMode } from "@/types/employee";

interface EmployeeListContentProps {
  employees: Employee[];
  isLoading: boolean;
  viewMode: ViewMode;
  onEmployeeSelectToggle?: (employee: Employee) => void;
  selectedEmployees?: Employee[];
  setSelectedEmployees?: (employees: Employee[]) => void;
}

export const EmployeeListContent = ({
  employees,
  isLoading,
  viewMode,
  onEmployeeSelectToggle,
  selectedEmployees,
  setSelectedEmployees
}: EmployeeListContentProps) => {
  return (
    <div className="space-y-6">
      {viewMode === 'table' ? (
        <EmployeeTable 
          employees={employees} 
          isLoading={isLoading}
          onEmployeeSelectToggle={onEmployeeSelectToggle}
          selectedEmployees={selectedEmployees}
          setSelectedEmployees={setSelectedEmployees}
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