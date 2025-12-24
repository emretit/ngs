import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentCompany } from "@/hooks/useCurrentCompany";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  X
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
  const [searchParams] = useSearchParams();
  
  const currentDate = new Date();
  const [filters, setFilters] = useState<FilterState>({
    companyId: companyId || null,
    workplaceId: null,
    departmentId: null,
    employeeId: searchParams.get("employeeId") || null,
    periodYear: currentDate.getFullYear(),
    periodMonth: currentDate.getMonth() + 1,
    status: "all",
  });

  // Update employeeId filter when URL param changes
  useEffect(() => {
    const employeeIdParam = searchParams.get("employeeId");
    if (employeeIdParam) {
      setFilters(prev => ({ ...prev, employeeId: employeeIdParam }));
    }
  }, [searchParams]);

  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: Date } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ["employees", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department")
        .eq("company_id", companyId)
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
        .eq("company_id", companyId)
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
        .eq("company_id", companyId)
        .gte("work_date", `${filters.periodYear}-${String(filters.periodMonth).padStart(2, "0")}-01`)
        .lte("work_date", `${filters.periodYear}-${String(filters.periodMonth).padStart(2, "0")}-${getDaysInMonth(new Date(filters.periodYear, filters.periodMonth - 1))}`);

      if (filters.employeeId) {
        query = query.eq("employee_id", filters.employeeId);
      } else if (filters.departmentId) {
        // Filter by department through employees
        const { data: deptEmployees } = await supabase
          .from("employees")
          .select("id")
          .eq("company_id", companyId)
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
        .eq("company_id", companyId)
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
      case "normal":
        return "bg-green-100 text-green-800";
      case "missing":
        return "bg-red-100 text-red-800";
      case "edited":
        return "bg-yellow-100 text-yellow-800";
      case "holiday":
        return "bg-blue-100 text-blue-800";
      case "weekend":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Check if period is locked (either payroll run is locked OR all timesheets are HR locked)
  const isLocked = payrollRun?.status === "locked" || 
    (timesheetDays.length > 0 && timesheetDays.every(ts => ts.approval_status === "hr_locked"));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 md:p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white shadow-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Puantaj ve Bordro
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Çalışan puantaj takibi, bordro hesaplama ve onay yönetimi
            </p>
          </div>
        </div>
        {isLocked && (
          <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1.5">
            <Lock className="w-4 h-4" />
            Kilitli
          </Badge>
        )}
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 md:p-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Filters Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/50 rounded-lg border border-gray-100">
            <div className="space-y-2">
              <Label>Şirket</Label>
              <Select
                value={filters.companyId || "current"}
                onValueChange={(val) => setFilters({ ...filters, companyId: val === "current" ? null : val })}
                disabled
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şirket" />
                </SelectTrigger>
                <SelectContent>
                  {companyId && (
                    <SelectItem value={companyId}>Mevcut Şirket</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departman</Label>
              <Select
                value={filters.departmentId || "all"}
                onValueChange={(val) => setFilters({ ...filters, departmentId: val === "all" ? null : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Departmanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Departmanlar</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Çalışan</Label>
              <Select
                value={filters.employeeId || "all"}
                onValueChange={(val) => setFilters({ ...filters, employeeId: val === "all" ? null : val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Çalışanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Çalışanlar</SelectItem>
                  {filteredEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dönem Yılı</Label>
              <Input
                type="number"
                value={filters.periodYear}
                onChange={(e) => setFilters({ ...filters, periodYear: parseInt(e.target.value) || currentDate.getFullYear() })}
                min={2020}
                max={2100}
              />
            </div>

            <div className="space-y-2">
              <Label>Dönem Ayı</Label>
              <Select
                value={String(filters.periodMonth)}
                onValueChange={(val) => setFilters({ ...filters, periodMonth: parseInt(val) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <SelectItem key={month} value={String(month)}>
                      {format(new Date(2024, month - 1), "MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Durum</Label>
              <Select
                value={filters.status}
                onValueChange={(val: any) => setFilters({ ...filters, status: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Hepsi</SelectItem>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="approved">Onaylandı</SelectItem>
                  <SelectItem value="locked">Kilitli</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Tracking Grid Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Puantaj Takibi
              </h3>
              <div className="flex items-center gap-2">
                <Select
                  value={String(filters.periodMonth)}
                  onValueChange={(val) => setFilters({ ...filters, periodMonth: parseInt(val) })}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={String(month)}>
                        {format(new Date(2024, month - 1), "MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={filters.periodYear}
                  onChange={(e) => setFilters({ ...filters, periodYear: parseInt(e.target.value) || currentDate.getFullYear() })}
                  min={2020}
                  max={2100}
                  className="w-[80px] h-8 text-sm"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="w-full text-[10px]">
                <thead className="bg-muted/70">
                  <tr>
                    <th className="px-1.5 py-1 text-left font-semibold text-[10px] sticky left-0 bg-muted/70 z-10 border-r border-gray-300">Çalışan</th>
                    {monthDays.map((day) => (
                      <th key={day.toISOString()} className="px-0.5 py-1 text-center font-semibold text-[9px] w-[45px] border-r border-gray-300 last:border-r-0">
                        <div className="text-[10px] font-bold">
                          {format(day, "d")}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gridData.map((row) => (
                    <tr key={row.employee.id} className="border-b border-gray-200 hover:bg-muted/30">
                      <td className="px-1.5 py-0.5 font-medium text-[10px] sticky left-0 bg-background z-10 border-r border-gray-300 whitespace-nowrap">
                        {row.employee.first_name} {row.employee.last_name}
                      </td>
                      {row.days.map((day) => {
                        const ts = day.timesheet;
                        return (
                          <td
                            key={day.date.toISOString()}
                            className={`px-0.5 py-0.5 text-center border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-muted/50 align-top w-[45px] ${
                              isLocked ? "cursor-not-allowed opacity-50" : ""
                            }`}
                            onClick={() => !isLocked && handleCellClick(row.employee.id, day.date)}
                          >
                            {ts ? (
                              <div className="flex flex-col gap-0.5 leading-tight">
                                {/* In/Out Time - Single line */}
                                <div className="text-[8px] text-gray-600 leading-tight">
                                  {ts.first_in_time ? format(new Date(ts.first_in_time), "HH:mm") : "-"}
                                  {ts.last_out_time ? `/${format(new Date(ts.last_out_time), "HH:mm")}` : ""}
                                </div>
                                {/* Net Duration */}
                                <div className="text-[9px] font-semibold text-gray-900">
                                  {formatTime(ts.net_working_minutes)}
                                </div>
                                {/* Overtime - inline if exists */}
                                {ts.overtime_minutes > 0 && (
                                  <div className="text-[8px] text-orange-600 font-medium">
                                    OT:{formatTime(ts.overtime_minutes)}
                                  </div>
                                )}
                                {/* Status and Approval - Compact badges */}
                                <div className="flex flex-col gap-0.5 mt-0.5">
                                  <Badge className={`text-[7px] px-0.5 py-0 leading-tight h-3.5 ${getStatusColor(ts.status)}`}>
                                    {ts.status.substring(0, 3).toUpperCase()}
                                  </Badge>
                                  {ts.approval_status && (
                                    <Badge 
                                      className={`text-[7px] px-0.5 py-0 leading-tight h-3.5 ${
                                        ts.approval_status === "hr_locked" 
                                          ? "bg-red-500 text-white" 
                                          : ts.approval_status === "manager_approved"
                                          ? "bg-green-500 text-white"
                                          : "bg-gray-400 text-white"
                                      }`}
                                    >
                                      {ts.approval_status === "hr_locked" ? "L" : 
                                       ts.approval_status === "manager_approved" ? "A" : "D"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-muted-foreground text-[9px]">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval and Locking Logic Section */}
          <div className="space-y-3 sm:space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Onay ve Kilitleme
            </h3>
            <div className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Bordro hesaplaması için puantajları onaylayın. Kilitli dönemler salt okunurdur.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline">Taslak: {timesheetDays.filter(ts => ts.approval_status === "draft").length}</Badge>
                    <Badge variant="outline">Yönetici Onaylı: {timesheetDays.filter(ts => ts.approval_status === "manager_approved").length}</Badge>
                    <Badge variant="outline">İK Kilitli: {timesheetDays.filter(ts => ts.approval_status === "hr_locked").length}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {timesheetDays.some(ts => ts.approval_status === "draft") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!companyId || !user?.id) return;
                        const draftDays = timesheetDays.filter(ts => ts.approval_status === "draft");
                        if (draftDays.length === 0) return;

                        try {
                          // Check if user has manager role
                          const { data: userRole } = await supabase
                            .from("user_roles")
                            .select("role")
                            .eq("user_id", user.id)
                            .eq("company_id", companyId)
                            .maybeSingle();

                          const role = userRole?.role?.toLowerCase();
                          if (role !== "manager" && role !== "admin" && role !== "hr") {
                            toast({
                              title: "Erişim Reddedildi",
                              description: "Sadece yöneticiler, İK veya adminler puantajları onaylayabilir.",
                              variant: "destructive",
                            });
                            return;
                          }

                          // Approve all draft days
                          const { error } = await supabase
                            .from("timesheet_days")
                            .update({
                              approval_status: "manager_approved",
                              approved_by: user.id,
                              approved_at: new Date().toISOString(),
                              updated_by: user.id,
                            })
                            .in("id", draftDays.map(ts => ts.id));

                          if (error) throw error;

                          // Audit log
                          await supabase.from("audit_logs").insert({
                            company_id: companyId,
                            user_id: user.id,
                            action: "timesheet_bulk_approved",
                            entity_type: "timesheet_days",
                            changes: { count: draftDays.length, period: `${filters.periodYear}-${filters.periodMonth}` },
                          });

                          queryClient.invalidateQueries({ queryKey: ["timesheet_days"] });
                          toast({
                            title: "Puantajlar onaylandı",
                            description: `${draftDays.length} puantaj günü yönetici tarafından onaylandı.`,
                          });
                        } catch (error: any) {
                          toast({
                            title: "Hata",
                            description: error.message || "Puantajlar onaylanırken hata oluştu",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Tüm Taslakları Onayla
                    </Button>
                  )}
                  {timesheetDays.some(ts => ts.approval_status === "manager_approved") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!companyId || !user?.id) return;
                        const approvedDays = timesheetDays.filter(ts => ts.approval_status === "manager_approved");
                        if (approvedDays.length === 0) return;

                        try {
                          // Check if user has HR or admin role
                          const { data: userRole } = await supabase
                            .from("user_roles")
                            .select("role")
                            .eq("user_id", user.id)
                            .eq("company_id", companyId)
                            .maybeSingle();

                          const role = userRole?.role?.toLowerCase();
                          if (role !== "hr" && role !== "admin") {
                            toast({
                              title: "Erişim Reddedildi",
                              description: "Sadece İK veya adminler puantajları kilitleyebilir.",
                              variant: "destructive",
                            });
                            return;
                          }

                          // Lock all approved days
                          const { error } = await supabase
                            .from("timesheet_days")
                            .update({
                              approval_status: "hr_locked",
                              locked_by: user.id,
                              locked_at: new Date().toISOString(),
                              updated_by: user.id,
                            })
                            .in("id", approvedDays.map(ts => ts.id));

                          if (error) throw error;

                          // Audit log
                          await supabase.from("audit_logs").insert({
                            company_id: companyId,
                            user_id: user.id,
                            action: "timesheet_bulk_locked",
                            entity_type: "timesheet_days",
                            changes: { count: approvedDays.length, period: `${filters.periodYear}-${filters.periodMonth}` },
                          });

                          queryClient.invalidateQueries({ queryKey: ["timesheet_days"] });
                          toast({
                            title: "Puantajlar kilitlendi",
                            description: `${approvedDays.length} puantaj günü İK tarafından kilitlendi.`,
                          });
                        } catch (error: any) {
                          toast({
                            title: "Hata",
                            description: error.message || "Puantajlar kilitlenirken hata oluştu",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Tüm Onaylıları Kilitle
                    </Button>
                  )}
                  {timesheetDays.some(ts => ts.approval_status === "hr_locked") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!companyId || !user?.id) return;
                        const lockedDays = timesheetDays.filter(ts => ts.approval_status === "hr_locked");
                        if (lockedDays.length === 0) return;

                        const reason = prompt("Kilidi açma nedeni (zorunlu):");
                        if (!reason) return;

                        try {
                          // Check if user has admin role
                          const { data: userRole } = await supabase
                            .from("user_roles")
                            .select("role")
                            .eq("user_id", user.id)
                            .eq("company_id", companyId)
                            .maybeSingle();

                          const role = userRole?.role?.toLowerCase();
                          if (role !== "admin") {
                            toast({
                              title: "Erişim Reddedildi",
                              description: "Sadece adminler puantajların kilidini açabilir.",
                              variant: "destructive",
                            });
                            return;
                          }

                          // Unlock days (revert to manager_approved)
                          const { error } = await supabase
                            .from("timesheet_days")
                            .update({
                              approval_status: "manager_approved",
                              locked_by: null,
                              locked_at: null,
                              updated_by: user.id,
                            })
                            .in("id", lockedDays.map(ts => ts.id));

                          if (error) throw error;

                          // Audit log
                          await supabase.from("audit_logs").insert({
                            company_id: companyId,
                            user_id: user.id,
                            action: "timesheet_bulk_unlocked",
                            entity_type: "timesheet_days",
                            changes: { count: lockedDays.length, reason, period: `${filters.periodYear}-${filters.periodMonth}` },
                          });

                          queryClient.invalidateQueries({ queryKey: ["timesheet_days"] });
                          toast({
                            title: "Puantajların kilidi açıldı",
                            description: `${lockedDays.length} puantaj gününün kilidi açıldı.`,
                          });
                        } catch (error: any) {
                          toast({
                            title: "Hata",
                            description: error.message || "Puantajların kilidi açılırken hata oluştu",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Unlock className="w-4 h-4 mr-2" />
                      Tümünün Kilidini Aç
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Calculation Section */}
          <div className="space-y-3 sm:space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between pb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Bordro Hesaplama
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    if (!companyId || !user?.id) return;
                    try {
                      // Calculate payroll
                      const results = await calculatePayrollRun(
                        companyId,
                        filters.periodYear,
                        filters.periodMonth
                      );

                      // Create or update payroll run
                      const { data: existingRun } = await supabase
                        .from("payroll_runs")
                        .select("id")
                        .eq("company_id", companyId)
                        .eq("payroll_period_year", filters.periodYear)
                        .eq("payroll_period_month", filters.periodMonth)
                        .maybeSingle();

                      let payrollRunId: string;
                      if (existingRun) {
                        // Update existing run
                        const { data: updatedRun, error: updateError } = await supabase
                          .from("payroll_runs")
                          .update({
                            calculated_at: new Date().toISOString(),
                            calculated_by: user.id,
                            updated_by: user.id,
                          })
                          .eq("id", existingRun.id)
                          .select()
                          .single();
                        if (updateError) throw updateError;
                        payrollRunId = updatedRun.id;

                        // Delete old items
                        await supabase.from("payroll_items").delete().eq("payroll_run_id", payrollRunId);
                      } else {
                        // Create new run
                        const { data: newRun, error: createError } = await supabase
                          .from("payroll_runs")
                          .insert({
                            company_id: companyId,
                            payroll_period_year: filters.periodYear,
                            payroll_period_month: filters.periodMonth,
                            status: "draft",
                            calculated_at: new Date().toISOString(),
                            calculated_by: user.id,
                            created_by: user.id,
                          })
                          .select()
                          .single();
                        if (createError) throw createError;
                        payrollRunId = newRun.id;
                      }

                      // Insert payroll items
                      const itemsToInsert = results.map((result) => ({
                        company_id: companyId,
                        payroll_run_id: payrollRunId,
                        employee_id: result.employee_id,
                        base_salary: result.base_salary,
                        overtime_pay: result.overtime_pay,
                        bonus_premium: result.bonus_premium,
                        allowances_cash: result.allowances_cash,
                        allowances_in_kind: result.allowances_in_kind,
                        gross_salary: result.gross_salary,
                        sgk_base: result.sgk_base,
                        income_tax_base: result.income_tax_base,
                        sgk_employee_share: result.sgk_employee_share,
                        unemployment_employee: result.unemployment_employee,
                        income_tax_amount: result.income_tax_amount,
                        stamp_tax_amount: result.stamp_tax_amount,
                        advances: result.advances,
                        garnishments: result.garnishments,
                        total_deductions: result.total_deductions,
                        net_salary: result.net_salary,
                        sgk_employer_share: result.sgk_employer_share,
                        unemployment_employer: result.unemployment_employer,
                        accident_insurance: result.accident_insurance,
                        total_employer_cost: result.total_employer_cost,
                        warnings: result.warnings,
                        has_manual_override: false,
                        created_by: user.id,
                      }));

                      const { error: itemsError } = await supabase
                        .from("payroll_items")
                        .insert(itemsToInsert);
                      if (itemsError) throw itemsError;

                      // Calculate and insert totals
                      const totals = {
                        company_id: companyId,
                        payroll_run_id: payrollRunId,
                        total_gross_salary: results.reduce((sum, r) => sum + r.gross_salary, 0),
                        total_overtime_pay: results.reduce((sum, r) => sum + r.overtime_pay, 0),
                        total_bonus_premium: results.reduce((sum, r) => sum + r.bonus_premium, 0),
                        total_allowances: results.reduce((sum, r) => sum + r.allowances_cash + r.allowances_in_kind, 0),
                        total_sgk_employee: results.reduce((sum, r) => sum + r.sgk_employee_share, 0),
                        total_unemployment_employee: results.reduce((sum, r) => sum + r.unemployment_employee, 0),
                        total_income_tax: results.reduce((sum, r) => sum + r.income_tax_amount, 0),
                        total_stamp_tax: results.reduce((sum, r) => sum + r.stamp_tax_amount, 0),
                        total_deductions: results.reduce((sum, r) => sum + r.total_deductions, 0),
                        total_net_salary: results.reduce((sum, r) => sum + r.net_salary, 0),
                        total_sgk_employer: results.reduce((sum, r) => sum + r.sgk_employer_share, 0),
                        total_unemployment_employer: results.reduce((sum, r) => sum + r.unemployment_employer, 0),
                        total_accident_insurance: results.reduce((sum, r) => sum + r.accident_insurance, 0),
                        total_employer_cost: results.reduce((sum, r) => sum + r.total_employer_cost, 0),
                        employee_count: results.length,
                      };

                      const { data: existingTotals } = await supabase
                        .from("payroll_totals")
                        .select("id")
                        .eq("payroll_run_id", payrollRunId)
                        .maybeSingle();

                      if (existingTotals) {
                        await supabase
                          .from("payroll_totals")
                          .update(totals)
                          .eq("id", existingTotals.id);
                      } else {
                        await supabase.from("payroll_totals").insert(totals);
                      }

                      queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
                      queryClient.invalidateQueries({ queryKey: ["payroll_items"] });

                      toast({
                        title: "Bordro hesaplandı",
                        description: `${results.length} çalışan için bordro hesaplandı.`,
                      });
                    } catch (error: any) {
                      toast({
                        title: "Hata",
                        description: error.message || "Bordro hesaplanırken hata oluştu",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={isLocked}
                >
                  Bordro Hesapla
                </Button>
                {payrollRun && (
                  <>
                    {payrollRun.status === "locked" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!companyId || !user?.id) return;
                          const reason = prompt("Kilidi açma nedeni (zorunlu):");
                          if (!reason) return;

                          try {
                            const { error } = await supabase
                              .from("payroll_runs")
                              .update({
                                status: "approved",
                                unlock_reason: reason,
                                updated_by: user.id,
                              })
                              .eq("id", payrollRun.id);

                            if (error) throw error;

                            // Audit log
                            await supabase.from("audit_logs").insert({
                              company_id: companyId,
                              user_id: user.id,
                              action: "payroll_unlocked",
                              entity_type: "payroll_runs",
                              entity_id: payrollRun.id,
                              changes: { reason },
                            });

                            queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
                            toast({
                              title: "Bordro kilidi açıldı",
                              description: "Bordro döneminin kilidi açıldı.",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Hata",
                              description: error.message || "Bordro kilidi açılırken hata oluştu",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Unlock className="w-4 h-4 mr-2" />
                        Kilidi Aç
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!companyId || !user?.id) return;
                          try {
                            const { error } = await supabase
                              .from("payroll_runs")
                              .update({
                                status: "locked",
                                locked_by: user.id,
                                locked_at: new Date().toISOString(),
                                updated_by: user.id,
                              })
                              .eq("id", payrollRun.id);

                            if (error) throw error;

                            // Audit log
                            await supabase.from("audit_logs").insert({
                              company_id: companyId,
                              user_id: user.id,
                              action: "payroll_locked",
                              entity_type: "payroll_runs",
                              entity_id: payrollRun.id,
                              changes: {},
                            });

                            queryClient.invalidateQueries({ queryKey: ["payroll_runs"] });
                            toast({
                              title: "Bordro kilitlendi",
                              description: "Bordro dönemi kilitlendi.",
                            });
                          } catch (error: any) {
                            toast({
                              title: "Hata",
                              description: error.message || "Bordro kilitlenirken hata oluştu",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Kilitle
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {payrollItems.length > 0 ? (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left font-semibold">Çalışan</th>
                      <th className="p-3 text-right font-semibold">Brüt Maaş</th>
                      <th className="p-3 text-right font-semibold">Mesai Ücreti</th>
                      <th className="p-3 text-right font-semibold">Prim/İkramiye</th>
                      <th className="p-3 text-right font-semibold">SGK Matrahı</th>
                      <th className="p-3 text-right font-semibold">Gelir Vergisi Matrahı</th>
                      <th className="p-3 text-right font-semibold">Çalışan Kesintileri</th>
                      <th className="p-3 text-right font-semibold">Net Maaş</th>
                      <th className="p-3 text-right font-semibold">İşveren Maliyeti</th>
                      <th className="p-3 text-center font-semibold">Uyarılar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollItems.map((item) => {
                      const employee = employees.find(e => e.id === item.employee_id);
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">
                            {employee ? `${employee.first_name} ${employee.last_name}` : "Bilinmeyen"}
                          </td>
                          <td className="p-3 text-right">{item.gross_salary.toFixed(2)}</td>
                          <td className="p-3 text-right">{item.overtime_pay.toFixed(2)}</td>
                          <td className="p-3 text-right">{item.bonus_premium.toFixed(2)}</td>
                          <td className="p-3 text-right">{item.sgk_base.toFixed(2)}</td>
                          <td className="p-3 text-right">{item.income_tax_base.toFixed(2)}</td>
                          <td className="p-3 text-right">{item.total_deductions.toFixed(2)}</td>
                          <td className="p-3 text-right font-semibold">{item.net_salary.toFixed(2)}</td>
                          <td className="p-3 text-right">{item.total_employer_cost.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            {item.warnings && item.warnings.length > 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {item.warnings.length}
                              </Badge>
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Seçilen dönem için bordro verisi yok. Oluşturmak için "Bordro Hesapla" butonuna tıklayın.
              </div>
            )}
          </div>

          {/* Shift and Rule Engine Configuration Section */}
          <div className="space-y-3 sm:space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2">
              <Settings className="w-4 h-4 text-blue-600" />
              Vardiya ve Kural Yapılandırması
            </h3>
            <ShiftConfigurationSection companyId={companyId || ""} isLocked={isLocked} />
          </div>

          {/* Yearly Payroll Parameters Section */}
          <div className="space-y-3 sm:space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Yıllık Bordro Parametreleri
            </h3>
            <YearlyParametersSection companyId={companyId || ""} year={filters.periodYear} />
          </div>
        </div>
      </div>

      {/* Time Tracking Cell Detail Drawer - Right Side */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Time Tracking Details</SheetTitle>
            <SheetDescription>
              {selectedCell && (
                <>
                  {employees.find(e => e.id === selectedCell.employeeId)?.first_name}{" "}
                  {employees.find(e => e.id === selectedCell.employeeId)?.last_name} -{" "}
                  {selectedCell.date && format(selectedCell.date, "MMMM d, yyyy")}
                </>
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 overflow-y-auto">
            {selectedCell && (
              <TimeTrackingCellDetail
                companyId={companyId || ""}
                employeeId={selectedCell.employeeId}
                date={selectedCell.date}
                isLocked={isLocked}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TimePayrollPage;