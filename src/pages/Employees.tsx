
import Navbar from "@/components/Navbar";
import { EmployeeList } from "@/components/employees/EmployeeList";
import { EmployeeSummaryStats } from "@/components/employees/stats/EmployeeSummaryStats";
import { SalaryOverviewCards } from "@/components/employees/SalaryOverviewCards";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmployeesPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Employees = ({ isCollapsed, setIsCollapsed }: EmployeesPageProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Çalışan Yönetimi</h1>
              <p className="text-gray-600 mt-1">Tüm çalışanları görüntüle ve yönet</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => navigate("/add-employee")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Çalışan
              </Button>
            </div>
          </div>
          
          <EmployeeSummaryStats />
          
          <SalaryOverviewCards />
          
          <EmployeeList />
        </div>
      </main>
    </div>
  );
};

export default Employees;
