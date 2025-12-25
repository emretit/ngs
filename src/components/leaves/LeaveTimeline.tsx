import { useMemo, useState } from "react";
import { format, addDays, subDays, startOfDay, isSameDay, eachDayOfInterval, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { LeaveRequest } from "./types";
import { LeaveDetailPanel } from "./LeaveDetailPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaveTimelineProps {
  leaves: LeaveRequest[];
  isLoading?: boolean;
  onSelectLeave?: (id: string) => void;
}

// İzin türü Türkçe karşılıkları
const getLeaveTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    annual: "Yıllık İzin",
    sick: "Hastalık İzni",
    medical: "Raporlu İzin",
    unpaid: "Ücretsiz İzin",
    official: "Resmî İzin",
    other: "Diğer",
  };
  return typeMap[type] || type;
};

// Employee name helper
const getEmployeeName = (employee: LeaveRequest["employee"]): string => {
  if (!employee) return "Bilinmiyor";
  if (employee.full_name) return employee.full_name;
  if (employee.first_name || employee.last_name) {
    return `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
  }
  return "Bilinmiyor";
};

// Employee initials
const getEmployeeInitials = (employee: LeaveRequest["employee"]): string => {
  if (!employee) return "?";
  if (employee.first_name && employee.last_name) {
    return `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();
  }
  if (employee.full_name) {
    const parts = employee.full_name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return employee.full_name[0].toUpperCase();
  }
  return "?";
};

// Day names in Turkish
const dayNames: { [key: number]: string } = {
  0: "Paz",
  1: "Pzt",
  2: "Sal",
  3: "Çar",
  4: "Per",
  5: "Cum",
  6: "Cts",
};

type ViewMode = "hourly" | "daily" | "weekly";

