import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeList } from "@/components/employees/EmployeeList";
import EmployeesHeader from "@/components/employees/EmployeesHeader";
import EmployeesFilterBar from "@/components/employees/EmployeesFilterBar";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

type ViewType = "table" | "grid";

const Employees = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [activeView, setActiveView] = useState<ViewType>("table");

  // Fetch employees with stats
  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['employees', selectedStatus, selectedDepartment, selectedPosition, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      if (selectedDepartment !== 'all') {
        query = query.eq('department_id', selectedDepartment);
      }

      if (selectedPosition !== 'all') {
        query = query.eq('position', selectedPosition);
      }

      if (searchQuery) {
        query = query.or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get unique positions
  const positions = Array.from(new Set(employees.map(emp => emp.position).filter(Boolean)));

  // Calculate employee stats
  const employeeStats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === 'aktif').length,
    inactive: employees.filter(emp => emp.status === 'pasif').length,
    onLeave: employees.filter(emp => emp.status === 'izinli').length,
    fullTime: employees.filter(emp => emp.employment_type === 'tam_zamanli').length,
    partTime: employees.filter(emp => emp.employment_type === 'yari_zamanli').length,
  };

  if (error) {
    toast.error("Çalışanlar yüklenirken bir hata oluştu");
    console.error("Error loading employees:", error);
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <EmployeesHeader 
        activeView={activeView} 
        setActiveView={setActiveView}
        employeeStats={employeeStats}
      />

      {/* Filters */}
      <EmployeesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
        departments={departments}
        positions={positions}
      />


      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Çalışanlar yükleniyor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500">Çalışanlar yüklenirken bir hata oluştu</div>
        </div>
      ) : (
        <Tabs value={activeView} className="w-full">
          <TabsContent value="table" className="mt-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 bg-white rounded-xl relative overflow-hidden">
                <div className="relative z-10">
                  <EmployeeList 
                    employees={employees}
                    isLoading={isLoading}
                    onRefresh={() => window.location.reload()}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="grid" className="mt-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 bg-white rounded-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Grid görünümü yakında eklenecek</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Employees;