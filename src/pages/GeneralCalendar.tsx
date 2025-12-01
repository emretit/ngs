import { useState, useCallback, useMemo } from 'react';
import { CalendarEvent, DEFAULT_EVENT_FILTERS } from '@/components/calendar/types';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { ModernCalendarHeader } from '@/components/calendar/ModernCalendarHeader';
import { CalendarPageHeader } from '@/components/calendar/CalendarPageHeader';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CalendarEventDialog } from '@/components/calendar/CalendarEventDialog';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

const GeneralCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [eventFilters, setEventFilters] = useState(DEFAULT_EVENT_FILTERS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    const date = new Date(currentDate);
    let start: Date, end: Date;
    
    if (view === 'month') {
      start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    } else if (view === 'week') {
      start = new Date(date);
      start.setDate(date.getDate() - 14);
      end = new Date(date);
      end.setDate(date.getDate() + 14);
    } else if (view === 'day') {
      start = new Date(date);
      start.setDate(date.getDate() - 7);
      end = new Date(date);
      end.setDate(date.getDate() + 7);
    } else {
      start = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      end = new Date(date.getFullYear(), date.getMonth() + 2, 0);
    }
    
    return { start, end };
  }, [currentDate, view]);

  // Fetch calendar data with date range
  const calendarData = useCalendarData({
    startDate: dateRange.start,
    endDate: dateRange.end,
    enabled: true,
  });

  // Convert data to calendar events
  const calendarEvents = useCalendarEvents({
    ...calendarData,
    eventFilters,
  });

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedEvent(null);
  };

  const handleNavigate = useCallback((action: 'PREV' | 'NEXT' | 'TODAY') => {
    const newDate = new Date(currentDate);
    
    if (action === 'TODAY') {
      setCurrentDate(new Date());
      return;
    }

    if (view === 'month') {
      if (action === 'PREV') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    } else if (view === 'week') {
      if (action === 'PREV') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    } else if (view === 'day') {
      if (action === 'PREV') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    } else if (view === 'agenda') {
      if (action === 'PREV') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    }
    
    setCurrentDate(newDate);
  }, [currentDate, view]);

  const handleViewChange = useCallback((newView: ViewType) => {
    setView(newView);
  }, []);

  if (calendarData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Takvim yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-3 sm:-m-4 md:-m-6 flex flex-col min-h-[calc(100vh-60px)]">
      {/* Üst Kısım - Header, Filters, Navigation */}
      <div className="px-4 md:px-6 pt-4 space-y-4 flex-shrink-0">
        {/* Sayfa Header */}
        <CalendarPageHeader />

        {/* Filters */}
        <CalendarFilters
          eventFilters={eventFilters}
          onFilterChange={setEventFilters}
        />

        {/* Takvim Header - Navigasyon ve Görünüm Kontrolleri */}
        <ModernCalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={handleViewChange}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Calendar Grid - Full Width, Flex Grow */}
      <CalendarGrid
        events={calendarEvents}
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onSelectEvent={handleSelectEvent}
      />

      {/* Event Detail Dialog */}
      <CalendarEventDialog
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default GeneralCalendar;
