import { useState, memo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeList } from "@/components/employees/EmployeeList";
import EmployeesHeader from "@/components/employees/EmployeesHeader";
import EmployeesFilterBar from "@/components/employees/EmployeesFilterBar";
import { toast } from "sonner";
import type { ViewMode, Employee } from "@/types/employee";
import EmployeesBulkActions from "@/components/employees/EmployeesBulkActions";
import { BulkPayrollDialog } from "@/components/employees/BulkPayrollDialog";
import { BulkPaymentDialog } from "@/components/employees/BulkPaymentDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, FileDown, Building2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTranslation } from "react-i18next";

const Employees = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [bulkPayrollOpen, setBulkPayrollOpen] = useState(false);
  const [bulkPaymentOpen, setBulkPaymentOpen] = useState(false);

  // Real-time subscription - employees tablosundaki değişiklikleri dinle
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Subscribe to employees table changes
      const channel = supabase
        .channel('employees_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'employees',
            filter: `company_id=eq.${profile.company_id}`
          },
          (payload) => {
            console.log('🔄 Employee changed:', payload.eventType, payload.new || payload.old);
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['employee'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [queryClient]);

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

      const { data: employeesData, error: employeesError } = await query;
      
      if (employeesError) throw employeesError;
      
      console.log('Employees data:', employeesData);
      
      // Process data to use salary information directly from employees table
      const processedData = employeesData?.map(employee => {
        return {
          ...employee,
          net_salary: employee.net_salary || employee.salary_amount || 0,
          gross_salary: employee.gross_salary || 0,
          total_employer_cost: employee.total_employer_cost || 0,
          manual_employer_sgk_cost: employee.manual_employer_sgk_cost || 0,
          meal_allowance: employee.meal_allowance || 0,
          transport_allowance: employee.transport_allowance || 0,
          unemployment_employer_amount: employee.unemployment_employer_amount || 0,
          accident_insurance_amount: employee.accident_insurance_amount || 0,
        };
      }) || [];
      
      return processedData;
    },
    refetchOnMount: true, // Mount olduğunda yeniden yükleme
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch departments
  const { userData } = useCurrentUser();
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', userData.company_id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get unique positions
  const positions = Array.from(new Set(employees.map(emp => emp.position).filter(Boolean))) as string[];

  const formatCurrency = useCallback((amount: number | null | undefined) => {
    if (!amount) return "₺0";
    return new Intl.NumberFormat('tr-TR', { 
      style: 'currency', 
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  const exportToCSV = useCallback(() => {
    const headers = [
      'Ad Soyad',
      'E-posta',
      'Telefon',
      'Departman',
      'Pozisyon',
      'İşe Giriş Tarihi',
      'Doğum Tarihi',
      'Cinsiyet',
      'Medeni Durum',
      'Adres',
      'Şehir',
      'İlçe',
      'Posta Kodu',
      'Ülke',
      'TC/SSN',
      'Acil Durum Kişisi',
      'Acil Durum Telefon',
      'Acil Durum Yakınlık',
      'Brüt Maaş',
      'Net Maaş',
      'Toplam İşveren Maliyeti',
      'Yemek Yardımı',
      'Ulaşım Yardımı',
      'SGK İşveren Payı',
      'İşsizlik İşveren Payı',
      'İş Kazası Sigortası'
    ];

    const csvContent = [
      headers.join(','),
      ...employees.map(employee => [
        `"${employee.first_name} ${employee.last_name}"`,
        `"${employee.email || ''}"`,
        `"${employee.phone || ''}"`,
        `"${employee.department || ''}"`,
        `"${employee.position || ''}"`,
        `"${employee.hire_date || ''}"`,
        `"${employee.date_of_birth || ''}"`,
        `"${employee.gender || ''}"`,
        `"${employee.marital_status || ''}"`,
        `"${employee.address || ''}"`,
        `"${employee.city || ''}"`,
        `"${employee.district || ''}"`,
        `"${employee.postal_code || ''}"`,
        `"${employee.country || ''}"`,
        `"${employee.id_ssn || ''}"`,
        `"${employee.emergency_contact_name || ''}"`,
        `"${employee.emergency_contact_phone || ''}"`,
        `"${employee.emergency_contact_relation || ''}"`,
        employee.gross_salary || 0,
        employee.net_salary || 0,
        employee.total_employer_cost || 0,
        employee.meal_allowance || 0,
        employee.transport_allowance || 0,
        employee.manual_employer_sgk_cost || 0,
        employee.unemployment_employer_amount || 0,
        employee.accident_insurance_amount || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calisanlar_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [employees]);

  // Calculate employee stats
  const employeeStats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === 'aktif').length,
    inactive: employees.filter(emp => emp.status === 'pasif').length,
    onLeave: employees.filter(emp => emp.status === 'izinli').length,
    fullTime: employees.filter(emp => emp.employment_type === 'tam_zamanli').length,
    partTime: employees.filter(emp => emp.employment_type === 'yari_zamanli').length,
  };

  // Calculate total costs
  const totalCosts = employees.reduce((acc, employee) => ({
    gross_salary: acc.gross_salary + (employee.gross_salary || 0),
    net_salary: acc.net_salary + (employee.net_salary || 0),
    total_employer_cost: acc.total_employer_cost + (employee.total_employer_cost || 0),
  }), { gross_salary: 0, net_salary: 0, total_employer_cost: 0 });

  const handleEmployeeSelect = useCallback((employee: Employee) => {
    setSelectedEmployees(prev => {
      const isSelected = prev.some(e => e.id === employee.id);
      return isSelected 
        ? prev.filter(e => e.id !== employee.id) 
        : [...prev, employee];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedEmployees([]);
  }, []);

  const handleBulkPayroll = useCallback(() => {
    if (selectedEmployees.length === 0) {
      toast.error("Lütfen tahakkuk yapılacak çalışanları seçin");
      return;
    }
    setBulkPayrollOpen(true);
  }, [selectedEmployees.length]);

  const handleBulkPayment = useCallback(() => {
    if (selectedEmployees.length === 0) {
      toast.error("Lütfen ödeme yapılacak çalışanları seçin");
      return;
    }
    setBulkPaymentOpen(true);
  }, [selectedEmployees.length]);

  if (error) {
    toast.error(t("pages.employees.loadError"));
    console.error("Error loading employees:", error);
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <EmployeesHeader 
        viewMode={viewMode} 
        setViewMode={setViewMode}
        employeeStats={employeeStats}
        totalCosts={totalCosts}
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

      {/* Bulk Actions - her zaman göster (müşteriler sayfası ile tutarlılık) */}
      <EmployeesBulkActions
        selectedEmployees={selectedEmployees}
        onClearSelection={handleClearSelection}
        onBulkPayroll={handleBulkPayroll}
        onBulkPayment={handleBulkPayment}
      />


      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">{t("pages.employees.loading")}</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500">{t("pages.employees.loadError")}</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="pb-6">
            <EmployeeList
              employees={employees}
              isLoading={isLoading}
              viewMode={viewMode}
              onEmployeeSelectToggle={handleEmployeeSelect}
              selectedEmployees={selectedEmployees}
              setSelectedEmployees={setSelectedEmployees}
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <BulkPayrollDialog
        open={bulkPayrollOpen}
        onOpenChange={setBulkPayrollOpen}
        selectedEmployees={selectedEmployees}
      />

      <BulkPaymentDialog
        open={bulkPaymentOpen}
        onOpenChange={setBulkPaymentOpen}
        selectedEmployees={selectedEmployees}
      />
    </div>
  );
};

export default memo(Employees);