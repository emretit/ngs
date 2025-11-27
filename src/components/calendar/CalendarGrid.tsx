import { useRef, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, NavigateAction, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { CalendarEvent } from '@/components/calendar/types';
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

// Çalışma saatleri için min/max değerleri - 00:00'dan başlayıp 23:59'a kadar
const minTime = new Date();
minTime.setHours(0, 0, 0);

const maxTime = new Date();
maxTime.setHours(23, 59, 59);

interface CalendarGridProps {
  events: CalendarEvent[];
  currentDate: Date;
  view: ViewType;
  onDateChange: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarGrid = ({
  events,
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onSelectEvent,
}: CalendarGridProps) => {
  const calendarRef = useRef<any>(null);

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

  const onNavigateCalendar = useCallback((date: Date, viewParam?: View, action?: NavigateAction) => {
    onDateChange(date);
  }, [onDateChange]);

  return (
    <div 
      className={`modern-calendar flex-1 px-4 md:px-6 pb-4 ${
        view === 'month' || view === 'agenda' ? 'overflow-auto min-h-[800px]' : 'overflow-hidden'
      }`}
    >
      <Calendar
        ref={calendarRef}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        view={view}
        onNavigate={onNavigateCalendar}
        onView={(newView) => onViewChange(newView as ViewType)}
        onSelectEvent={onSelectEvent}
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
          dayHeaderFormat: (date) =>
            format(date, 'd MMMM, EEEE', { locale: tr }),
          dayRangeHeaderFormat: ({ start, end }) =>
            `${format(start, 'd', { locale: tr })} - ${format(end, 'd MMMM yyyy', { locale: tr })}`,
          monthHeaderFormat: (date) =>
            format(date, 'MMMM yyyy', { locale: tr }),
          timeGutterFormat: (date) =>
            format(date, 'HH:mm', { locale: tr }),
          eventTimeRangeFormat: ({ start, end }) =>
            `${format(start, 'HH:mm', { locale: tr })} - ${format(end, 'HH:mm', { locale: tr })}`,
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
        scrollToTime={new Date(1970, 1, 1, 0, 0, 0)}
        dayLayoutAlgorithm="no-overlap"
      />
    </div>
  );
};

