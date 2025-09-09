import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServiceRequests, ServiceRequest } from '@/hooks/useServiceRequests';
import { useTechnicianNames } from '../hooks/useTechnicianNames';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, MapPin, Users, Clock, Filter, User, AlertCircle, CheckCircle } from 'lucide-react';
import { ResourceView } from './ResourceView';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ServiceEvent {
  id: string;
  serviceRequest: ServiceRequest;
  technician?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  due_date?: string;
  title: string;
}

interface DispatcherConsoleProps {
  onSelectRequest?: (request: ServiceRequest) => void;
}

const priorityColors = {
  urgent: '#ef4444', // red-500
  high: '#f97316',   // orange-500
  medium: '#eab308', // yellow-500
  low: '#22c55e',    // green-500
};

const statusColors = {
  new: '#6b7280',         // gray-500
  assigned: '#3b82f6',    // blue-500
  in_progress: '#8b5cf6', // purple-500
  completed: '#10b981',   // emerald-500
  cancelled: '#ef4444',   // red-500
  on_hold: '#f59e0b',     // amber-500
};

export const DispatcherConsole: React.FC<DispatcherConsoleProps> = ({ 
  onSelectRequest 
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'resources'>('schedule');
  const [currentView, setCurrentView] = useState<'today' | 'week' | 'all'>('today');
  const { data: serviceRequests } = useServiceRequests();
  const { getTechnicianName } = useTechnicianNames();

  // Servis taleplerini eventlere dönüştür
  const events = useMemo(() => {
    if (!serviceRequests) return [];

    return serviceRequests
      .filter(request => request.due_date) // Sadece tarih belirtilmiş olanlar
      .map(request => ({
          id: request.id,
          title: request.title,
        due_date: request.due_date,
          serviceRequest: request,
          technician: request.assigned_to ? getTechnicianName(request.assigned_to) : 'Atanmamış',
          priority: request.priority,
          status: request.status,
          resource: request.assigned_to || 'unassigned',
      } as ServiceEvent));
  }, [serviceRequests, getTechnicianName]);

  // Event seçildiğinde
  const handleSelectEvent = useCallback((event: ServiceEvent) => {
    onSelectRequest?.(event.serviceRequest);
  }, [onSelectRequest]);

  // Filtrelenmiş eventleri al
  const filteredEvents = useMemo(() => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    switch (currentView) {
      case 'today':
        return events.filter(event => {
          if (!event.due_date) return false;
          const eventDate = new Date(event.due_date);
          return eventDate.toDateString() === today.toDateString();
        });
      case 'week':
        return events.filter(event => {
          if (!event.due_date) return false;
          const eventDate = new Date(event.due_date);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
      case 'all':
      default:
        return events;
    }
  }, [events, currentView]);

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'assigned': return 'secondary';
      case 'in_progress': return 'outline';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      case 'on_hold': return 'secondary';
      default: return 'outline';
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="dispatcher-console h-full">
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Dispatcher Console</h2>
          </div>
          
          {/* Main Tab Toggle */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Çizelgeleme
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Kaynaklar
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsContent value="schedule" className="space-y-4">
            {/* Chart and Unassigned Services Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Chart Card */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Gantt Chart</h3>
                </div>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <CalendarDays className="h-12 w-12 mx-auto mb-2" />
                    <p>Gantt Chart burada görünecek</p>
                    <p className="text-sm">Servis talepleri zaman çizelgesi</p>
                  </div>
                </div>
              </Card>

              {/* Unassigned Services Card */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Atanmamış Servisler</h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {events.filter(e => e.resource === 'unassigned').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>Tüm servisler atanmış</p>
                    </div>
                  ) : (
                    events
                      .filter(e => e.resource === 'unassigned')
                      .slice(0, 5)
                      .map((event) => (
                        <div 
                          key={event.id} 
                          className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors"
                          onClick={() => handleSelectEvent(event)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={getPriorityBadgeVariant(event.priority)} className="text-xs">
                                  {event.priority}
                                </Badge>
                                {event.due_date && (
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(event.due_date), 'dd MMM HH:mm', { locale: tr })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="text-xs h-6">
                              Ata
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                  {events.filter(e => e.resource === 'unassigned').length > 5 && (
                    <div className="text-center text-xs text-gray-500 py-2">
                      +{events.filter(e => e.resource === 'unassigned').length - 5} servis daha...
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Split View: List + Resources */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-500px)]">
              
              {/* List Section - Sol 3 kolon */}
              <div className="xl:col-span-3 space-y-4">
                {/* View Controls */}
                <div className="flex items-center justify-between">
                  <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
                    <TabsList className="bg-gray-100">
                      <TabsTrigger value="today" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Bugün
                      </TabsTrigger>
                      <TabsTrigger value="week" className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Bu Hafta
                      </TabsTrigger>
                      <TabsTrigger value="all" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Tümü
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Filters and Legend */}
                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Öncelik Seviyeleri:</span>
                    <div className="flex items-center gap-3">
                      {Object.entries(priorityColors).map(([priority, color]) => (
                        <div key={priority} className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs capitalize">{priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Durumlar:</span>
                    <div className="flex items-center gap-3">
                      {Object.entries(statusColors).slice(0, 4).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 border-2 rounded-sm" 
                            style={{ borderColor: color }}
                          />
                          <span className="text-xs">{status.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Service Requests List */}
                <div className="bg-white rounded-lg border p-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Bu aralıkta servis talebi bulunmuyor.</p>
                    </div>
                  ) : (
                    filteredEvents.map((event) => (
                      <Card 
                        key={event.id} 
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleSelectEvent(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{event.title}</h4>
                              <Badge variant={getStatusBadgeVariant(event.status)}>
                                {event.status}
                              </Badge>
                              <Badge variant={getPriorityBadgeVariant(event.priority)}>
                            {event.priority}
                          </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {event.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {format(new Date(event.due_date), 'dd MMM yyyy HH:mm', { locale: tr })}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span>{event.technician}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              {/* Resource Panel - Sağ 1 kolon */}
              <div className="xl:col-span-1 bg-gray-50 rounded-lg p-4 overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Teknisyen Durumu
                  </h3>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white rounded p-2">
                      <div className="text-lg font-bold text-blue-600">
                        {filteredEvents.length}
                      </div>
                      <div className="text-xs text-gray-600">
                        {currentView === 'today' ? 'Bugün' : currentView === 'week' ? 'Bu Hafta' : 'Toplam'}
                      </div>
                    </div>
                    <div className="bg-white rounded p-2">
                      <div className="text-lg font-bold text-orange-600">
                        {events.filter(e => e.resource === 'unassigned').length}
                      </div>
                      <div className="text-xs text-gray-600">Atanmamış</div>
                    </div>
                  </div>

                  {/* Mini Resource View */}
                  <ResourceView 
                    compact={true}
                    onAssignTask={(technicianId, serviceRequest) => {
                      console.log('Assigning task:', serviceRequest?.id, 'to technician:', technicianId);
                    }} 
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <ResourceView onAssignTask={(technicianId, serviceRequest) => {
              // TODO: Implement task assignment logic
              console.log('Assigning task:', serviceRequest.id, 'to technician:', technicianId);
            }} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
