import { useState, useMemo, useCallback } from "react";
import { logger } from '@/utils/logger';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import LeavesHeader from "@/components/leaves/LeavesHeader";
import LeavesFilterBar from "@/components/leaves/LeavesFilterBar";
import LeavesContent from "@/components/leaves/LeavesContent";
import LeavesBulkActions from "@/components/leaves/LeavesBulkActions";
import { LeaveTimeline } from "@/components/leaves/LeaveTimeline";
import { LeaveDetailPanel } from "@/components/leaves/LeaveDetailPanel";
import { LeaveRequest, LeaveSummaryStats } from "@/components/leaves/types";

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

const LeaveRequests = () => {
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

  // Bulk selection state
  const [selectedLeaves, setSelectedLeaves] = useState<LeaveRequest[]>([]);

  // Fetch leave requests
  const { data: leaves = [], isLoading, error, refetch } = useQuery({
    queryKey: ["leaves", userData?.company_id, statusFilter, startDate, endDate],
    queryFn: async () => {
      if (!userData?.company_id) {
        logger.warn("Company ID not found");
        return [];
      }

      try {
        let query = supabase
          .from("employee_leaves")
          .select(`
            *,
            employee:employees(id, first_name, last_name, department)
          `)
          .order("created_at", { ascending: false });

        // Tenant/Company filter
        query = query.eq("company_id", userData.company_id);

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
          logger.error("Error fetching leaves:", queryError);
          toast.error("İzinler yüklenirken hata oluştu: " + queryError.message);
          return [];
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
            employee: leave.employee ? {
              ...leave.employee,
              full_name: `${leave.employee.first_name} ${leave.employee.last_name}`
            } : null,
            approver: null,
          };
        });

        return processedData;
      } catch (err: any) {
        logger.error("Error in leave query:", err);
        toast.error("Veri yüklenirken hata oluştu: " + (err.message || "Bilinmeyen hata"));
        return [];
      }
    },
    enabled: !!userData?.company_id,
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

  // Bulk actions
  const handleClearSelection = useCallback(() => {
    setSelectedLeaves([]);
  }, []);

  const handleBulkApprove = useCallback(async () => {
    // TODO: Implement bulk approval
    toast.success(`${selectedLeaves.length} izin talebi onaylandı`);
    setSelectedLeaves([]);
    queryClient.invalidateQueries({ queryKey: ["leaves"] });
  }, [selectedLeaves, queryClient]);

  const handleBulkReject = useCallback(async () => {
    // TODO: Implement bulk rejection
    toast.error(`${selectedLeaves.length} izin talebi reddedildi`);
    setSelectedLeaves([]);
    queryClient.invalidateQueries({ queryKey: ["leaves"] });
  }, [selectedLeaves, queryClient]);

  if (error) {
    logger.error("Error loading leaves:", error);
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <LeavesHeader 
        activeView={viewMode} 
        setActiveView={setViewMode}
        stats={summaryStats}
      />

      {/* Filters */}
      <LeavesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={statusFilter}
        setSelectedStatus={setStatusFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />
      
      {/* Bulk Actions */}
      {selectedLeaves.length > 0 && (
        <LeavesBulkActions 
          selectedLeaves={selectedLeaves}
          onClearSelection={handleClearSelection}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
        />
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">İzinler yükleniyor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500">İzinler yüklenirken bir hata oluştu</div>
        </div>
      ) : viewMode === "list" ? (
        <LeavesContent
          leaves={filteredLeaves}
          isLoading={isLoading}
          totalCount={filteredLeaves.length}
          error={error}
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

export default LeaveRequests;

