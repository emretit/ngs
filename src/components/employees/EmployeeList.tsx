
import { EmployeeListContent } from "./components/EmployeeListContent";
import type { Employee, ViewMode } from "@/types/employee";

interface EmployeeListProps {
  employees: Employee[];
  isLoading: boolean;
  viewMode: ViewMode;
}

export const EmployeeList = ({ employees, isLoading, viewMode }: EmployeeListProps) => {
  return (
    <EmployeeListContent
      employees={employees}
      isLoading={isLoading}
      viewMode={viewMode}
    />
  );
};
