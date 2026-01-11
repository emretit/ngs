import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Calculator, 
  Settings, 
  Lock, 
  Unlock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Save,
  X,
  Loader2,
  Users
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import TimeTrackingCellDetail from "@/components/hr/TimeTrackingCellDetail";
import ShiftConfigurationSection from "@/components/hr/ShiftConfigurationSection";
import YearlyParametersSection from "@/components/hr/YearlyParametersSection";
import { calculatePayrollRun } from "@/services/payrollService";
import { useAuth } from "@/auth/AuthContext";
import { EmployeePayrollContent } from "@/pages/EmployeePayroll";
import { EmployeeListPanel } from "@/components/payroll/EmployeeListPanel";
import { PayrollEmptyState } from "@/components/payroll/PayrollEmptyState";
import TimePayrollHeader from "@/components/payroll/TimePayrollHeader";
import TimePayrollFilterBar from "@/components/payroll/TimePayrollFilterBar";
import TimePayrollBulkActions from "@/components/payroll/TimePayrollBulkActions";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";
import { BulkPayrollGenerator } from "@/components/payroll/BulkPayrollGenerator";

interface FilterState {
  companyId: string | null;
  workplaceId: string | null;
  departmentId: string | null;
  employeeId: string | null;
  periodYear: number;
  periodMonth: number;
  status: "draft" | "approved" | "locked" | "all";
}

interface TimesheetDay {
  id: string;
  employee_id: string;
  work_date: string;
  first_in_time: string | null;
  last_out_time: string | null;
  gross_duration_minutes: number;
  break_duration_minutes: number;
  net_working_minutes: number;
  overtime_minutes: number;
  status: string;
  approval_status: string;
}

interface PayrollItem {
  id: string;
  employee_id: string;
  gross_salary: number;
  overtime_pay: number;
  bonus_premium: number;
  sgk_base: number;
  income_tax_base: number;
  total_deductions: number;
  net_salary: number;
  total_employer_cost: number;
  warnings: string[];
}

