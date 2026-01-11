import React, { useState, useMemo, useCallback } from "react";
import { logger } from '@/utils/logger';
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
  AlertCircle
} from "lucide-react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { formatDate, isSameDay } from "@/utils/dateUtils";
import { format, addDays, subDays, startOfDay, setHours, setMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

interface ResourceSchedulingViewProps {
  serviceRequests: ServiceRequest[];
  technicians: any[];
  onSelectService: (service: ServiceRequest) => void;
  onUpdateAssignment?: (serviceId: string, technicianId: string, startTime: Date, endTime: Date) => void;
}

const ResourceSchedulingView = ({
  serviceRequests,
  technicians,
  onSelectService,
  onUpdateAssignment
}: ResourceSchedulingViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);
  const [selectedTechnician, setSelectedTechnician] = useState<string | null>(null);

  // Filtrelenmiş teknisyenler
  const filteredTechnicians = useMemo(() => {
    if (!technicians) return [];
    return technicians.filter(tech => {
      if (searchQuery) {
        const fullName = `${tech.first_name} ${tech.last_name}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      }
      if (selectedTechnician) {
        return tech.id === selectedTechnician;
      }
      return true;
    });
  }, [technicians, searchQuery, selectedTechnician]);

  // Gantt Task formatına dönüştür
  const ganttTasks = useMemo(() => {
    const tasks: Task[] = [];
    
    serviceRequests.forEach((service, index) => {
      if (!service.assigned_technician) return;

      const technician = technicians?.find(tech => tech.id === service.assigned_technician);
      if (!technician) return;

      // Tarih hesaplama
      const startDate = service.issue_date 
        ? new Date(service.issue_date)
        : service.service_due_date 
        ? new Date(service.service_due_date)
        : new Date();

      // Varsayılan süre: 2 saat
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

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

      const priority = service.service_priority || 'medium';
      const backgroundColor = getPriorityColor(priority);

      tasks.push({
        start: startDate,
        end: endDate,
        name: service.service_title,
        id: service.id,
        type: 'task',
        progress: service.service_status === 'completed' ? 100 : 
                 service.service_status === 'in_progress' ? 50 : 0,
        styles: {
          progressColor: backgroundColor,
          progressSelectedColor: backgroundColor,
          backgroundColor: backgroundColor,
        },
        project: `${technician.first_name} ${technician.last_name}`,
        dependencies: [],
        hideChildren: false,
      });
    });

    return tasks;
  }, [serviceRequests, technicians]);

  // Atanmamış servisler
  const unassignedServices = useMemo(() => {
    return serviceRequests.filter(service => !service.assigned_technician);
  }, [serviceRequests]);

  const handlePreviousDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };

  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleTaskChange = useCallback((task: Task) => {
    // Görev güncellemesi
    const service = serviceRequests.find(s => s.id === task.id);
    if (service && onUpdateAssignment) {
      const technician = technicians?.find(tech => 
        `${tech.first_name} ${tech.last_name}` === task.project
      );
      if (technician) {
        onUpdateAssignment(service.id, technician.id, task.start, task.end);
      }
    }
  }, [serviceRequests, technicians, onUpdateAssignment]);

  const handleTaskDelete = useCallback((task: Task) => {
    // Görev silme işlemi
    logger.debug('Task deleted:', task);
  }, []);

  const handleProgressChange = useCallback((task: Task) => {
    // İlerleme güncellemesi
    logger.debug('Progress changed:', task);
  }, []);

  const handleDblClick = useCallback((task: Task) => {
    // Çift tıklama - servis detayına git
    const service = serviceRequests.find(s => s.id === task.id);
    if (service) {
      onSelectService(service);
    }
  }, [serviceRequests, onSelectService]);

  // Öncelik renkleri
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  // Durum renkleri
  const getStatusColor = (status: string) => {
    const colors = {
      new: 'border-blue-500',
      assigned: 'border-purple-500',
      in_progress: 'border-yellow-500',
      on_hold: 'border-orange-500',
      completed: 'border-green-500',
      cancelled: 'border-red-500',
    };
    return colors[status as keyof typeof colors] || 'border-gray-500';
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
              <div className="ml-4 px-3 py-1.5 bg-blue-50 rounded-md border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  {format(currentDate, 'EEEE d MMMM yyyy', { locale: tr })}
                </p>
              </div>
            </div>

            {/* Orta - Arama ve Filtreler */}
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
              <div className="flex gap-1 border rounded-md">
                <Button
                  variant={viewMode === ViewMode.Day ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(ViewMode.Day)}
                >
                  Gün
                </Button>
                <Button
                  variant={viewMode === ViewMode.Week ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(ViewMode.Week)}
                >
                  Hafta
                </Button>
                <Button
                  variant={viewMode === ViewMode.Month ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(ViewMode.Month)}
                >
                  Ay
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div style={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
            {ganttTasks.length > 0 ? (
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                locale="tr"
                onDateChange={handleTaskChange}
                onDelete={handleTaskDelete}
                onProgressChange={handleProgressChange}
                onDoubleClick={handleDblClick}
                listCellWidth="200px"
                columnWidth={65}
                rowHeight={50}
                ganttHeight={Math.min(ganttTasks.length * 60, 600)}
                preStepsCount={1}
                todayColor="rgba(59, 130, 246, 0.1)"
                rtl={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold text-muted-foreground mb-2">
                    Atanmış servis bulunamadı
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Servisleri teknisyenlere atayarak zaman çizelgesinde görebilirsiniz
                  </p>
                </div>
              </div>
            )}
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
                Servisleri teknisyenlere atayın
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {unassignedServices.map((service) => {
                const priority = service.service_priority || 'medium';
                
                return (
                  <div
                    key={service.id}
                    className={`px-3 py-2 rounded-lg cursor-pointer border-2 ${getPriorityColor(priority)} ${getStatusColor(service.service_status || 'new')} text-white text-sm hover:shadow-lg transition-all`}
                    onClick={() => onSelectService(service)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{service.service_title}</p>
                      <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-xs">
                        {service.service_priority === 'urgent' ? 'Acil' :
                         service.service_priority === 'high' ? 'Yüksek' :
                         service.service_priority === 'medium' ? 'Orta' : 'Düşük'}
                      </Badge>
                    </div>
                    {service.service_location && (
                      <p className="text-xs opacity-90 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {service.service_location}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResourceSchedulingView;
