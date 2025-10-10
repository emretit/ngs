import { Receipt, FileText, CreditCard, FileStack, Clock, TrendingUp, User, DollarSign, Calendar, BarChart2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CustomTabs, 
  CustomTabsContent, 
  CustomTabsList, 
  CustomTabsTrigger 
} from "@/components/ui/custom-tabs";
import { EmployeeSalaryTab } from "./tabs/EmployeeSalaryTab";
import { Employee } from "@/types/employee";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeTabsProps {
  employee: Employee;
  activeTab: string;
  setActiveTab: (value: string) => void;
  refetch: () => Promise<void>;
}

export const EmployeeTabs = ({ employee, activeTab, setActiveTab, refetch }: EmployeeTabsProps) => {
  // Fetch counts for each tab
  const { data: tabCounts } = useQuery({
    queryKey: ['employee-tab-counts', employee.id],
    queryFn: async () => {
      const [salaryRes, leaveRes, performanceRes] = await Promise.all([
        supabase
          .from('employee_salaries')
          .select('id', { count: 'exact' })
          .eq('employee_id', employee.id),
        supabase
          .from('employee_leaves')
          .select('id', { count: 'exact' })
          .eq('employee_id', employee.id),
        supabase
          .from('employee_performance')
          .select('id', { count: 'exact' })
          .eq('employee_id', employee.id),
      ]);

      return {
        salary: salaryRes.count || 0,
        leave: leaveRes.count || 0,
        performance: performanceRes.count || 0,
        documents: 0, // TODO: Implement documents count
      };
    },
  });

  const TabTrigger = ({ value, icon, label, count }: { 
    value: string; 
    icon: React.ReactNode; 
    label: string; 
    count?: number; 
  }) => (
    <CustomTabsTrigger 
      value={value} 
      className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-200 relative"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="hidden md:inline">{label}</span>
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
            {count}
          </Badge>
        )}
      </div>
    </CustomTabsTrigger>
  );

  const EmptyState = ({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <Card className="p-8">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Card>
  );

  return (
    <CustomTabs defaultValue="salary" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <CustomTabsList className="grid grid-cols-2 lg:grid-cols-4 w-full bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-1 shadow-sm">
        <TabTrigger 
          value="salary" 
          icon={<DollarSign className="h-4 w-4" />} 
          label="Maaş" 
          count={tabCounts?.salary}
        />
        <TabTrigger 
          value="leave" 
          icon={<Calendar className="h-4 w-4" />} 
          label="İzin" 
          count={tabCounts?.leave}
        />
        <TabTrigger 
          value="performance" 
          icon={<BarChart2 className="h-4 w-4" />} 
          label="Performans" 
          count={tabCounts?.performance}
        />
        <TabTrigger 
          value="documents" 
          icon={<FileStack className="h-4 w-4" />} 
          label="Belgeler" 
          count={tabCounts?.documents}
        />
      </CustomTabsList>

      <CustomTabsContent value="salary">
        <EmployeeSalaryTab employee={employee} />
      </CustomTabsContent>

      <CustomTabsContent value="leave">
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-gray-400" />}
          title="İzin Kayıtları"
          description="Çalışanın izin kayıtları ve kullanım durumu burada görüntülenecek."
        />
      </CustomTabsContent>

      <CustomTabsContent value="performance">
        <EmptyState
          icon={<BarChart2 className="w-8 h-8 text-gray-400" />}
          title="Performans Değerlendirmeleri"
          description="Çalışanın performans değerlendirmeleri ve hedefleri burada görüntülenecek."
        />
      </CustomTabsContent>


      <CustomTabsContent value="documents">
        <EmptyState
          icon={<FileStack className="w-8 h-8 text-gray-400" />}
          title="Belgeler"
          description="Çalışanın sözleşmeleri, sertifikaları ve diğer belgeleri burada görüntülenecek."
        />
      </CustomTabsContent>
    </CustomTabs>
  );
};
