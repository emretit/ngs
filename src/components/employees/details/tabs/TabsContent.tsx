
import { TabsContent } from "@/components/ui/tabs";
import { Employee } from "@/types/employee";
import { DetailsTabContent } from "./DetailsTabContent";
import { EmployeeSalaryTab } from "../EmployeeSalaryTab";
import { EmployeeLeaveTab } from "../EmployeeLeaveTab";
import { EmployeePerformanceTab } from "../EmployeePerformanceTab";
import { EmployeeTasksTab } from "../EmployeeTasksTab";

interface TabsContentProps {
  employee: Employee;
  handleEmployeeUpdate: (employee: Employee) => void;
  refetch?: () => Promise<void>;
}

export const EmployeeTabsContent = ({ 
  employee, 
  handleEmployeeUpdate,
  refetch
}: TabsContentProps) => {
  return (
    <>
      <TabsContent value="details" className="mt-6">
        <DetailsTabContent 
          employee={employee} 
          handleEmployeeUpdate={handleEmployeeUpdate}
        />
      </TabsContent>
      
      <TabsContent value="salary" className="mt-6">
        <EmployeeSalaryTab employee={employee} refetch={refetch || (async () => {})} />
      </TabsContent>
      
      <TabsContent value="leave" className="mt-6">
        <EmployeeLeaveTab employee={employee} />
      </TabsContent>
      
      <TabsContent value="performance" className="mt-6">
        <EmployeePerformanceTab employeeId={employee.id} />
      </TabsContent>
      
      <TabsContent value="tasks" className="mt-6">
        <EmployeeTasksTab employeeId={employee.id} employeeName={`${employee.first_name} ${employee.last_name}`} />
      </TabsContent>
    </>
  );
};
