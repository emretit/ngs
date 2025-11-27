import { useState, useCallback, useRef } from 'react';
import { Calendar, dateFnsLocalizer, NavigateAction, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatDate } from '@/utils/dateUtils';
import { CalendarEvent, DEFAULT_EVENT_FILTERS } from '@/components/calendar/types';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { ModernCalendarHeader } from '@/components/calendar/ModernCalendarHeader';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { CalendarEventDialog } from '@/components/calendar/CalendarEventDialog';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/components/calendar/calendar-styles.css';

// Setup the localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: tr }),
  getDay,
  locales: { 'tr': tr },
});

type ViewType = 'month' | 'week' | 'day' | 'agenda';

// Çalışma saatleri için min/max değerleri (sadece saat kısmı kullanılır)
const minTime = new Date();
minTime.setHours(7, 0, 0);

const maxTime = new Date();
maxTime.setHours(21, 0, 0);

const GeneralCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [eventFilters, setEventFilters] = useState(DEFAULT_EVENT_FILTERS);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const calendarRef = useRef<any>(null);

  // Fetch all calendar data
  const calendarData = useCalendarData();

  // Convert data to calendar events
  const calendarEvents = useCalendarEvents({
    ...calendarData,
    eventFilters,
  });

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.resource.color,
        borderColor: event.resource.color,
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        padding: '2px 6px',
        fontWeight: '500',
      }
    };
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

  const onNavigateCalendar = useCallback((date: Date, viewParam?: View, action?: NavigateAction) => {
    setCurrentDate(date);
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
    <div className="space-y-4 p-4">
      {/* Modern Header */}
      <ModernCalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
      />

      {/* Filters */}
      <CalendarFilters
        eventFilters={eventFilters}
        onFilterChange={setEventFilters}
      />

      {/* Calendar */}
      <div className="modern-calendar bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div style={{ height: '700px' }} className="p-4">
          <Calendar
            ref={calendarRef}
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            date={currentDate}
            view={view}
            onNavigate={onNavigateCalendar}
            onView={(newView) => setView(newView as ViewType)}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day', 'agenda']}
            messages={{
              today: 'Bugün',
              previous: 'Geri',
              next: 'İleri',
              month: 'Ay',
              week: 'Hafta',
              day: 'Gün',
              agenda: 'Ajanda',
              noEventsInRange: 'Bu aralıkta etkinlik yok.',
              showMore: (total) => `+${total} daha`,
            }}
            formats={{
              // Ay görünümü - gün başlıkları (Pzt, Sal, Çar...)
              weekdayFormat: (date) => {
                const dayNames: { [key: number]: string } = {
                  0: 'Paz',
                  1: 'Pzt',
                  2: 'Sal',
                  3: 'Çar',
                  4: 'Per',
                  5: 'Cum',
                  6: 'Cts',
                };
                return dayNames[date.getDay()];
              },
              
              // Hafta görünümü - gün başlıkları (Pzt 24, Sal 25...)
              dayFormat: (date) => {
                const dayNames: { [key: number]: string } = {
                  0: 'Paz',
                  1: 'Pzt',
                  2: 'Sal',
                  3: 'Çar',
                  4: 'Per',
                  5: 'Cum',
                  6: 'Cts',
                };
                return `${dayNames[date.getDay()]} ${date.getDate()}`;
              },
              
              // Gün görünümü - ana başlık (27 Kasım Perşembe)
              dayHeaderFormat: (date) =>
                format(date, 'd MMMM, EEEE', { locale: tr }),
              
              // Hafta görünümü - üst başlık (24 - 30 Kasım 2025)
              dayRangeHeaderFormat: ({ start, end }) =>
                `${format(start, 'd', { locale: tr })} - ${format(end, 'd MMMM yyyy', { locale: tr })}`,
              
              // Ay görünümü - ana başlık (Kasım 2025)
              monthHeaderFormat: (date) =>
                format(date, 'MMMM yyyy', { locale: tr }),
              
              // Saat sütunu formatı (08:00, 09:00...)
              timeGutterFormat: (date) =>
                format(date, 'HH:mm', { locale: tr }),
              
              // Event saat gösterimi
              eventTimeRangeFormat: ({ start, end }) =>
                `${format(start, 'HH:mm', { locale: tr })} - ${format(end, 'HH:mm', { locale: tr })}`,
              
              // Ajanda görünümü
              agendaHeaderFormat: ({ start, end }) =>
                `${format(start, 'd MMMM', { locale: tr })} - ${format(end, 'd MMMM yyyy', { locale: tr })}`,
              agendaDateFormat: (date) =>
                format(date, 'd MMMM yyyy, EEEE', { locale: tr }),
              agendaTimeFormat: (date) =>
                format(date, 'HH:mm', { locale: tr }),
              agendaTimeRangeFormat: ({ start, end }) =>
                `${format(start, 'HH:mm', { locale: tr })} - ${format(end, 'HH:mm', { locale: tr })}`,
            }}
            popup
            selectable
            step={60}
            timeslots={1}
            min={minTime}
            max={maxTime}
            scrollToTime={new Date(1970, 1, 1, 8, 0, 0)}
          />
        </div>
      </div>

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
