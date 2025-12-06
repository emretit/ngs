import React, { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  User,
  Clock,
  AlertCircle,
  Filter,
} from "lucide-react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { formatDate } from "@/utils/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useNavigate } from "react-router-dom";

// Setup the localizer for react-big-calendar
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: tr }),
  getDay,
  locales: { 'tr': tr },
});

interface ServiceCalendarViewProps {
  serviceRequests: ServiceRequest[];
  technicians: any[];
  onSelectService: (service: ServiceRequest) => void;
  onUpdateAssignment?: (serviceId: string, technicianId: string, startTime: Date, endTime: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    service: ServiceRequest;
    priority: string;
    status: string;
    technician?: string;
    color: string;
  };
}

const ServiceCalendarView = ({
  serviceRequests,
  technicians,
  onSelectService,
}: ServiceCalendarViewProps) => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');

  // Öncelik renkleri
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e',
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  };

  // Durum renkleri
  const getStatusColor = (status: string) => {
    const colors = {
      new: '#3b82f6',
      assigned: '#a855f7',
      in_progress: '#eab308',
      completed: '#22c55e',
      cancelled: '#ef4444',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  // Filtrelenmiş servisler
  const filteredServices = useMemo(() => {
    return serviceRequests.filter(service => {
      const matchesSearch = !searchQuery || 
        service.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.service_location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'new' && (service.service_status === 'new' || service.service_status === 'assigned')) ||
        (statusFilter !== 'new' && service.service_status === statusFilter);
      
      const matchesPriority = priorityFilter === 'all' || service.service_priority === priorityFilter;
      
      const matchesTechnician = technicianFilter === 'all' || 
        service.assigned_technician === technicianFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesTechnician;
    });
  }, [serviceRequests, searchQuery, statusFilter, priorityFilter, technicianFilter]);

  // Takvim event'lerine dönüştür
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    filteredServices.forEach((service) => {
      // Servis tarihi varsa event oluştur
      const serviceDate = service.issue_date 
        ? new Date(service.issue_date)
        : service.service_due_date
        ? new Date(service.service_due_date)
        : null;

      if (!serviceDate) return;

      const priority = service.service_priority || 'medium';
      const status = service.service_status || 'new';
      const technician = technicians?.find(tech => tech.id === service.assigned_technician);
      const technicianName = technician 
        ? `${technician.first_name} ${technician.last_name}`
        : 'Atanmamış';

      // Bitiş tarihi hesaplama (varsayılan 2 saat)
      const endDate = service.service_due_date && service.issue_date
        ? new Date(service.service_due_date)
        : new Date(serviceDate.getTime() + 2 * 60 * 60 * 1000);

      // Event rengi: öncelik bazlı, ama tamamlanmış servisler için yeşil
      const eventColor = status === 'completed' 
        ? '#22c55e' 
        : getPriorityColor(priority);

      events.push({
        id: service.id,
        title: service.service_title || 'Servis',
        start: serviceDate,
        end: endDate,
        resource: {
          service,
          priority,
          status,
          technician: technicianName,
          color: eventColor,
        },
      });
    });

    return events;
  }, [filteredServices, technicians]);

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
        padding: '4px 8px',
        fontWeight: '500',
      }
    };
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedEvent(null);
  };

  const handleEditService = () => {
    if (selectedEvent) {
      onSelectService(selectedEvent.resource.service);
      handleCloseDetail();
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtreler */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Servis adı veya lokasyon ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="new">Yeni</SelectItem>
                <SelectItem value="assigned">Atandı</SelectItem>
                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="cancelled">İptal</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                <SelectItem value="urgent">Acil</SelectItem>
                <SelectItem value="high">Yüksek</SelectItem>
                <SelectItem value="medium">Orta</SelectItem>
                <SelectItem value="low">Düşük</SelectItem>
              </SelectContent>
            </Select>
            <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
              <SelectTrigger className="w-[180px]">
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Teknisyen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Teknisyenler</SelectItem>
                {technicians?.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.first_name} {tech.last_name}
                  </SelectItem>
                ))}
                <SelectItem value="unassigned">Atanmamış</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Takvim */}
      <Card>
        <CardContent className="p-6">
          <div style={{ height: 'calc(100vh - 350px)', minHeight: '600px' }}>
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
                noEventsInRange: 'Bu aralıkta servis bulunmuyor',
              }}
              formats={{
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${formatDate(start, 'dd MMM')} - ${formatDate(end, 'dd MMM yyyy')}`,
                dayHeaderFormat: (date) => formatDate(date, 'EEEE d MMMM'),
                monthHeaderFormat: (date) => formatDate(date, 'MMMM yyyy'),
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Öncelik Göstergeleri */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Servisleri tıklayarak detaylarını görüntüleyebilirsiniz</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-muted-foreground">Öncelik:</span>
              <div className="flex gap-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                  <span className="text-muted-foreground">Acil</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-muted-foreground">Yüksek</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }}></div>
                  <span className="text-muted-foreground">Orta</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                  <span className="text-muted-foreground">Düşük</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Servis Detay Dialog'u */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Servis Detayları
            </DialogTitle>
            <DialogDescription>
              Servis talebi detaylarını görüntüleyin
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  {selectedEvent.resource.service.service_title}
                </h3>
                {selectedEvent.resource.service.service_request_description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.resource.service.service_request_description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Durum</label>
                  <div className="mt-1">
                    <Badge 
                      variant="outline"
                      className={`${
                        selectedEvent.resource.status === 'new' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                        selectedEvent.resource.status === 'in_progress' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                        selectedEvent.resource.status === 'completed' ? 'border-green-500 text-green-700 bg-green-50' :
                        'border-gray-500 text-gray-700 bg-gray-50'
                      }`}
                    >
                      {selectedEvent.resource.status === 'new' ? 'Yeni' :
                       selectedEvent.resource.status === 'in_progress' ? 'Devam Ediyor' :
                       selectedEvent.resource.status === 'completed' ? 'Tamamlandı' :
                       selectedEvent.resource.status === 'assigned' ? 'Atandı' : 'Bilinmeyen'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Öncelik</label>
                  <div className="mt-1">
                    <Badge 
                      variant="outline"
                      className={`${
                        selectedEvent.resource.priority === 'urgent' ? 'border-red-500 text-red-700 bg-red-50' :
                        selectedEvent.resource.priority === 'high' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                        selectedEvent.resource.priority === 'medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                        'border-green-500 text-green-700 bg-green-50'
                      }`}
                    >
                      {selectedEvent.resource.priority === 'urgent' ? 'Acil' :
                       selectedEvent.resource.priority === 'high' ? 'Yüksek' :
                       selectedEvent.resource.priority === 'medium' ? 'Orta' : 'Düşük'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Teknisyen</label>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.resource.technician || 'Atanmamış'}</span>
                  </div>
                </div>

                {selectedEvent.resource.service.service_location && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Lokasyon</label>
                    <div 
                      className="mt-1 flex items-center gap-1 text-sm cursor-pointer hover:text-blue-600 transition-colors group"
                      onClick={() => {
                        navigate(`/service/map?serviceId=${selectedEvent.resource.service.id}`);
                        setIsDetailOpen(false);
                      }}
                      title="Haritada göster"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                      <span className="group-hover:text-blue-600">{selectedEvent.resource.service.service_location}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Başlangıç</label>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedEvent.start, 'dd MMM yyyy HH:mm')}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Bitiş</label>
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedEvent.end, 'dd MMM yyyy HH:mm')}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseDetail}>
                  Kapat
                </Button>
                <Button onClick={handleEditService}>
                  Düzenle
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceCalendarView;


