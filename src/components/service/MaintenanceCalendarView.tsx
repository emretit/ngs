import React, { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getRecurrenceDescription } from '@/utils/serviceRecurrenceUtils';
import { formatDate } from '@/utils/dateUtils';
import { RefreshCw, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { ServiceRecurrenceService } from '@/services/serviceRecurrenceService';
import { toast } from '@/hooks/use-toast';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: tr }),
  getDay,
  locales: { 'tr': tr },
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    service: any;
    isTemplate: boolean;
    isInstance: boolean;
    recurrenceType: string;
  };
}

export const MaintenanceCalendarView: React.FC = () => {
  const { userData } = useCurrentUser();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch recurring service templates
  const { data: recurringTemplates, isLoading, refetch } = useQuery({
    queryKey: ['recurring-service-templates', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      return ServiceRecurrenceService.getRecurringTemplates(userData.company_id);
    },
    enabled: !!userData?.company_id,
  });

  // Generate calendar events from recurring templates
  const calendarEvents = useMemo(() => {
    if (!recurringTemplates) return [];

    const events: CalendarEvent[] = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Show next 3 months

    recurringTemplates.forEach((template) => {
      if (!template.is_recurring || template.recurrence_type === 'none') {
        return;
      }

      // Add template as an event
      if (template.next_recurrence_date) {
        const nextDate = new Date(template.next_recurrence_date);
        if (nextDate <= endDate) {
          events.push({
            id: `template-${template.id}`,
            title: `${template.service_title} (Şablon)`,
            start: nextDate,
            end: nextDate,
            resource: {
              service: template,
              isTemplate: true,
              isInstance: false,
              recurrenceType: template.recurrence_type,
            },
          });
        }
      }

      // Generate future instances
      let currentDate = template.next_recurrence_date
        ? new Date(template.next_recurrence_date)
        : new Date(template.service_reported_date || template.created_at);

      let instanceCount = 0;
      const maxInstances = 12; // Show up to 12 future instances

      while (currentDate <= endDate && instanceCount < maxInstances) {
        if (template.recurrence_end_date && currentDate > new Date(template.recurrence_end_date)) {
          break;
        }

        events.push({
          id: `instance-${template.id}-${instanceCount}`,
          title: template.service_title,
          start: new Date(currentDate),
          end: new Date(currentDate),
          resource: {
            service: template,
            isTemplate: false,
            isInstance: true,
            recurrenceType: template.recurrence_type,
          },
        });

        // Calculate next date based on recurrence type
        const interval = template.recurrence_interval || 1;
        switch (template.recurrence_type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + interval);
            break;
          case 'weekly':
            if (template.recurrence_days && template.recurrence_days.length > 0) {
              // Find next day in recurrence_days
              for (let i = 1; i <= 7; i++) {
                currentDate.setDate(currentDate.getDate() + 1);
                const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
                if (template.recurrence_days.includes(dayOfWeek)) {
                  break;
                }
              }
            } else {
              currentDate.setDate(currentDate.getDate() + (interval * 7));
            }
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + interval);
            if (template.recurrence_day_of_month) {
              const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
              currentDate.setDate(Math.min(template.recurrence_day_of_month, daysInMonth));
            }
            break;
        }

        instanceCount++;
      }
    });

    return events;
  }, [recurringTemplates]);

  const handleRefreshInstances = async () => {
    setRefreshing(true);
    try {
      const count = await ServiceRecurrenceService.generateInstances();
      toast({
        title: 'Başarılı',
        description: `${count} yeni servis örneği oluşturuldu.`,
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Servis örnekleri oluşturulurken bir hata oluştu.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const isTemplate = event.resource.isTemplate;
    return {
      style: {
        backgroundColor: isTemplate ? '#3b82f6' : '#10b981',
        borderColor: isTemplate ? '#2563eb' : '#059669',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '12px',
        padding: '4px 8px',
        fontWeight: isTemplate ? '600' : '500',
      },
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Bakım Takvimi</h3>
              <Badge variant="outline">
                {recurringTemplates?.length || 0} tekrarlayan servis
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshInstances}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Örnekleri Oluştur
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          <div style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              step={60}
              showMultiDayTimes
              messages={{
                today: 'Bugün',
                previous: 'Geri',
                next: 'İleri',
                month: 'Ay',
                week: 'Hafta',
                day: 'Gün',
                agenda: 'Ajanda',
                noEventsInRange: 'Bu aralıkta bakım planı bulunmuyor',
              }}
              formats={{
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${formatDate(start, 'dd MMM')} - ${formatDate(end, 'dd MMM yyyy')}`,
              }}
              eventPropGetter={eventStyleGetter}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recurring Services List */}
      {recurringTemplates && recurringTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Tekrarlayan Servisler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recurringTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{template.service_title}</span>
                      <Badge variant="outline" className="text-xs">
                        {getRecurrenceDescription({
                          type: template.recurrence_type,
                          interval: template.recurrence_interval,
                          days: template.recurrence_days,
                          dayOfMonth: template.recurrence_day_of_month,
                          endDate: template.recurrence_end_date
                            ? new Date(template.recurrence_end_date)
                            : undefined,
                        })}
                      </Badge>
                    </div>
                    {template.next_recurrence_date && (
                      <div className="text-sm text-muted-foreground">
                        Sonraki: {formatDate(template.next_recurrence_date, 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};




