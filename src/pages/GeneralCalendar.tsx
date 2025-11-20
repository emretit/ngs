import { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Activity, ShoppingCart, Truck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Setup the localizer for react-big-calendar
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
    type: 'activity' | 'order' | 'delivery';
    data: any;
    color: string;
  };
}

const GeneralCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { userData } = useCurrentUser();
  const { getClient } = useAuth();
  const navigate = useNavigate();

  // Fetch Activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["calendar-activities", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("activities")
        .select(`
          *,
          assignee:assignee_id(
            id,
            first_name,
            last_name
          )
        `)
        .eq("company_id", userData.company_id)
        .not("due_date", "is", null)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ["calendar-orders", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("orders")
        .select(`
          *,
          customer:customers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("order_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Fetch Deliveries
  const { data: deliveries = [], isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ["calendar-deliveries", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const client = getClient();
      const { data, error } = await client
        .from("deliveries")
        .select(`
          *,
          customer:customers(
            id,
            name,
            company
          )
        `)
        .eq("company_id", userData.company_id)
        .order("planned_delivery_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id
  });

  // Convert all data to calendar events
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Activities
    activities.forEach((activity: any) => {
      if (activity.due_date) {
        events.push({
          id: `activity-${activity.id}`,
          title: activity.title || 'Başlıksız Görev',
          start: new Date(activity.due_date),
          end: new Date(activity.due_date),
          resource: {
            type: 'activity',
            data: activity,
            color: getActivityColor(activity.status)
          }
        });
      }
    });

    // Orders - Order Date
    orders.forEach((order: any) => {
      if (order.order_date) {
        events.push({
          id: `order-date-${order.id}`,
          title: `Sipariş: ${order.order_number || order.title}`,
          start: new Date(order.order_date),
          end: new Date(order.order_date),
          resource: {
            type: 'order',
            data: { ...order, eventType: 'order_date' },
            color: '#3b82f6' // blue
          }
        });
      }
      // Expected Delivery Date
      if (order.expected_delivery_date) {
        events.push({
          id: `order-expected-${order.id}`,
          title: `Beklenen Teslimat: ${order.order_number || order.title}`,
          start: new Date(order.expected_delivery_date),
          end: new Date(order.expected_delivery_date),
          resource: {
            type: 'order',
            data: { ...order, eventType: 'expected_delivery' },
            color: '#f59e0b' // amber
          }
        });
      }
      // Actual Delivery Date
      if (order.delivery_date) {
        events.push({
          id: `order-delivery-${order.id}`,
          title: `Teslimat: ${order.order_number || order.title}`,
          start: new Date(order.delivery_date),
          end: new Date(order.delivery_date),
          resource: {
            type: 'order',
            data: { ...order, eventType: 'delivery_date' },
            color: '#10b981' // green
          }
        });
      }
    });

    // Deliveries
    deliveries.forEach((delivery: any) => {
      if (delivery.planned_delivery_date) {
        events.push({
          id: `delivery-planned-${delivery.id}`,
          title: `Planlanan Teslimat: ${delivery.delivery_number || 'Teslimat'}`,
          start: new Date(delivery.planned_delivery_date),
          end: new Date(delivery.planned_delivery_date),
          resource: {
            type: 'delivery',
            data: { ...delivery, eventType: 'planned' },
            color: '#8b5cf6' // purple
          }
        });
      }
      if (delivery.actual_delivery_date) {
        events.push({
          id: `delivery-actual-${delivery.id}`,
          title: `Gerçekleşen Teslimat: ${delivery.delivery_number || 'Teslimat'}`,
          start: new Date(delivery.actual_delivery_date),
          end: new Date(delivery.actual_delivery_date),
          resource: {
            type: 'delivery',
            data: { ...delivery, eventType: 'actual' },
            color: '#10b981' // green
          }
        });
      }
    });

    return events;
  }, [activities, orders, deliveries]);

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'todo': return '#ef4444'; // red
      case 'in_progress': return '#eab308'; // yellow
      case 'completed': return '#22c55e'; // green
      case 'postponed': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

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

  const handleNavigateToDetail = () => {
    if (!selectedEvent) return;
    
    const { type, data } = selectedEvent.resource;
    
    switch (type) {
      case 'activity':
        navigate(`/activities/${data.id}`);
        break;
      case 'order':
        navigate(`/orders/${data.id}`);
        break;
      case 'delivery':
        navigate(`/deliveries/${data.id}`);
        break;
    }
    
    handleCloseDetail();
  };

  const isLoading = isLoadingActivities || isLoadingOrders || isLoadingDeliveries;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Genel Takvim
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm aktiviteler, siparişler ve teslimatlarınızı tek bir yerde görüntüleyin
          </p>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Renk Açıklamaları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-sm">Aktiviteler (Yapılacak)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }}></div>
              <span className="text-sm">Aktiviteler (Devam Ediyor)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
              <span className="text-sm">Aktiviteler (Tamamlandı)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-sm">Sipariş Tarihleri</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-sm">Beklenen Teslimatlar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
              <span className="text-sm">Planlanan Teslimatlar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-sm">Gerçekleşen Teslimatlar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
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
              }}
              formats={{
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${formatDate(start, 'dd/MM')} - ${formatDate(end, 'dd/MM')}`
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.resource.type === 'activity' && <Activity className="h-5 w-5" />}
              {selectedEvent?.resource.type === 'order' && <ShoppingCart className="h-5 w-5" />}
              {selectedEvent?.resource.type === 'delivery' && <Truck className="h-5 w-5" />}
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.resource.type === 'activity' && (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Durum:</span>
                    <Badge className="ml-2">{selectedEvent.resource.data.status}</Badge>
                  </div>
                  {selectedEvent.resource.data.description && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Açıklama:</span>
                      <p className="text-sm mt-1">{selectedEvent.resource.data.description}</p>
                    </div>
                  )}
                  {selectedEvent.resource.data.assignee && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Atanan:</span>
                      <p className="text-sm mt-1">
                        {selectedEvent.resource.data.assignee.first_name} {selectedEvent.resource.data.assignee.last_name}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Tarih:</span>
                    <p className="text-sm mt-1">{formatDate(selectedEvent.start, 'dd MMM yyyy')}</p>
                  </div>
                </div>
              )}

              {selectedEvent.resource.type === 'order' && (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Sipariş No:</span>
                    <p className="text-sm mt-1">{selectedEvent.resource.data.order_number}</p>
                  </div>
                  {selectedEvent.resource.data.customer && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Müşteri:</span>
                      <p className="text-sm mt-1">
                        {selectedEvent.resource.data.customer.name || selectedEvent.resource.data.customer.company}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Durum:</span>
                    <Badge className="ml-2">{selectedEvent.resource.data.status}</Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Tarih:</span>
                    <p className="text-sm mt-1">{formatDate(selectedEvent.start, 'dd MMM yyyy')}</p>
                  </div>
                  {selectedEvent.resource.data.total_amount && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Tutar:</span>
                      <p className="text-sm mt-1">
                        {selectedEvent.resource.data.total_amount.toLocaleString('tr-TR')} {selectedEvent.resource.data.currency}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedEvent.resource.type === 'delivery' && (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Teslimat No:</span>
                    <p className="text-sm mt-1">{selectedEvent.resource.data.delivery_number}</p>
                  </div>
                  {selectedEvent.resource.data.customer && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Müşteri:</span>
                      <p className="text-sm mt-1">
                        {selectedEvent.resource.data.customer.name || selectedEvent.resource.data.customer.company}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Durum:</span>
                    <Badge className="ml-2">{selectedEvent.resource.data.status}</Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Tarih:</span>
                    <p className="text-sm mt-1">{formatDate(selectedEvent.start, 'dd MMM yyyy')}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleNavigateToDetail} className="flex-1">
                  Detayları Gör
                </Button>
                <Button variant="outline" onClick={handleCloseDetail}>
                  Kapat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GeneralCalendar;