export const LeaveTimeline = ({ leaves, isLoading = false, onSelectLeave }: LeaveTimelineProps) => {
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [currentDateRange, setCurrentDateRange] = useState(() => {
    const today = new Date();
    const start = subDays(today, 7);
    const end = addDays(today, 14);
    return { start, end };
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate date columns based on date range
  const dateColumns = useMemo(() => {
    const dates = eachDayOfInterval({
      start: currentDateRange.start,
      end: currentDateRange.end,
    });
    return dates;
  }, [currentDateRange]);

  // Get unique employees from leaves
  const employees = useMemo(() => {
    const employeeMap = new Map<string, LeaveRequest["employee"]>();
    leaves.forEach((leave) => {
      if (leave.employee && leave.employee.id) {
        if (!employeeMap.has(leave.employee.id)) {
          employeeMap.set(leave.employee.id, leave.employee);
        }
      }
    });
    return Array.from(employeeMap.values());
  }, [leaves]);

  // Group leaves by employee
  const leavesByEmployee = useMemo(() => {
    const grouped = new Map<string, LeaveRequest[]>();
    leaves.forEach((leave) => {
      if (leave.employee?.id) {
        const employeeId = leave.employee.id;
        if (!grouped.has(employeeId)) {
          grouped.set(employeeId, []);
        }
        grouped.get(employeeId)!.push(leave);
      }
    });
    return grouped;
  }, [leaves]);

  // Calculate leave block position and width for a date range
  const getLeaveBlockInfo = (leave: LeaveRequest, date: Date, dateIndex: number) => {
    const leaveStart = startOfDay(new Date(leave.start_date));
    const leaveEnd = startOfDay(new Date(leave.end_date));
    const dateStart = startOfDay(date);

    // Check if this date is within the leave range
    if (dateStart < leaveStart || dateStart > leaveEnd) {
      return null;
    }

    // Calculate how many days this leave spans
    const totalDays = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Find the first visible day of this leave in the date range
    const firstVisibleDay = dateColumns.find((d) => {
      const dStart = startOfDay(d);
      return dStart >= leaveStart && dStart <= leaveEnd;
    });

    // Check if this is the first day of the leave in the visible range
    const isFirstDay = firstVisibleDay ? isSameDay(dateStart, firstVisibleDay) : isSameDay(dateStart, leaveStart);

    // Calculate how many columns this leave should span in the visible range
    const visibleStart = dateColumns.findIndex((d) => isSameDay(startOfDay(d), leaveStart));
    const visibleEnd = dateColumns.findIndex((d) => isSameDay(startOfDay(d), leaveEnd));
    
    let spanDays = totalDays;
    if (visibleStart >= 0 && visibleEnd >= 0) {
      spanDays = visibleEnd - visibleStart + 1;
    } else if (visibleStart >= 0) {
      spanDays = dateColumns.length - visibleStart;
    } else if (visibleEnd >= 0) {
      spanDays = visibleEnd + 1;
    }

    return {
      isFirstDay,
      totalDays,
      spanDays: Math.min(spanDays, totalDays),
      leave,
    };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      approved: "#22c55e", // green-500
      pending: "#f59e0b", // amber-500
      rejected: "#ef4444", // red-500
      cancelled: "#6b7280", // gray-500
    };
    return colors[status] || colors.pending;
  };

  const handleSelectLeave = (leaveId: string) => {
    setSelectedLeaveId(leaveId);
    setIsDetailOpen(true);
    if (onSelectLeave) {
      onSelectLeave(leaveId);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedLeaveId(null), 300);
  };

  const handlePreviousRange = () => {
    const days = viewMode === "weekly" ? 7 : viewMode === "daily" ? 1 : 1;
    setCurrentDateRange((prev) => ({
      start: subDays(prev.start, days),
      end: subDays(prev.end, days),
    }));
  };

  const handleNextRange = () => {
    const days = viewMode === "weekly" ? 7 : viewMode === "daily" ? 1 : 1;
    setCurrentDateRange((prev) => ({
      start: addDays(prev.start, days),
      end: addDays(prev.end, days),
    }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Takvim yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header Controls */}
      <div className="p-4 border-b space-y-3">
        {/* Date Range Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousRange}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-[200px] text-center">
              {format(currentDateRange.start, "d MMM yyyy", { locale: tr })} –{" "}
              {format(currentDateRange.end, "d MMM yyyy", { locale: tr })}
            </div>
            <Button variant="outline" size="icon" onClick={handleNextRange}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border rounded-lg p-1 bg-white">
            <Button
              variant={viewMode === "hourly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("hourly")}
              className="h-8"
            >
              Saatlik
            </Button>
            <Button
              variant={viewMode === "daily" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("daily")}
              className="h-8"
            >
              Günlük
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
              className="h-8"
            >
              Haftalık
            </Button>
          </div>

          {/* Unit Selector */}
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Birimi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Birimler</SelectItem>
              <SelectItem value="it">IT</SelectItem>
              <SelectItem value="hr">İnsan Kaynakları</SelectItem>
              <SelectItem value="sales">Satış</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "calc(100vh - 400px)" }}>
        <div className="inline-block min-w-full">
          {/* Header Row - Dates */}
          <div className="grid border-b bg-muted/30 sticky top-0 z-10" style={{ gridTemplateColumns: `256px repeat(${dateColumns.length}, 70px)` }}>
            <div className="border-r p-3 font-semibold text-sm bg-white sticky left-0 z-20">
              Çalışan
            </div>
            {dateColumns.map((date) => {
              const isToday = isSameDay(date, today);
              return (
                <div
                  key={date.toISOString()}
                  className={`border-r last:border-r-0 p-1.5 text-center ${
                    isToday ? "bg-blue-50" : ""
                  }`}
                  style={{ minWidth: "70px" }}
                >
                  <div className="text-xs font-medium text-muted-foreground">
                    {dayNames[getDay(date)]}
                  </div>
                  <div className={`text-sm font-semibold ${isToday ? "text-blue-600" : ""}`}>
                    {isToday ? "Bugün" : format(date, "d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Employee Rows */}
          <div className="divide-y">
            {employees.map((employee) => {
              const employeeLeaves = leavesByEmployee.get(employee.id || "") || [];
              return (
                <div
                  key={employee.id}
                  className="grid hover:bg-muted/30"
                  style={{ gridTemplateColumns: `256px repeat(${dateColumns.length}, 70px)`, minHeight: "60px" }}
                >
                  {/* Employee Column */}
                  <div className="border-r p-3 bg-white sticky left-0 z-10 flex items-center gap-3">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="text-xs">
                        {getEmployeeInitials(employee)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {getEmployeeName(employee)}
                      </div>
                      {employee.department && (
                        <div className="text-xs text-muted-foreground truncate">
                          {employee.department}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Columns */}
                  {dateColumns.map((date, dateIndex) => {
                    const isToday = isSameDay(date, today);
                    const leaveOnThisDate = employeeLeaves.find((leave) => {
                      const leaveStart = startOfDay(new Date(leave.start_date));
                      const leaveEnd = startOfDay(new Date(leave.end_date));
                      const dateStart = startOfDay(date);
                      return dateStart >= leaveStart && dateStart <= leaveEnd;
                    });

                    const blockInfo = leaveOnThisDate
                      ? getLeaveBlockInfo(leaveOnThisDate, date, dateIndex)
                      : null;

                    return (
                      <div
                        key={date.toISOString()}
                        className={`border-r last:border-r-0 relative ${
                          isToday ? "bg-blue-50" : ""
                        }`}
                        style={{ minWidth: "70px", minHeight: "60px" }}
                      >
                        {blockInfo?.isFirstDay && leaveOnThisDate && (
                          <button
                            onClick={() => handleSelectLeave(leaveOnThisDate.id)}
                            className="absolute top-1 bottom-1 left-1 hover:opacity-90 text-white rounded text-xs font-medium cursor-pointer transition-all flex items-center justify-center shadow-sm z-10"
                            style={{
                              backgroundColor: getStatusColor(leaveOnThisDate.status),
                              width: `calc(${blockInfo.spanDays} * 70px - 2px)`,
                              maxWidth: `calc(${Math.min(blockInfo.spanDays, dateColumns.length - dateIndex)} * 70px - 2px)`,
                              minWidth: "60px",
                            }}
                            title={`${getLeaveTypeLabel(leaveOnThisDate.leave_type)} ${leaveOnThisDate.days} gün - ${leaveOnThisDate.status === "approved" ? "Onaylandı" : leaveOnThisDate.status === "pending" ? "Beklemede" : "Reddedildi"}`}
                          >
                            <span className="truncate px-1.5 whitespace-nowrap text-[11px]">
                              {getLeaveTypeLabel(leaveOnThisDate.leave_type)} {leaveOnThisDate.days} gü
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <LeaveDetailPanel leaveId={selectedLeaveId} isOpen={isDetailOpen} onClose={handleCloseDetail} />
    </div>
  );
};

