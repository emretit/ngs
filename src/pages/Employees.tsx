
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { EmployeeList } from "@/components/employees/EmployeeList";
import { EmployeeSummaryStats } from "@/components/employees/stats/EmployeeSummaryStats";
import { SalaryOverviewCards } from "@/components/employees/SalaryOverviewCards";
import { Button } from "@/components/ui/button";
import { Plus, Users, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmployeesPageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Employees = ({ isCollapsed, setIsCollapsed }: EmployeesPageProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <TopBar />
        <div className="p-8">
          <div className="w-full">
            {/* Header Section */}
            <div className="mb-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white shadow-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Çalışan Yönetimi</h1>
                    <p className="text-gray-600 mt-1">Tüm çalışanları görüntüle, yönet ve maaş bilgilerini takip et</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-6"
                    onClick={() => navigate("/add-employee")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Çalışan
                  </Button>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-8">
              <EmployeeSummaryStats />

              <SalaryOverviewCards />

              <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
                <div className="border-b border-gray-200/80 bg-gray-50/50 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Çalışan Listesi</h2>
                  </div>
                </div>
                <div className="p-6">
                  <EmployeeList />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Employees;
