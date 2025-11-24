import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  Users,
  ZoomIn,
  ZoomOut,
  Maximize2
} from "lucide-react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { formatDate } from "@/utils/dateUtils";
import { format, addDays, subDays, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { Gantt, Task, ViewMode as GanttViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

interface ServiceGanttViewProps {
  serviceRequests: ServiceRequest[];
  technicians: any[];
  onSelectService: (service: ServiceRequest) => void;
  onUpdateAssignment?: (serviceId: string, technicianId: string, startTime: Date, endTime: Date) => void;
}

type ViewMode = 'day' | 'week' | 'month';

// gantt-task-react Task tipini kullanıyoruz

const ServiceGanttView = ({
  serviceRequests,
  technicians,
  onSelectService,
  onUpdateAssignment
}: ServiceGanttViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [ganttViewMode, setGanttViewMode] = useState<GanttViewMode>(GanttViewMode.Week);

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
    let start: Date, end: Date;

    if (viewMode === 'day') {
      start = new Date(currentDate);
      end = new Date(currentDate);
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else { // month
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
    }

    return { start, end };
  }, [currentDate, viewMode]);

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

  // Gantt tasks formatına dönüştür - gantt-task-react formatı
  const ganttTasks = useMemo(() => {
    if (!serviceRequests || !Array.isArray(serviceRequests) || serviceRequests.length === 0) {
      return [];
    }

    const tasks: Task[] = [];
    const projectMap = new Map<string, Task>();

    // Önce teknisyen gruplarını oluştur (project task'lar)
    filteredTechnicians.forEach((tech) => {
      const techServices = serviceRequests.filter(service =>
        service.assigned_technician === tech.id
      );

      if (techServices.length > 0) {
        const projectName = `${tech.first_name} ${tech.last_name}`;
        const projectTask: Task = {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end),
          name: projectName,
          id: `project-${tech.id}`,
          type: 'project',
          progress: 0,
          hideChildren: false,
          project: undefined,
        };
        projectMap.set(tech.id, projectTask);
        tasks.push(projectTask);

        // Her servis için task oluştur
        techServices.forEach((service) => {
          if (!service.id) return;

          let serviceStart: Date;
          if (service.issue_date) {
            serviceStart = new Date(service.issue_date);
          } else if (service.service_due_date) {
            serviceStart = new Date(service.service_due_date);
          } else {
            serviceStart = new Date(dateRange.start);
          }

          if (serviceStart < dateRange.start) {
            serviceStart = new Date(dateRange.start);
          }
          if (serviceStart > dateRange.end) {
            serviceStart = new Date(dateRange.start);
          }

          let serviceEnd: Date;
          if (service.service_due_date && service.issue_date) {
            serviceEnd = new Date(service.service_due_date);
            if (serviceEnd <= serviceStart) {
              serviceEnd = new Date(serviceStart.getTime() + 2 * 60 * 60 * 1000);
            }
          } else {
            serviceEnd = new Date(serviceStart.getTime() + 2 * 60 * 60 * 1000);
          }

          const priority = service.service_priority || 'medium';
          const status = service.service_status || 'new';
          const progress = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;

          const task: Task = {
            start: serviceStart,
            end: serviceEnd,
            name: service.service_title || 'Servis',
            id: service.id,
            type: 'task',
            progress: progress,
            project: projectName,
            dependencies: [],
            hideChildren: false,
            styles: {
              progressColor: getPriorityColor(priority),
              progressSelectedColor: getPriorityColor(priority),
              backgroundColor: getPriorityColor(priority),
            },
          };

          tasks.push(task);
        });
      }
    });

    // Atanmamış servisler için project oluştur
    const unassignedServices = serviceRequests.filter(service => !service.assigned_technician);
    if (unassignedServices.length > 0) {
      const unassignedProject: Task = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
        name: 'Atanmamış Servisler',
        id: 'project-unassigned',
        type: 'project',
        progress: 0,
        hideChildren: false,
        project: undefined,
      };
      tasks.push(unassignedProject);

      unassignedServices.forEach((service) => {
        if (!service.id) return;

        let serviceStart: Date;
        if (service.service_due_date) {
          serviceStart = new Date(service.service_due_date);
        } else {
          serviceStart = new Date(dateRange.start);
        }

        if (serviceStart < dateRange.start) {
          serviceStart = new Date(dateRange.start);
        }
        if (serviceStart > dateRange.end) {
          serviceStart = new Date(dateRange.start);
        }

        const serviceEnd = new Date(serviceStart.getTime() + 2 * 60 * 60 * 1000);
        const priority = service.service_priority || 'medium';
        const status = service.service_status || 'new';
        const progress = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;

        const task: Task = {
          start: serviceStart,
          end: serviceEnd,
          name: service.service_title || 'Servis',
          id: service.id,
          type: 'task',
          progress: progress,
          project: 'Atanmamış Servisler',
          dependencies: [],
          hideChildren: false,
          styles: {
            progressColor: getPriorityColor(priority),
            progressSelectedColor: getPriorityColor(priority),
            backgroundColor: getPriorityColor(priority),
          },
        };

        tasks.push(task);
      });
    }

    return tasks;
  }, [serviceRequests, filteredTechnicians, dateRange]);

  // ViewMode'u gantt-task-react formatına dönüştür
  useEffect(() => {
    if (viewMode === 'day') {
      setGanttViewMode(GanttViewMode.Day);
    } else if (viewMode === 'week') {
      setGanttViewMode(GanttViewMode.Week);
    } else {
      setGanttViewMode(GanttViewMode.Month);
    }
  }, [viewMode]);

  // Atanmamış servisler
  const unassignedServices = useMemo(() => {
    return serviceRequests.filter(service => !service.assigned_technician);
  }, [serviceRequests]);

  const handlePrevious = () => {
    if (viewMode === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      // Month view: Navigate to first day of previous month
      const previousMonth = subMonths(currentDate, 1);
      setCurrentDate(startOfMonth(previousMonth));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      // Month view: Navigate to first day of next month
      const nextMonth = addMonths(currentDate, 1);
      setCurrentDate(startOfMonth(nextMonth));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleTaskChange = useCallback((task: Task) => {
    if (!onUpdateAssignment) return;
    const service = serviceRequests.find(s => s.id === task.id);
    if (service && task.project) {
      const technician = technicians?.find(tech => 
        `${tech.first_name} ${tech.last_name}` === task.project
      );
      if (technician) {
        onUpdateAssignment(service.id, technician.id, task.start, task.end);
      }
    }
  }, [serviceRequests, technicians, onUpdateAssignment]);

  const handleTaskDelete = useCallback((task: Task) => {
    // Task deleted
  }, []);

  const handleProgressChange = useCallback((task: Task) => {
    // Progress changed
  }, []);

  const handleDblClick = useCallback((task: Task) => {
    const service = serviceRequests.find(s => s.id === task.id);
    if (service) {
      onSelectService(service);
    }
  }, [serviceRequests, onSelectService]);

  return (
    <div className="space-y-4">
      {/* Üst Kontrol Paneli */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Sol taraf - Tarih navigasyonu */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                <Calendar className="h-4 w-4 mr-2" />
                Bugün
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
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

            {/* Sağ taraf - View mode ve Zoom */}
            <div className="flex items-center gap-2">
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
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart Ana Bölüm */}
      <div className="flex rounded-xl overflow-hidden shadow-lg border border-gray-200" style={{ height: 'calc(100vh - 250px)' }}>
        {/* Ana Gantt Chart Alanı */}
        <Card className="overflow-hidden flex-1">
          <CardContent className="p-0 h-full">
            {ganttTasks && Array.isArray(ganttTasks) && ganttTasks.length > 0 ? (
              <div className="h-full overflow-auto">
                <Gantt
                  tasks={ganttTasks}
                  viewMode={ganttViewMode}
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
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-semibold text-muted-foreground">
                    Servis bulunamadı
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Servis talepleri burada görüntülenecek
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sağ Taraf - Atanmamış Servisler Sidebar */}
        {unassignedServices.length > 0 && (
          <div className="w-80 bg-gradient-to-b from-orange-50 to-red-50 flex flex-col border-l border-orange-200 shadow-inner">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white border-b border-orange-600 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Atanmamış Servisler</h3>
                  <p className="text-xs opacity-90">Teknisyenlere sürükleyip bırakın</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded-full font-medium">
                    {unassignedServices.length} adet
                  </span>
                </div>
                <div className="text-xs opacity-80 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Beklemede
                </div>
              </div>
            </div>
            {/* Servis Listesi */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {unassignedServices.map((service) => {
                const priority = service.service_priority || 'medium';
                const status = service.service_status || 'new';
                const statusBadge = getStatusBadge(status);

                return (
                  <div
                    key={service.id}
                    onClick={() => onSelectService(service)}
                    className="bg-white border border-orange-200 rounded-lg p-2 cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getPriorityColor(priority) }}
                        ></span>
                        <h4 className="font-medium text-gray-900 text-xs truncate">
                          {service.service_title}
                        </h4>
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {priority === 'urgent' ? 'Acil' :
                         priority === 'high' ? 'Yüksek' :
                         priority === 'medium' ? 'Orta' : 'Düşük'}
                      </Badge>
                    </div>
                    {service.service_location && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                        <MapPin className="h-2.5 w-2.5 text-gray-500 flex-shrink-0" />
                        <span className="truncate">{service.service_location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-2.5 w-2.5 text-blue-500" />
                        <span className="font-medium">
                          {service.service_due_date
                            ? format(new Date(service.service_due_date), 'HH:mm', { locale: tr })
                            : 'Tarih yok'}
                        </span>
                      </div>
                      <Badge variant="outline" className={`text-xs ${statusBadge.class}`}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Alt Bilgi Paneli - Öncelik Göstergeleri */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              <span>Servisleri tıklayarak detaylarını görüntüleyebilir, sürükleyerek tarihlerini değiştirebilirsiniz</span>
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
