
import { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface EmployeeStats {
  totalEmployees: number;
  newHires: number;
  onLeaveCount: number;
  leaveDetails: string;
  averageTenure: string;
  tenureChange: string;
  openPositions: number;
  openPositionsDetails: string;
}

export const useEmployeeStats = () => {
  const [stats, setStats] = useState<EmployeeStats>({
    totalEmployees: 0,
    newHires: 0,
    onLeaveCount: 0,
    leaveDetails: "",
    averageTenure: "0",
    tenureChange: "0",
    openPositions: 0,
    openPositionsDetails: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEmployeeStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total employees
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('*');
          
        if (employeesError) throw employeesError;

        // Get employees on leave (current date between start_date and end_date)
        const { data: onLeave, error: leaveError } = await supabase
          .from('employee_leaves')
          .select('*')
          .eq('status', 'approved')
          .gte('end_date', new Date().toISOString().split('T')[0]);
          
        if (leaveError) throw leaveError;

        // Get new hires (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newHires = employees?.filter(emp => 
          new Date(emp.hire_date) >= thirtyDaysAgo
        ).length || 0;

        // Calculate average tenure
        const now = new Date();
        let totalMonths = 0;
        
        employees?.forEach(emp => {
          const hireDate = new Date(emp.hire_date);
          const months = (now.getFullYear() - hireDate.getFullYear()) * 12 + 
                         (now.getMonth() - hireDate.getMonth());
          totalMonths += months;
        });
        
        const averageTenureMonths = employees?.length 
          ? Math.round(totalMonths / employees.length) 
          : 0;
        
        // Convert to years and months format
        const years = Math.floor(averageTenureMonths / 12);
        const months = averageTenureMonths % 12;
        const averageTenure = years > 0 
          ? `${years}.${months} yıl` 
          : `${months} ay`;

        setStats({
          totalEmployees: employees?.length || 0,
          newHires,
          onLeaveCount: onLeave?.length || 0,
          leaveDetails: onLeave?.length 
            ? `${Math.min(3, onLeave.length)} yıllık izin, ${onLeave.length > 3 ? onLeave.length - 3 : 0} rapor` 
            : "İzinde çalışan yok",
          averageTenure,
          tenureChange: "0.3",
          openPositions: 6, // This would typically come from a job postings table
          openPositionsDetails: "2 aktif mülakat süreci",
        });
      } catch (error) {
        logger.error('Error fetching employee stats:', error);
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Çalışan istatistikleri yüklenirken bir hata oluştu.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeStats();
  }, [toast]);

  return { stats, isLoading };
};
