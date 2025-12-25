import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { LeaveRequest } from "./types";
import { LeaveDetailPanel } from "./LeaveDetailPanel";

// Setup the localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: tr }),
  getDay,
  locales: { tr: tr },
});

interface LeaveCalendarProps {
  leaves: LeaveRequest[];
  isLoading?: boolean;
  onSelectLeave?: (id: string) => void;
}

// Status colors for calendar events
const statusColors: Record<string, string> = {
  pending: "#f59e0b", // amber-500
  approved: "#22c55e", // green-500
  rejected: "#ef4444", // red-500
  cancelled: "#6b7280", // gray-500
};

// İzin türü Türkçe karşılıkları
const getLeaveTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    annual: "Yıllık İzin",
    sick: "Mazeret İzni",
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

export const LeaveCalendar = ({ leaves, isLoading = false, onSelectLeave }: LeaveCalendarProps) => {
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Convert leaves to Calendar events
  const calendarEvents = useMemo(() => {
    return leaves.map((leave) => {
      const start = new Date(leave.start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(leave.end_date);
      end.setHours(23, 59, 59, 999);

      const employeeName = getEmployeeName(leave.employee);
      const leaveTypeLabel = getLeaveTypeLabel(leave.leave_type);

      return {
        id: leave.id,
        title: `${employeeName} - ${leaveTypeLabel}`,
        start: start,
        end: end,
        resource: {
          leave: leave,
          status: leave.status,
          employeeName: employeeName,
          leaveType: leaveTypeLabel,
          color: statusColors[leave.status] || statusColors.pending,
        },
      };
    });
  }, [leaves]);

  const handleSelectEvent = (event: any) => {
    const leaveId = event.resource.leave.id;
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

  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderColor: event.resource.color,
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "2px 4px",
        fontSize: "12px",
      },
    };
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
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div style={{ height: "600px" }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={["month", "week", "day", "agenda"]}
          defaultView="month"
          step={60}
          showMultiDayTimes
          messages={{
            today: "Bugün",
            previous: "Geri",
            next: "İleri",
            month: "Ay",
            week: "Hafta",
            day: "Gün",
            agenda: "Ajanda",
            noEventsInRange: "Bu aralıkta izin talebi bulunmuyor.",
            showMore: (total) => `+${total} daha`,
          }}
          formats={{
            weekdayFormat: (date) => {
              const dayNames: { [key: number]: string } = {
                0: "Paz",
                1: "Pzt",
                2: "Sal",
                3: "Çar",
                4: "Per",
                5: "Cum",
                6: "Cts",
              };
              return dayNames[date.getDay()];
            },
            dayFormat: (date) => {
              const dayNames: { [key: number]: string } = {
                0: "Paz",
                1: "Pzt",
                2: "Sal",
                3: "Çar",
                4: "Per",
                5: "Cum",
                6: "Cts",
              };
              return `${dayNames[date.getDay()]} ${date.getDate()}`;
            },
            dayHeaderFormat: (date) => format(date, "d MMMM, EEEE", { locale: tr }),
            dayRangeHeaderFormat: ({ start, end }) =>
              `${format(start, "d", { locale: tr })} - ${format(end, "d MMMM yyyy", { locale: tr })}`,
            monthHeaderFormat: (date) => format(date, "MMMM yyyy", { locale: tr }),
            timeGutterFormat: (date) => format(date, "HH:mm", { locale: tr }),
            eventTimeRangeFormat: ({ start, end }) =>
              `${format(start, "HH:mm", { locale: tr })} - ${format(end, "HH:mm", { locale: tr })}`,
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.pending }}></div>
          <span>Beklemede</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.approved }}></div>
          <span>Onaylandı</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.rejected }}></div>
          <span>Reddedildi</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors.cancelled }}></div>
          <span>İptal Edildi</span>
        </div>
      </div>

      {/* Detail Panel */}
      <LeaveDetailPanel leaveId={selectedLeaveId} isOpen={isDetailOpen} onClose={handleCloseDetail} />
    </div>
  );
};

