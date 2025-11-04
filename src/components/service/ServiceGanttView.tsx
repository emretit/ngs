import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  MapPin,
  AlertCircle,
  Clock,
  User,
  Users
} from "lucide-react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { formatDate, isSameDay } from "@/utils/dateUtils";
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { tr } from "date-fns/locale";

interface ServiceGanttViewProps {
  serviceRequests: ServiceRequest[];
  technicians: any[];
  onSelectService: (service: ServiceRequest) => void;
  onUpdateAssignment?: (serviceId: string, technicianId: string, startTime: Date, endTime: Date) => void;
}

type ViewMode = 'day' | 'week' | 'month';

const ServiceGanttView = ({
  serviceRequests,
  technicians,
  onSelectService,
  onUpdateAssignment
}: ServiceGanttViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('week');

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
  const getStatusBadge = (status: string) => {
    const badges = {
      new: { label: 'Yeni', class: 'bg-blue-100 text-blue-700' },
      assigned: { label: 'Atandı', class: 'bg-purple-100 text-purple-700' },
      in_progress: { label: 'Devam Ediyor', class: 'bg-yellow-100 text-yellow-700' },
      completed: { label: 'Tamamlandı', class: 'bg-green-100 text-green-700' },
      cancelled: { label: 'İptal', class: 'bg-red-100 text-red-700' },
    };
    return badges[status as keyof typeof badges] || badges.new;
  };

  // Tarih aralığını hesapla
  const dateRange = useMemo(() => {
    let start: Date, end: Date, days: number;

    if (viewMode === 'day') {
      start = new Date(currentDate);
      end = new Date(currentDate);
      days = 1;
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
      days = 7;
    } else { // month
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      days = end.getDate();
    }

    return { start, end, days };
  }, [currentDate, viewMode]);

  // Gün dizisini oluştur
  const dayHeaders = useMemo(() => {
    const days = [];
    for (let i = 0; i < dateRange.days; i++) {
      const date = addDays(dateRange.start, i);
      days.push(date);
    }
    return days;
  }, [dateRange]);

  // Filtrelenmiş teknisyenler
  const filteredTechnicians = useMemo(() => {
    if (!technicians) return [];
    return technicians.filter(tech => {
      if (searchQuery) {
        const fullName = `${tech.first_name} ${tech.last_name}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [technicians, searchQuery]);

  // Her teknisyen için servisleri grupla
  const technicianServices = useMemo(() => {
    const grouped = new Map();

    filteredTechnicians.forEach(tech => {
      const services = serviceRequests.filter(service =>
        service.assigned_technician === tech.id
      );
      grouped.set(tech.id, services);
    });

    return grouped;
  }, [serviceRequests, filteredTechnicians]);

  // Atanmamış servisler
  const unassignedServices = useMemo(() => {
    return serviceRequests.filter(service => !service.assigned_technician);
  }, [serviceRequests]);

  // Servisin hangi günlerde gösterileceğini hesapla
  const getServicePosition = (service: ServiceRequest, day: Date) => {
    const serviceDate = service.issue_date
      ? new Date(service.issue_date)
      : service.service_due_date
      ? new Date(service.service_due_date)
      : null;

    if (!serviceDate) return null;

    return isSameDay(serviceDate, day);
  };

  const handlePreviousDay = () => {
    if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNextDay = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Sürükle bırak işlemleri
  const handleDragStart = (e: React.DragEvent, service: ServiceRequest) => {
    e.dataTransfer.setData('serviceId', service.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, technicianId: string, date: Date) => {
    e.preventDefault();
    const serviceId = e.dataTransfer.getData('serviceId');

    if (serviceId && onUpdateAssignment) {
      // Başlangıç ve bitiş zamanını ayarla (08:00 - 17:00)
      const startTime = new Date(date);
      startTime.setHours(8, 0, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(17, 0, 0, 0);

      onUpdateAssignment(serviceId, technicianId, startTime, endTime);
    }
  };

  return (
    <div className="space-y-4">
      {/* Üst Kontrol Paneli */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Sol taraf - Tarih navigasyonu */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                <Calendar className="h-4 w-4 mr-2" />
                Bugün
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="ml-4 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-md border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  {viewMode === 'day' && format(currentDate, 'EEEE d MMMM yyyy', { locale: tr })}
                  {viewMode === 'week' && `${format(dateRange.start, 'd MMM', { locale: tr })} - ${format(dateRange.end, 'd MMM yyyy', { locale: tr })}`}
                  {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: tr })}
                </p>
              </div>
            </div>

            {/* Orta - Arama */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Teknisyen ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sağ taraf - View mode seçici */}
            <div className="flex gap-1 border rounded-md bg-muted/30">
              <Button
                variant={viewMode === 'day' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Gün
              </Button>
              <Button
                variant={viewMode === 'week' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Hafta
              </Button>
              <Button
                variant={viewMode === 'month' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Ay
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart Ana Bölüm */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col" style={{ height: 'calc(100vh - 250px)' }}>
            {/* Başlık Satırı */}
            <div className="flex border-b bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
              {/* Sol - Teknisyen Kolonu */}
              <div className="w-48 p-4 border-r bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold flex items-center gap-2 flex-shrink-0">
                <Users className="h-4 w-4" />
                <span>Teknisyenler</span>
              </div>
              {/* Sağ - Gün Başlıkları */}
              <div className="flex flex-1 overflow-x-auto">
                {dayHeaders.map((day, index) => {
                  const isToday = isSameDay(day, new Date());
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={index}
                      className={`flex-1 min-w-[120px] p-3 text-center border-r ${
                        isToday ? 'bg-blue-50 border-b-2 border-blue-400' :
                        isWeekend ? 'bg-orange-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`text-xs font-semibold ${
                        isToday ? 'text-blue-700' : isWeekend ? 'text-orange-700' : 'text-gray-600'
                      }`}>
                        {format(day, 'EEEE', { locale: tr })}
                      </div>
                      <div className={`text-sm font-bold mt-1 ${
                        isToday ? 'text-blue-800' : isWeekend ? 'text-orange-800' : 'text-gray-800'
                      }`}>
                        {format(day, 'dd MMM', { locale: tr })}
                      </div>
                      {isToday && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* İçerik Satırları - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {filteredTechnicians.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold text-muted-foreground">
                      Teknisyen bulunamadı
                    </p>
                  </div>
                </div>
              ) : (
                filteredTechnicians.map((tech, techIndex) => {
                  const techServices = technicianServices.get(tech.id) || [];

                  return (
                    <div
                      key={tech.id}
                      className="flex border-b hover:bg-blue-50/30 transition-colors"
                      style={{ minHeight: '80px' }}
                    >
                      {/* Sol - Teknisyen Adı */}
                      <div className="w-48 p-4 border-r bg-gradient-to-r from-gray-50 to-gray-100 flex items-center gap-3 flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border border-blue-200">
                          <User className="w-5 h-5 text-blue-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {tech.first_name} {tech.last_name}
                          </p>
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            <span>{techServices.length} servis</span>
                          </p>
                        </div>
                      </div>

                      {/* Sağ - Gün Hücreleri */}
                      <div className="flex flex-1 overflow-x-auto">
                        {dayHeaders.map((day, dayIndex) => {
                          const dayServices = techServices.filter(service =>
                            getServicePosition(service, day)
                          );
                          const isToday = isSameDay(day, new Date());
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                          return (
                            <div
                              key={dayIndex}
                              className={`flex-1 min-w-[120px] p-2 border-r relative ${
                                isToday ? 'bg-blue-50/40' :
                                isWeekend ? 'bg-orange-50/30' : 'bg-white'
                              } hover:bg-blue-50/20 transition-colors`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, tech.id, day)}
                            >
                              {/* Servis Kartları */}
                              {dayServices.map((service) => {
                                const priority = service.service_priority || 'medium';
                                const status = service.service_status || 'new';
                                const statusBadge = getStatusBadge(status);

                                return (
                                  <div
                                    key={service.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, service)}
                                    onClick={() => onSelectService(service)}
                                    className="mb-1.5 p-2 rounded-md cursor-move shadow-sm hover:shadow-md transition-all"
                                    style={{
                                      backgroundColor: getPriorityColor(priority),
                                      color: 'white'
                                    }}
                                  >
                                    <div className="text-xs font-semibold truncate mb-1">
                                      {service.service_title}
                                    </div>
                                    {service.service_location && (
                                      <div className="flex items-center gap-1 text-xs opacity-90 mb-1">
                                        <MapPin className="h-3 w-3" />
                                        <span className="truncate">{service.service_location}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="opacity-80">
                                        {format(new Date(service.issue_date || service.service_due_date || new Date()), 'HH:mm')}
                                      </span>
                                      <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs h-5">
                                        {statusBadge.label}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Boş alan göstergesi */}
                              {dayServices.length === 0 && (
                                <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-30 transition-opacity">
                                  <div className="text-center">
                                    <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-lg mx-auto"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alt Panel - Atanmamış Servisler */}
      {unassignedServices.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Atanmamış Servisler ({unassignedServices.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                💡 Servisleri sürükleyip teknisyenlere atayın
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {unassignedServices.map((service) => {
                const priority = service.service_priority || 'medium';
                const status = service.service_status || 'new';
                const statusBadge = getStatusBadge(status);

                return (
                  <div
                    key={service.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, service)}
                    onClick={() => onSelectService(service)}
                    className="p-3 rounded-lg cursor-move shadow-sm hover:shadow-md transition-all border-2"
                    style={{
                      backgroundColor: getPriorityColor(priority),
                      borderColor: getPriorityColor(priority),
                      color: 'white'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate mb-1">
                          {service.service_title}
                        </div>
                        {service.service_location && (
                          <div className="flex items-center gap-1 text-xs opacity-90">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{service.service_location}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs ml-2 flex-shrink-0">
                        {priority === 'urgent' ? 'Acil' :
                         priority === 'high' ? 'Yüksek' :
                         priority === 'medium' ? 'Orta' : 'Düşük'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 opacity-80">
                        <Clock className="h-3 w-3" />
                        <span>
                          {service.service_due_date
                            ? format(new Date(service.service_due_date), 'dd MMM', { locale: tr })
                            : 'Tarih yok'}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs h-5">
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alt Bilgi Paneli - Öncelik Göstergeleri */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Servisleri sürükleyip teknisyenlere ve tarihlere atayabilirsiniz</span>
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
    </div>
  );
};

export default ServiceGanttView;
