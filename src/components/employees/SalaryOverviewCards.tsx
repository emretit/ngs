import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DollarSign, TrendingUp, Users, Calculator } from "lucide-react";

interface SalaryStats {
  totalEmployees: number;
  totalMonthlyCost: number;
  averageSalary: number;
  highestSalary: number;
  lowestSalary: number;
  departmentStats: Array<{
    department: string;
    count: number;
    avgSalary: number;
    totalCost: number;
  }>;
}

export const SalaryOverviewCards = () => {
  const [stats, setStats] = useState<SalaryStats>({
    totalEmployees: 0,
    totalMonthlyCost: 0,
    averageSalary: 0,
    highestSalary: 0,
    lowestSalary: 0,
    departmentStats: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSalaryStats();
  }, []);

  const fetchSalaryStats = async () => {
    try {
      // Get active employees with their latest salary records
      const { data: salaryData, error } = await supabase
        .from('employee_salaries')
        .select(`
          gross_salary,
          total_employer_cost,
          employees!inner (
            id,
            first_name,
            last_name,
            department,
            status
          )
        `)
        .eq('employees.status', 'aktif')
        .order('effective_date', { ascending: false });

      if (error) throw error;

      // Process data to get latest salary for each employee
      const employeeSalaries = new Map();
      salaryData?.forEach(record => {
        const employeeId = record.employees.id;
        if (!employeeSalaries.has(employeeId)) {
          employeeSalaries.set(employeeId, {
            ...record,
            employee: record.employees
          });
        }
      });

      const latestSalaries = Array.from(employeeSalaries.values());

      if (latestSalaries.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate statistics
      const totalEmployees = latestSalaries.length;
      const grossSalaries = latestSalaries.map(s => s.gross_salary);
      const totalCosts = latestSalaries.map(s => s.total_employer_cost);

      const totalMonthlyCost = totalCosts.reduce((sum, cost) => sum + cost, 0);
      const averageSalary = grossSalaries.reduce((sum, salary) => sum + salary, 0) / totalEmployees;
      const highestSalary = Math.max(...grossSalaries);
      const lowestSalary = Math.min(...grossSalaries);

      // Department statistics
      const deptMap = new Map();
      latestSalaries.forEach(record => {
        const dept = record.employee.department;
        if (!deptMap.has(dept)) {
          deptMap.set(dept, {
            department: dept,
            count: 0,
            totalSalary: 0,
            totalCost: 0
          });
        }
        const deptData = deptMap.get(dept);
        deptData.count += 1;
        deptData.totalSalary += record.gross_salary;
        deptData.totalCost += record.total_employer_cost;
      });

      const departmentStats = Array.from(deptMap.values()).map(dept => ({
        ...dept,
        avgSalary: dept.totalSalary / dept.count
      }));

      setStats({
        totalEmployees,
        totalMonthlyCost,
        averageSalary,
        highestSalary,
        lowestSalary,
        departmentStats
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Maaş istatistikleri yüklenirken hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ana İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Toplam Çalışan
                </p>
                <p className="text-2xl font-bold">
                  {stats.totalEmployees}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aylık Toplam Maliyet
                </p>
                <p className="text-2xl font-bold">
                  ₺{stats.totalMonthlyCost.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Ortalama Maaş
                </p>
                <p className="text-2xl font-bold">
                  ₺{stats.averageSalary.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Maaş Aralığı
                </p>
                <p className="text-lg font-bold">
                  ₺{stats.lowestSalary.toLocaleString('tr-TR')} - ₺{stats.highestSalary.toLocaleString('tr-TR')}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departman Bazında İstatistikler */}
      {stats.departmentStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Departman Bazında Maaş İstatistikleri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.departmentStats.map((dept, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{dept.department}</h4>
                    <Badge variant="secondary">{dept.count} kişi</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ortalama Maaş:</span>
                      <span className="font-medium">₺{dept.avgSalary.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Toplam Maliyet:</span>
                      <span className="font-medium">₺{dept.totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};