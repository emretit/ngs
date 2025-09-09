
import { Tabs } from "@/components/ui/tabs";
import type { Employee } from "@/types/employee";
import { EmployeeTabsList } from "./tabs/TabsList";
import { EmployeeTabsContent } from "./tabs/TabsContent";

interface EmployeeDetailTabsProps {
  employee: Employee;
  activeTab: string;
  setActiveTab: (value: string) => void;
  refetch: () => Promise<void>;
}

export const EmployeeDetailTabs = ({ 
  employee, 
  activeTab, 
  setActiveTab,
  refetch
}: EmployeeDetailTabsProps) => {
  const handleEmployeeUpdate = async (updatedEmployee: Employee) => {
    // This function will be passed to child components
    await refetch();
  };

  return (
    <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-in">
      <EmployeeTabsList activeTab={activeTab} />
      
      <EmployeeTabsContent 
        employee={employee} 
        handleEmployeeUpdate={handleEmployeeUpdate}
        refetch={refetch}
      />
    </Tabs>
  );
};
