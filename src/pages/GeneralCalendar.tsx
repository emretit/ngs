import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarEvent, DEFAULT_EVENT_FILTERS, EventType } from '@/components/calendar/types';
import { useCalendarData } from '@/hooks/useCalendarData';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarFilters } from '@/components/calendar/CalendarFilters';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { CalendarEventDialog } from '@/components/calendar/CalendarEventDialog';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Setup the localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: tr }),
  getDay,
  locales: { 'tr': tr },
});

const GeneralCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [eventFilters, setEventFilters] = useState(DEFAULT_EVENT_FILTERS);

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
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedEvent(null);
  };

  if (calendarData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CalendarHeader onFilterToggle={() => setShowFilters(!showFilters)} />

      {showFilters && (
        <CalendarFilters
          eventFilters={eventFilters}
          onFilterChange={setEventFilters}
        />
      )}

      <CalendarLegend />

      <Card>
        <CardContent className="p-6">
          <div style={{ height: '700px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              messages={{
                today: 'Bugün',
                previous: 'Geri',
                next: 'İleri',
                month: 'Ay',
                week: 'Hafta',
                day: 'Gün',
                agenda: 'Ajanda',
              }}
              formats={{
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${formatDate(start, 'dd/MM')} - ${formatDate(end, 'dd/MM')}`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <CalendarEventDialog
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default GeneralCalendar;
