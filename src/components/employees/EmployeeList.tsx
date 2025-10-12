import { EmployeeListContent } from "./components/EmployeeListContent";
import type { Employee, ViewMode } from "@/types/employee";

interface EmployeeListProps {
  employees: Employee[];
  isLoading: boolean;
  viewMode: ViewMode;
  onEmployeeSelectToggle?: (employee: Employee) => void;
  selectedEmployees?: Employee[];
  setSelectedEmployees?: (employees: Employee[]) => void;
}

export const EmployeeList = ({ 
  employees, 
  isLoading, 
  viewMode,
  onEmployeeSelectToggle,
  selectedEmployees,
  setSelectedEmployees
}: EmployeeListProps) => {
  return (
    <EmployeeListContent
      employees={employees}
      isLoading={isLoading}
      viewMode={viewMode}
      onEmployeeSelectToggle={onEmployeeSelectToggle}
      selectedEmployees={selectedEmployees}
      setSelectedEmployees={setSelectedEmployees}
    />
  );
};
