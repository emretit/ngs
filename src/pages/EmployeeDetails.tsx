import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeHeader } from "@/components/employees/details/EmployeeHeader";
import { EmployeeInfo } from "@/components/employees/details/EmployeeInfo";
import { EmployeeDetailTabs } from "@/components/employees/details/EmployeeDetailTabs";
import { Employee } from "@/types/employee";
import { useTabs } from "@/components/tabs/TabContext";

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { updateTabTitle } = useTabs();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("salary"); // Varsayılan olarak maaş tab'ı açık
  const { data: fetchedEmployee, isLoading, refetch } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) {
        logger.error('Error fetching employee:', error);
        throw error;
      }
      return data;
    },
    enabled: !!id,
  });

  // Tab başlığını çalışan bilgileri güncellendiğinde güncelle (useTabNavigation ilk yüklemede zaten yapıyor)
  useEffect(() => {
    const currentEmployee = employee || fetchedEmployee;
    if (currentEmployee && location.pathname && employee) {
      // Sadece employee state'i güncellendiğinde (sayfa içi güncellemeler için)
      const employeeName = `${currentEmployee.first_name} ${currentEmployee.last_name}`;
      updateTabTitle(location.pathname, employeeName);
    }
  }, [employee, location.pathname, updateTabTitle]);
  const handleEdit = () => {
    navigate(`/employees/${id}/edit`);
  };
  const handleEmployeeUpdate = (updatedEmployee: Employee) => {
    setEmployee(updatedEmployee);
  };
  const currentEmployee = employee || fetchedEmployee;
  if (isLoading) {
    return (
    <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin"></div>
            <span className="text-gray-600">Çalışan bilgileri yükleniyor...</span>
          </div>
        </div>
  );
  }
  if (!currentEmployee) {
    return (
    <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Çalışan bulunamadı</h2>
          <p className="text-gray-600">Bu çalışan mevcut değil veya silinmiş olabilir.</p>
        </div>
  );
  }
  return (
    <>
      <EmployeeHeader
        employee={currentEmployee}
        id={id || ''}
        onEdit={handleEdit}
        onUpdate={handleEmployeeUpdate}
      />
      <div className="space-y-4 mt-4">
        <EmployeeInfo
          employee={currentEmployee}
          onUpdate={handleEmployeeUpdate}
        />
        <EmployeeDetailTabs 
          employee={currentEmployee} 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          refetch={() => { refetch(); }}
        />
      </div>
    </>
  );
};
export default EmployeeDetails;