const TimePayrollPage: React.FC = () => {
  const { companyId } = useCurrentCompany();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentDate = new Date();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "timesheet");
  const [filters, setFilters] = useState<FilterState>({
    companyId: companyId || null,
    workplaceId: null,
    departmentId: null,
    employeeId: searchParams.get("employeeId") || null,
    periodYear: currentDate.getFullYear(),
    periodMonth: currentDate.getMonth() + 1,
    status: "all",
  });

  // Update tab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", newTab);
    setSearchParams(newParams);
  };

  // Update employeeId filter when URL param changes
  useEffect(() => {
    const employeeIdParam = searchParams.get("employeeId");
    if (employeeIdParam) {
      setFilters(prev => ({ ...prev, employeeId: employeeIdParam }));
    }
  }, [searchParams]);

  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: Date } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkPayrollOpen, setBulkPayrollOpen] = useState(false);

  // State for bordro tab - selected employee for payroll calculation
  const [selectedEmployeeForPayroll, setSelectedEmployeeForPayroll] = useState<string | null>(
    searchParams.get("payrollEmployeeId") || null
  );

  // Update selected employee from URL
  useEffect(() => {
    const payrollEmployeeId = searchParams.get("payrollEmployeeId");
    if (payrollEmployeeId && activeTab === "payroll") {
      setSelectedEmployeeForPayroll(payrollEmployeeId);
    }
  }, [searchParams, activeTab]);

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department, gross_salary")
        
        .eq("status", "aktif")
        .order("first_name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch timesheet days for selected period
  const { data: timesheetDays = [] } = useQuery({
    queryKey: ["timesheet_days", companyId, filters.periodYear, filters.periodMonth, filters.employeeId, filters.departmentId],
    queryFn: async () => {
      if (!companyId) return [];
      
      let query = supabase
        .from("timesheet_days")
        .select("*")
        
        .gte("work_date", `${filters.periodYear}-${String(filters.periodMonth).padStart(2, "0")}-01`)
        .lte("work_date", `${filters.periodYear}-${String(filters.periodMonth).padStart(2, "0")}-${getDaysInMonth(new Date(filters.periodYear, filters.periodMonth - 1))}`);

      if (filters.employeeId) {
        query = query.eq("employee_id", filters.employeeId);
      } else if (filters.departmentId) {
        // Filter by department through employees
        const { data: deptEmployees } = await supabase
          .from("employees")
          .select("id")
          
          .eq("department", filters.departmentId);
        if (deptEmployees && deptEmployees.length > 0) {
          query = query.in("employee_id", deptEmployees.map(e => e.id));
        } else {
          return [];
        }
      }

      if (filters.status !== "all") {
        query = query.eq("approval_status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimesheetDay[];
    },
    enabled: !!companyId,
  });

  // Fetch payroll run for selected period
  const { data: payrollRun } = useQuery({
    queryKey: ["payroll_runs", companyId, filters.periodYear, filters.periodMonth],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from("payroll_runs")
        .select("*")
        
        .eq("payroll_period_year", filters.periodYear)
        .eq("payroll_period_month", filters.periodMonth)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch payroll items
  const { data: payrollItems = [] } = useQuery({
    queryKey: ["payroll_items", payrollRun?.id],
    queryFn: async () => {
      if (!payrollRun?.id) return [];
      const { data, error } = await supabase
        .from("payroll_items")
        .select("*")
        .eq("payroll_run_id", payrollRun.id)
        .order("employee_id");
      if (error) throw error;
      return data as PayrollItem[];
    },
    enabled: !!payrollRun?.id,
  });

  // Build monthly grid data
  const monthDays = useMemo(() => {
    const start = startOfMonth(new Date(filters.periodYear, filters.periodMonth - 1));
    const end = endOfMonth(new Date(filters.periodYear, filters.periodMonth - 1));
    return eachDayOfInterval({ start, end });
  }, [filters.periodYear, filters.periodMonth]);

  const filteredEmployees = useMemo(() => {
    let filtered = employees;
    if (filters.departmentId) {
      filtered = filtered.filter(emp => emp.department === filters.departmentId);
    }
    return filtered;
  }, [employees, filters.departmentId]);

  // Build grid data: employee rows x day columns
  const gridData = useMemo(() => {
    return filteredEmployees.map(employee => {
      const employeeDays = monthDays.map(date => {
        const dayStr = format(date, "yyyy-MM-dd");
        const timesheet = timesheetDays.find(
          ts => ts.employee_id === employee.id && ts.work_date === dayStr
        );
        return {
          date,
          timesheet,
        };
      });
      return {
        employee,
        days: employeeDays,
      };
    });
  }, [filteredEmployees, monthDays, timesheetDays]);

  const handleCellClick = (employeeId: string, date: Date) => {
    setSelectedCell({ employeeId, date });
    setDrawerOpen(true);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 border-green-200";
      case "absent":
        return "bg-red-100 text-red-800 border-red-200";
      case "late":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "half_day":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "leave":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "hr_locked":
        return <CheckCircle2 className="w-3 h-3 text-green-600" />;
      case "draft":
        return <Edit className="w-3 h-3 text-gray-400" />;
      default:
        return <AlertCircle className="w-3 h-3 text-yellow-600" />;
    }
  };

  const isLocked = payrollRun?.status === "locked" ||
    (timesheetDays.length > 0 && timesheetDays.every(ts => ts.approval_status === "hr_locked"));

  // Calculate stats
  const timesheetStats = {
    totalEmployees: employees.length,
    presentToday: timesheetDays.filter(ts => ts.status === 'present').length,
    totalHours: timesheetDays.reduce((sum, ts) => sum + (ts.net_working_minutes || 0), 0) / 60,
    overtimeHours: timesheetDays.reduce((sum, ts) => sum + (ts.overtime_minutes || 0), 0) / 60,
    calculatedPayrolls: payrollItems.length,
    totalCost: payrollItems.reduce((sum, item) => sum + (item.total_employer_cost || 0), 0),
  };

  return (
    <div className="space-y-1">
      {/* Header - Tek ve sabit */}
      <TimePayrollHeader 
        stats={timesheetStats}
        onCalculatePayroll={() => {
          setBulkPayrollOpen(true);
        }}
        onPayrollSettings={() => {
          setActiveTab("timesheet");
        }}
      />

      {/* Filter Bar */}
      <TimePayrollFilterBar
        searchQuery=""
        setSearchQuery={() => {}}
        selectedYear={filters.periodYear}
        setSelectedYear={(year) => setFilters({ ...filters, periodYear: year })}
        selectedMonth={filters.periodMonth}
        setSelectedMonth={(month) => setFilters({ ...filters, periodMonth: month })}
        selectedEmployee={filters.employeeId || 'all'}
        setSelectedEmployee={(empId) => setFilters({ ...filters, employeeId: empId === 'all' ? null : empId })}
        selectedStatus={filters.status}
        setSelectedStatus={(status: any) => setFilters({ ...filters, status })}
        employees={employees}
      />

      {/* Bulk Actions */}
      <TimePayrollBulkActions
        selectedCount={0}
        onClearSelection={() => {}}
        onBulkCalculate={() => {
          toast({ title: "Toplu hesaplama başlatılıyor..." });
        }}
        onBulkDownload={() => {
          toast({ title: "Excel indiriliyor..." });
        }}
      />

      {/* Tabs - Header'dan sonra, content'ten önce */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timesheet" className="gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Puantaj Takibi</span>
            <span className="sm:hidden">Puantaj</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Bordro Hesaplama</span>
            <span className="sm:hidden">Bordro</span>
          </TabsTrigger>
        </TabsList>

          {/* Timesheet Tab Content */}
          <TabsContent value="timesheet" className="mt-0">
            {/* Content Card - Tablolar burada */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-3 space-y-3">
            {/* Time Tracking Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Aylık Puantaj Tablosu
                </h3>
                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="w-3 h-3" />
                      Kilitli
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Unlock className="w-3 h-3" />
                      Düzenlenebilir
                    </Badge>
                  )}
                </div>
              </div>

              {/* Grid Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="sticky left-0 z-10 bg-gray-50 px-2 py-1 text-left font-medium text-xs">
                        Çalışan
                      </th>
                      {monthDays.map((date, idx) => (
                        <th
                          key={idx}
                          className="px-1 py-1 text-center font-medium min-w-[70px] border-l text-xs"
                        >
                          <div className="text-[10px]">{format(date, "EEE")}</div>
                          <div className="text-xs">{format(date, "dd")}</div>
                        </th>
                      ))}
                      <th className="px-2 py-1 text-right font-medium border-l text-xs">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gridData.map((row, rowIdx) => {
                      const totalHours = row.days.reduce(
                        (sum, day) => sum + (day.timesheet?.net_working_minutes || 0),
                        0
                      ) / 60;
                      
                      return (
                        <tr key={rowIdx} className="border-b hover:bg-gray-50">
                          <td className="sticky left-0 z-10 bg-white px-2 py-1 font-medium">
                            <div className="flex flex-col">
                              <span className="text-xs">
                                {row.employee.first_name} {row.employee.last_name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {row.employee.department || "Departman yok"}
                              </span>
                            </div>
                          </td>
                          {row.days.map((day, dayIdx) => {
                            const ts = day.timesheet;
                            return (
                              <td
                                key={dayIdx}
                                className="px-0.5 py-0.5 border-l cursor-pointer hover:bg-blue-50"
                                onClick={() => handleCellClick(row.employee.id, day.date)}
                              >
                                {ts ? (
                                  <div className={`rounded p-1 text-center border ${getStatusColor(ts.status)}`}>
                                    <div className="flex items-center justify-center gap-1">
                                      {getApprovalStatusIcon(ts.approval_status)}
                                      <span className="text-[10px] font-medium">
                                        {formatTime(ts.net_working_minutes)}
                                      </span>
                                    </div>
                                    {ts.overtime_minutes > 0 && (
                                      <div className="text-[9px] text-orange-600 font-semibold mt-0.5">
                                        +{formatTime(ts.overtime_minutes)}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="rounded p-1 bg-gray-50 text-center text-gray-400 text-[10px]">
                                    -
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-2 py-1 text-right font-medium border-l text-xs">
                            {totalHours.toFixed(1)}h
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Configuration Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-3 border-t">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    Vardiya Yapılandırması
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <ShiftConfigurationSection companyId={companyId || ""} isLocked={isLocked} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Yıllık Bordro Parametreleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <YearlyParametersSection companyId={companyId || ""} year={filters.periodYear} />
                </CardContent>
              </Card>
            </div>
            </div>
            </div>

            {/* Time Tracking Cell Detail Drawer */}
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Puantaj Detayı</SheetTitle>
                  <SheetDescription>
                    Çalışma saati bilgilerini görüntüleyin ve düzenleyin
                  </SheetDescription>
                </SheetHeader>
                {selectedCell && companyId && (
                  <TimeTrackingCellDetail
                    companyId={companyId}
                    employeeId={selectedCell.employeeId}
                    date={selectedCell.date}
                    isLocked={isLocked}
                  />
                )}
              </SheetContent>
            </Sheet>
          </TabsContent>

          {/* Payroll Tab Content */}
          <TabsContent value="payroll" className="mt-0">
            {/* Content Card - Tablolar burada */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-3 space-y-3">
                {/* Üstte Çalışan Seçici */}
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="flex-1">
                    <EmployeeSelector
                      value={selectedEmployeeForPayroll || ""}
                      onChange={(empId) => {
                        setSelectedEmployeeForPayroll(empId);
                        const newParams = new URLSearchParams(searchParams);
                        newParams.set("payrollEmployeeId", empId);
                        setSearchParams(newParams);
                      }}
                      companyId={companyId || undefined}
                      label="Bordro Görüntülenecek Çalışan"
                      placeholder="Çalışan seçin..."
                      showLabel={true}
                    />
                  </div>
                </div>

                {/* Bordro İçeriği */}
                <div>
                  {selectedEmployeeForPayroll && companyId ? (
                    <EmployeePayrollContent
                      employeeId={selectedEmployeeForPayroll}
                      companyId={companyId}
                      onBack={() => {
                        setSelectedEmployeeForPayroll(null);
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete("payrollEmployeeId");
                        setSearchParams(newParams);
                      }}
                      initialMonth={filters.periodMonth}
                      initialYear={filters.periodYear}
                    />
                  ) : (
                    <PayrollEmptyState />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

      {/* Bulk Payroll Generator Dialog */}
      <BulkPayrollGenerator
        open={bulkPayrollOpen}
        onOpenChange={setBulkPayrollOpen}
        initialYear={filters.periodYear}
        initialMonth={filters.periodMonth}
        onSuccess={(result) => {
          toast({
            title: "Başarılı!",
            description: `${result.successCount} çalışan için bordro oluşturuldu`,
          });
          queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
        }}
      />
    </div>
  );
};

export default TimePayrollPage;
