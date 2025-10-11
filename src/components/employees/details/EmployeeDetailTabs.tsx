
import type { Employee } from "@/types/employee";
import { EmployeeTabs } from "./EmployeeTabs";

interface EmployeeDetailTabsProps {
  employee: Employee;
  activeTab: string;
  setActiveTab: (value: string) => void;
  refetch: () => void;
}

export const EmployeeDetailTabs = ({ 
  employee, 
  activeTab, 
  setActiveTab,
  refetch
}: EmployeeDetailTabsProps) => {
  return (
    <EmployeeTabs 
      employee={employee} 
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      refetch={refetch}
    />
  );
};
