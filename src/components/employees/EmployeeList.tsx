
import { useState } from "react";
import { EmployeeActions } from "./components/EmployeeActions";
import { EmployeeListContent } from "./components/EmployeeListContent";
import type { Employee, ViewMode } from "@/types/employee";

interface EmployeeListProps {
  employees: Employee[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const EmployeeList = ({ employees, isLoading, onRefresh }: EmployeeListProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Çalışan Listesi</h2>
        <EmployeeActions
          viewMode={viewMode}
          setViewMode={setViewMode}
          onRefresh={onRefresh}
          hasEmployees={employees.length > 0}
          isLoading={isLoading}
        />
      </div>

      <EmployeeListContent
        employees={employees}
        isLoading={isLoading}
        viewMode={viewMode}
      />
    </div>
  );
};
