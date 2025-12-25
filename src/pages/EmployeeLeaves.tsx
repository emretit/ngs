import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { LeaveSummaryCards } from "@/components/leaves/LeaveSummaryCards";
import { LeaveFilters } from "@/components/leaves/LeaveFilters";
import { LeaveTable } from "@/components/leaves/LeaveTable";
import { LeaveTimeline } from "@/components/leaves/LeaveTimeline";
import { LeaveDetailPanel } from "@/components/leaves/LeaveDetailPanel";
import { LeaveRequest, LeaveSummaryStats } from "@/components/leaves/types";
import { generateMockLeaves } from "@/components/leaves/mock";
import { List, Calendar as CalendarIcon } from "lucide-react";

// Utility: Bugün izinde olanları kontrol et
const isTodayOnLeave = (startDate: string, endDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return today >= start && today <= end;
};

// Utility: Yaklaşan 7 gün içinde mi kontrol et
const isUpcoming7Days = (startDate: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
};

// Utility: Bu ay içinde mi kontrol et
const isThisMonth = (date: string): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
};

// Utility: Tarih aralığı çakışması kontrolü
const isDateRangeOverlapping = (
  leaveStart: string,
  leaveEnd: string,
  filterStart?: Date,
  filterEnd?: Date
): boolean => {
  if (!filterStart && !filterEnd) return true;
  
  const leaveStartDate = new Date(leaveStart);
  const leaveEndDate = new Date(leaveEnd);
  
  if (filterStart && filterEnd) {
    // Her iki tarih de varsa: çakışma kontrolü
    return (
      (leaveStartDate <= filterEnd && leaveEndDate >= filterStart) ||
      (leaveStartDate >= filterStart && leaveStartDate <= filterEnd) ||
      (leaveEndDate >= filterStart && leaveEndDate <= filterEnd)
    );
  }
  
  if (filterStart) {
    return leaveEndDate >= filterStart;
  }
  
  if (filterEnd) {
    return leaveStartDate <= filterEnd;
  }
  
  return true;
};

const EmployeeLeaves = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Detail panel state
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // View toggle state
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Fetch leave requests
  const { data: leaves = [], isLoading, error, refetch } = useQuery({
    queryKey: ["leaves", userData?.company_id, statusFilter, startDate, endDate],
    queryFn: async () => {
      if (!userData?.company_id) {
        // Mock data fallback
        console.warn("Company ID not found, using mock data");
        return generateMockLeaves();
      }

      try {
        let query = supabase
          .from("leave_requests")
          .select(`
            *,
            employee:employees(id, full_name, first_name, last_name, department),
            approver:profiles(id, full_name, first_name, last_name)
          `)
          .order("created_at", { ascending: false });

        // Tenant/Company filter
        query = query.eq("tenant_id", userData.company_id);

        // Status filter
        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        // Date range filter (start_date ve end_date çakışanları dahil)
        if (startDate) {
          query = query.lte("start_date", startDate.toISOString().split("T")[0]);
        }
        if (endDate) {
          query = query.gte("end_date", endDate.toISOString().split("T")[0]);
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          console.error("Error fetching leaves:", queryError);
          // Fallback to mock data on error
          toast.warning("Veritabanı hatası, örnek veriler gösteriliyor");
          return generateMockLeaves();
        }

        // Process and calculate days
        const processedData: LeaveRequest[] = (data || []).map((leave: any) => {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          return {
            ...leave,
            days: leave.days || days,
            employee: leave.employee || null,
            approver: leave.approver || null,
          };
        });

        return processedData;
      } catch (err) {
        console.error("Error in leave query:", err);
        // Fallback to mock data
        toast.warning("Veri yüklenirken hata oluştu, örnek veriler gösteriliyor");
        return generateMockLeaves();
      }
    },
    enabled: true, // Always enabled, falls back to mock if needed
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Client-side filtering (search query + date range overlap)
  const filteredLeaves = useMemo(() => {
    let filtered = leaves;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((leave) => {
        const employee = leave.employee;
        const employeeName = employee
          ? (employee.full_name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim()).toLowerCase()
          : "";
        const department = (employee?.department || "").toLowerCase();
        const leaveType = leave.leave_type?.toLowerCase() || "";
        return (
          employeeName.includes(searchLower) ||
          department.includes(searchLower) ||
          leaveType.includes(searchLower)
        );
      });
    }

    // Date range overlap filter (client-side for better control)
    if (startDate || endDate) {
      filtered = filtered.filter((leave) =>
        isDateRangeOverlapping(leave.start_date, leave.end_date, startDate, endDate)
      );
    }

    return filtered;
  }, [leaves, searchQuery, startDate, endDate]);

  // Calculate summary stats
  const summaryStats: LeaveSummaryStats = useMemo(() => {
    const todayOnLeave = filteredLeaves.filter(
      (leave) => leave.status === "approved" && isTodayOnLeave(leave.start_date, leave.end_date)
    ).length;

    const pendingApprovals = filteredLeaves.filter((leave) => leave.status === "pending").length;

    const upcoming7Days = filteredLeaves.filter(
      (leave) =>
        (leave.status === "approved" || leave.status === "pending") &&
        isUpcoming7Days(leave.start_date) &&
        !isTodayOnLeave(leave.start_date, leave.end_date)
    ).length;

    const thisMonthTotal = filteredLeaves.filter((leave) => isThisMonth(leave.start_date)).length;

    return {
      todayOnLeave,
      pendingApprovals,
      upcoming7Days,
      thisMonthTotal,
    };
  }, [filteredLeaves]);

  // Filter handlers
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["leaves"] });
    refetch();
    toast.success("Veriler yenilendi");
  }, [queryClient, refetch]);

  const handleApprove = useCallback(async (id: string) => {
    // TODO: DB update will be added in next step
    toast.success("İzin talebi onaylandı");
    queryClient.invalidateQueries({ queryKey: ["leaves"] });
  }, [queryClient]);

  const handleReject = useCallback(async (id: string) => {
    // TODO: DB update will be added in next step
    toast.error("İzin talebi reddedildi");
    queryClient.invalidateQueries({ queryKey: ["leaves"] });
  }, [queryClient]);

  const handleSelectLeave = useCallback((id: string) => {
    setSelectedLeaveId(id);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedLeaveId(null), 300);
  }, []);

  if (error) {
    console.error("Error loading leaves:", error);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İzinler</h1>
          <p className="text-muted-foreground mt-1">
            Şirket genelindeki izin taleplerini görüntüleyin ve yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/employees/leaves/settings")}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Kurallar & Onaylar
          </Button>
          <Button onClick={() => navigate("/employees/leaves/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Yeni İzin Talebi
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <LeaveSummaryCards stats={summaryStats} isLoading={isLoading} />

      {/* Filters and View Toggle */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <LeaveFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onClear={handleClearFilters}
            onRefresh={handleRefresh}
          />
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-white">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              Liste
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Takvim
            </Button>
          </div>
        </div>
      </div>

      {/* Table or Timeline */}
      {viewMode === "list" ? (
        <LeaveTable
          leaves={filteredLeaves}
          isLoading={isLoading}
          onApprove={handleApprove}
          onReject={handleReject}
          onSelectLeave={handleSelectLeave}
        />
      ) : (
        <LeaveTimeline
          leaves={filteredLeaves}
          isLoading={isLoading}
          onSelectLeave={handleSelectLeave}
        />
      )}

      {/* Detail Panel */}
      <LeaveDetailPanel
        leaveId={selectedLeaveId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default EmployeeLeaves;

