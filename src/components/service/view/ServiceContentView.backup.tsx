
import React, { useState, useMemo, useCallback } from "react";
import { ServiceRequestTable } from "@/components/service/ServiceRequestTable";
import { DispatcherConsole } from "@/components/service/dispatcher/DispatcherConsole";
import { ViewType } from "./ServiceViewToggle";
import { ServiceRequest, useServiceRequests } from "@/hooks/useServiceRequests";
import { CalendarEvent } from "@/types/calendar-event";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarView.css';
import moment from 'moment';
import 'moment/locale/tr';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Users, Clock } from 'lucide-react';

interface ServiceContentViewProps {
  activeView: ViewType;
  searchQuery: string;
  statusFilter: string;
  technicianFilter: string;
  onSelectRequest: (request: ServiceRequest) => void;
}

// Türkçe moment lokali
moment.locale('tr');
  // const localizer = momentLocalizer(moment);

interface ServiceEvent extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  serviceRequest: ServiceRequest;
  technician?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
}

export const ServiceContentView: React.FC<ServiceContentViewProps> = ({
  activeView,
  searchQuery,
  statusFilter,
  technicianFilter,
  onSelectRequest
}) => {
  const [currentView, setCurrentView] = useState<'week' | 'day' | 'agenda'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: serviceRequests } = useServiceRequests();

  // Servis taleplerini kalendar eventlerine dönüştür
  const events = useMemo(() => {
    if (!serviceRequests) return [];

    return serviceRequests
      .filter(request => request.due_date) // Sadece tarih belirtilmiş olanlar
      .map(request => {
        const startDate = new Date(request.due_date!);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 saat varsayılan süre

        return {
          id: request.id,
          title: request.title,
          start: startDate,
          end: endDate,
          serviceRequest: request,
          technician: request.assigned_to || 'Atanmamış',
          priority: request.priority,
          status: request.status,
        } as ServiceEvent;
      });
  }, [serviceRequests]);

  // Event stil özelleştirmesi
  const eventStyleGetter = useCallback((event: ServiceEvent) => {
    const priorityColors = {
      urgent: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#22c55e',
    };
    
    return {
      style: {
        backgroundColor: priorityColors[event.priority],
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '12px',
      },
    };
  }, []);

  const views = ['week', 'day', 'agenda'];
  const getViewComponent = () => {
    switch (activeView) {
      case "dispatcher":
        return (
          <div className="h-full">
            <DispatcherConsole onSelectRequest={onSelectRequest} />
          </div>
        );
      case "calendar":
        return (
          <div className="h-full">
            <Card className="p-6 h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Dispatcher Console</h2>
                </div>
                
                {/* View Toggle */}
                <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
                  <TabsList>
                    <TabsTrigger value="day" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Günlük
                    </TabsTrigger>
                    <TabsTrigger value="week" className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      Haftalık
                    </TabsTrigger>
                    <TabsTrigger value="agenda" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Ajanda
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Split View */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-300px)]">
                {/* Calendar Section */}
                <div className="xl:col-span-3">
                  <div className="bg-white rounded-lg border p-4" style={{ height: '600px' }}>
                    <div className="h-full flex flex-col">
                      {/* Calendar Header */}
                      <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">Takvim Görünümü</h3>
                            <p className="text-sm text-slate-600">Servis taleplerini takvim üzerinde görüntüleyin</p>
                          </div>
                        </div>
                        <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
                          <Button
                            variant={currentView === 'week' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentView('week')}
                            className={`transition-all duration-200 ${currentView === 'week' ? 'shadow-md' : 'hover:bg-slate-50'}`}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Hafta
                          </Button>
                          <Button
                            variant={currentView === 'day' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentView('day')}
                            className={`transition-all duration-200 ${currentView === 'day' ? 'shadow-md' : 'hover:bg-slate-50'}`}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Gün
                          </Button>
                          <Button
                            variant={currentView === 'agenda' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentView('agenda')}
                            className={`transition-all duration-200 ${currentView === 'agenda' ? 'shadow-md' : 'hover:bg-slate-50'}`}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Ajanda
                          </Button>
                        </div>
                      </div>

                      {/* Calendar Component */}
                      <div className="flex-1 flex flex-col">
                        <Calendar
                          onChange={(value) => {
                            if (value instanceof Date) {
                              setSelectedDate(value);
                            } else if (Array.isArray(value) && value[0] instanceof Date) {
                              setSelectedDate(value[0]);
                            }
                          }}
                          value={selectedDate}
                          className="w-full h-full calendar-loading"
                          locale="tr-TR"
                          tileContent={({ date, view }) => {
                            // Bu tarihte servis talepleri var mı kontrol et
                            const dayEvents = events.filter(event => {
                              const eventDate = new Date(event.start);
                              return eventDate.toDateString() === date.toDateString();
                            });

                            if (dayEvents.length === 0) return null;

                            // Öncelik seviyelerine göre grupla
                            const urgentEvents = dayEvents.filter(e => e.priority === 'urgent');
                            const highEvents = dayEvents.filter(e => e.priority === 'high');
                            const mediumEvents = dayEvents.filter(e => e.priority === 'medium');
                            const lowEvents = dayEvents.filter(e => e.priority === 'low');

                            return (
                              <div className="w-full h-full relative">
                                {/* Event Count Badge */}
                                {dayEvents.length > 0 && (
                                  <div className="calendar-event-count">
                                    {dayEvents.length}
                                  </div>
                                )}

                                {/* Priority Dots */}
                                <div className="calendar-event-indicator">
                                  {urgentEvents.map((_, index) => (
                                    <div key={`urgent-${index}`} className="calendar-event-dot urgent" />
                                  ))}
                                  {highEvents.map((_, index) => (
                                    <div key={`high-${index}`} className="calendar-event-dot high" />
                                  ))}
                                  {mediumEvents.map((_, index) => (
                                    <div key={`medium-${index}`} className="calendar-event-dot medium" />
                                  ))}
                                  {lowEvents.map((_, index) => (
                                    <div key={`low-${index}`} className="calendar-event-dot low" />
                                  ))}
                                </div>
                              </div>
                            );
                          }}
                          tileClassName={({ date, view }) => {
                            const dayEvents = events.filter(event => {
                              const eventDate = new Date(event.start);
                              return eventDate.toDateString() === date.toDateString();
                            });
                            
                            if (dayEvents.length === 0) return '';
                            
                            // En yüksek öncelikli event'e göre renk ver
                            const hasUrgent = dayEvents.some(e => e.priority === 'urgent');
                            const hasHigh = dayEvents.some(e => e.priority === 'high');
                            const hasMedium = dayEvents.some(e => e.priority === 'medium');
                            
                            if (hasUrgent) return 'has-urgent-events';
                            if (hasHigh) return 'has-high-events';
                            if (hasMedium) return 'has-medium-events';
                            return 'has-low-events';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Selected Date Events Panel */}
                <div className="xl:col-span-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 overflow-y-auto shadow-lg border border-slate-200">
                  <div className="sticky top-0 bg-gradient-to-br from-slate-50 to-slate-100 -m-6 p-6 mb-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 flex items-center gap-3 text-lg">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md">
                        <CalendarDays className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600 font-medium">Seçilen Tarih</span>
                        <span className="text-slate-800">{moment(selectedDate).format('DD MMMM YYYY')}</span>
                      </div>
                    </h3>
                  </div>
                  
                  {/* Selected Date Events */}
                  <div className="space-y-2">
                    {(() => {
                      const selectedDateEvents = events.filter(event => {
                        const eventDate = new Date(event.start);
                        return eventDate.toDateString() === selectedDate.toDateString();
                      });

                      if (selectedDateEvents.length === 0) {
                        return (
                          <div className="text-center text-slate-500 py-12">
                            <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-inner mb-4 mx-auto w-fit">
                              <CalendarDays className="h-16 w-16 mx-auto text-slate-400" />
                            </div>
                            <h4 className="font-semibold text-slate-700 mb-2">Henüz Servis Talebi Yok</h4>
                            <p className="text-sm text-slate-500">Bu tarihte herhangi bir servis talebi bulunmuyor</p>
                          </div>
                        );
                      }

                      return selectedDateEvents.map((event, index) => (
                        <div
                          key={index}
                          className="group bg-white rounded-xl p-4 border border-slate-200 cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                          onClick={() => onSelectRequest(event.serviceRequest)}
                        >
                          {/* Priority border indicator */}
                          <div className={`absolute left-0 top-0 w-1 h-full ${
                            event.priority === 'urgent' ? 'bg-gradient-to-b from-red-500 to-red-600' :
                            event.priority === 'high' ? 'bg-gradient-to-b from-orange-500 to-orange-600' :
                            event.priority === 'medium' ? 'bg-gradient-to-b from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-b from-green-500 to-green-600'
                          }`} />
                          
                          {/* Priority glow effect */}
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                            event.priority === 'urgent' ? 'bg-red-500' :
                            event.priority === 'high' ? 'bg-orange-500' :
                            event.priority === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                          
                          <div className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-slate-800 transition-colors">
                                {event.title}
                              </h4>
                              <Badge
                                variant={
                                  event.priority === 'urgent' ? 'destructive' :
                                  event.priority === 'high' ? 'default' :
                                  event.priority === 'medium' ? 'secondary' :
                                  'outline'
                                }
                                className="text-xs font-medium shadow-sm"
                              >
                                {event.priority === 'urgent' ? 'Acil' :
                                 event.priority === 'high' ? 'Yüksek' :
                                 event.priority === 'medium' ? 'Orta' : 'Düşük'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 bg-slate-50 rounded-lg p-2">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">
                                {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs text-slate-600 font-medium">
                                  {event.technician || 'Atanmamış'}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  event.status === 'completed' ? 'default' :
                                  event.status === 'in_progress' ? 'secondary' :
                                  'outline'
                                }
                                className="text-xs shadow-sm"
                              >
                                {event.status === 'completed' ? 'Tamamlandı' :
                                 event.status === 'in_progress' ? 'Devam Ediyor' : 'Beklemede'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-8 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                      Hızlı İstatistikler
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200 shadow-sm">
                        <div className="text-2xl font-bold text-blue-700 mb-1">
                          {events.filter(e => moment(e.start).isSame(moment(), 'day')).length}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Bugün</div>
                        <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                          <div className="bg-blue-500 h-1 rounded-full transition-all duration-500" style={{ width: '70%' }}></div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 border border-orange-200 shadow-sm">
                        <div className="text-2xl font-bold text-orange-700 mb-1">
                          {events.filter(e => e.technician === 'Atanmamış').length}
                        </div>
                        <div className="text-xs text-orange-600 font-medium">Atanmamış</div>
                        <div className="w-full bg-orange-200 rounded-full h-1 mt-2">
                          <div className="bg-orange-500 h-1 rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 gap-2 mt-3">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-700 font-medium">Tamamlanan</span>
                          <span className="text-sm font-bold text-green-700">
                            {events.filter(e => e.status === 'completed').length}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-purple-700 font-medium">Devam Eden</span>
                          <span className="text-sm font-bold text-purple-700">
                            {events.filter(e => e.status === 'in_progress').length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      case "table":
      default:
        return (
          <ServiceRequestTable
            searchQuery={searchQuery}
            statusFilter={statusFilter === "all" ? null : statusFilter}
            technicianFilter={technicianFilter === "all" ? null : technicianFilter}
            onSelectRequest={onSelectRequest}
          />
        );
    }
  };

  return (
    <div className={activeView === "dispatcher" ? "h-full" : ""}>
      {getViewComponent()}
    </div>
  );
};
