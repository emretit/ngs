import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Maximize2,
  Wrench,
  ChevronDown,
  ChevronUp,
  Filter,
  X
} from "lucide-react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { formatDate } from "@/utils/dateUtils";
import { format, addDays, subDays, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { Gantt, Task, ViewMode as GanttViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

// Custom Gantt CSS overrides
const ganttCustomStyles = `
  /* ===== BUGÜN ÇİZGİSİ - ÇOK BELİRGİN ===== */
  /* gantt-task-react today line - tüm olası sınıflar */
  line[class*="today"], 
  .today-line,
  ._2qaoh,
  [class*="Today"] line,
  svg g line[stroke="#e6e4e4"] {
    stroke: #ef4444 !important;
    stroke-width: 3px !important;
    stroke-dasharray: none !important;
  }
  
  /* Today column highlight */
  rect[class*="today"],
  ._3rUKi,
  [class*="Today"] rect {
    fill: rgba(239, 68, 68, 0.1) !important;
  }
  
  /* ===== TASK BAR STİLLERİ ===== */
  /* Task bar'ları daha yumuşak köşeler */
  rect[class*="bar"],
  ._1fYKf,
  ._35nLX rect {
    rx: 6px !important;
    ry: 6px !important;
  }
  
  /* Hover efekti task bars */
  g[class*="bar"]:hover rect,
  ._KxSXS:hover ._1fYKf,
  ._35nLX:hover rect {
    filter: brightness(1.1) !important;
    cursor: pointer !important;
  }
  
  /* Task bar wrapper hover - gölge */
  g[class*="bar"]:hover,
  ._KxSXS:hover,
  ._35nLX:hover {
    filter: drop-shadow(0 4px 12px rgba(0,0,0,0.25)) !important;
  }
  
  /* Progress bar köşeleri */
  ._16aBr,
  rect[class*="progress"] {
    rx: 6px !important;
    ry: 6px !important;
  }
  
  /* ===== GRİD STİLLERİ ===== */
  /* Grid çizgileri */
  ._3TlOh line,
  g[class*="grid"] line {
    stroke: #e5e7eb !important;
  }
  
  /* ===== HEADER STİLLERİ ===== */
  ._2eGfN,
  rect[class*="header"] {
    fill: #f8fafc !important;
  }
  
  /* Calendar header text */
  ._2eGfN text,
  g[class*="calendar"] text {
    fill: #374151 !important;
    font-weight: 500 !important;
  }
  
  /* ===== TOOLTİP STİLLERİ ===== */
  /* Tooltip container */
  ._1gXYZ, ._34SS0, .gantt-tooltip,
  div[class*="tooltip"],
  [class*="Tooltip"] {
    z-index: 9999 !important;
    background: #1e293b !important;
    color: white !important;
    border-radius: 8px !important;
    padding: 12px !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important;
  }
  
  /* ===== ROW STİLLERİ ===== */
  /* Row hover */
  ._1EBn5:hover,
  ._2dZTy:hover {
    fill: rgba(59, 130, 246, 0.08) !important;
  }
  
  /* ===== SCROLLBAR ===== */
  ._2_tUq::-webkit-scrollbar,
  .gantt-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ._2_tUq::-webkit-scrollbar-track,
  .gantt-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  ._2_tUq::-webkit-scrollbar-thumb,
  .gantt-container::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
  }
  
  ._2_tUq::-webkit-scrollbar-thumb:hover,
  .gantt-container::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
`;
import { useNavigate } from "react-router-dom";

// Custom Tooltip Component
const CustomTooltip: React.FC<{
  task: Task;
  fontSize: string;
  fontFamily: string;
  serviceRequests?: ServiceRequest[];
}> = ({ task, serviceRequests }) => {
  // Project (teknisyen) için tooltip gösterme
  if (task.type === 'project') {
    return null;
  }

  // Servis detaylarını bul
  const service = serviceRequests?.find(s => s.id === task.id);
  
  if (!service) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 min-w-[200px]">
        <p className="font-semibold text-sm">{task.name}</p>
      </div>
    );
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      urgent: 'Acil',
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük',
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      new: 'Yeni',
      assigned: 'Atandı',
      in_progress: 'Devam Ediyor',
      completed: 'Tamamlandı',
      cancelled: 'İptal',
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 min-w-[280px] max-w-[350px]">
      {/* Başlık */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-sm leading-tight">{service.service_title}</p>
        <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
          service.service_priority === 'urgent' ? 'bg-red-500' :
          service.service_priority === 'high' ? 'bg-orange-500' :
          service.service_priority === 'medium' ? 'bg-yellow-500 text-slate-900' :
          'bg-green-500'
        }`}>
          {getPriorityLabel(service.service_priority || 'medium')}
        </span>
      </div>
      
      {/* Detaylar */}
      <div className="space-y-1.5 text-xs">
        {/* Müşteri */}
        {service.customer_data && (service.customer_data as any)?.name && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-slate-400" />
            <span className="text-slate-300">{(service.customer_data as any).name}</span>
          </div>
        )}
        
        {/* Konum */}
        {service.service_location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 text-slate-400" />
            <span className="text-slate-300 truncate">{service.service_location}</span>
          </div>
        )}
        
        {/* Tarih/Saat */}
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-slate-400" />
          <span className="text-slate-300">
            {format(task.start, 'dd MMM HH:mm', { locale: tr })} - {format(task.end, 'HH:mm', { locale: tr })}
          </span>
        </div>
        
        {/* Durum */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-700">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            service.service_status === 'completed' ? 'bg-green-500/20 text-green-400' :
            service.service_status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
            service.service_status === 'assigned' ? 'bg-purple-500/20 text-purple-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {getStatusLabel(service.service_status || 'new')}
          </span>
          {task.progress > 0 && task.progress < 100 && (
            <span className="text-slate-400">%{task.progress} tamamlandı</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom TaskListHeader Component
const CustomTaskListHeader: React.FC<{
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
}> = ({ headerHeight, rowWidth }) => {
  return (
    <div
      className="flex items-center bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-b-2 border-blue-700 shadow-lg"
      style={{ height: headerHeight, width: rowWidth }}
    >
      <div className="flex items-center gap-3 px-4 w-full">
        <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
          <Users className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-base tracking-wide">Teknisyenler</span>
      </div>
    </div>
  );
};

// Custom TaskListTable Component
const CustomTaskListTable: React.FC<{
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  locale: string;
  tasks: Task[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  onExpanderClick: (task: Task) => void;
  serviceCountMap?: Map<string, number>;
  dropTargetId?: string | null;
}> = ({ rowHeight, rowWidth, tasks, selectedTaskId, setSelectedTask, onExpanderClick, serviceCountMap, dropTargetId }) => {
  // Teknisyen renklerini oluştur
  const technicianColors = useMemo(() => {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
      'bg-pink-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-rose-500',
      'bg-teal-500', 'bg-orange-500'
    ];
    const colorMap = new Map<string, string>();
    tasks
      .filter(t => t.type === 'project')
      .forEach((task, index) => {
        colorMap.set(task.id, colors[index % colors.length]);
      });
    return colorMap;
  }, [tasks]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div style={{ width: rowWidth }}>
      {tasks.map((task) => {
        const isProject = task.type === 'project';
        const isSelected = task.id === selectedTaskId;
        const isUnassigned = task.id === 'project-unassigned';
        const bgColor = technicianColors.get(task.id) || 'bg-gray-500';
        const techId = task.id.replace('project-', '');
        const serviceCount = serviceCountMap?.get(techId) || 0;
        const isDropTarget = dropTargetId === task.id;

        return (
          <div
            key={task.id}
            data-tech-id={isProject ? techId : undefined}
            className={`flex items-center border-b border-gray-200/60 transition-all duration-300 cursor-pointer group
              ${isProject 
                ? isUnassigned 
                  ? 'bg-gradient-to-r from-orange-50/80 via-red-50/80 to-orange-50/80 hover:from-orange-100 hover:via-red-100 hover:to-orange-100 shadow-sm' 
                  : isDropTarget
                    ? 'bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 ring-2 ring-blue-400 ring-inset shadow-md scale-[1.02]'
                    : 'bg-gradient-to-r from-white via-slate-50/50 to-white hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-blue-50/50 hover:shadow-sm'
                : 'bg-white hover:bg-blue-50/30'
              }
              ${isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/50' : ''}
            `}
            style={{ height: rowHeight }}
            onClick={() => setSelectedTask(task.id)}
          >
            <div className="flex items-center gap-3 px-4 w-full">
              {isProject ? (
                <>
                  {/* Expand/Collapse Button */}
                  <button
                    className="p-1 hover:bg-white/80 rounded-md transition-all duration-200 hover:scale-110 group-hover:bg-blue-100/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExpanderClick(task);
                    }}
                  >
                    {task.hideChildren ? (
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    )}
                  </button>
                  
                  {/* Avatar - Daha Büyük ve Modern */}
                  {isUnassigned ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-orange-200 group-hover:ring-orange-300 transition-all duration-200 group-hover:scale-105">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <Avatar className={`h-10 w-10 ${bgColor} flex-shrink-0 shadow-lg ring-2 ring-white group-hover:ring-blue-200 transition-all duration-200 group-hover:scale-105`}>
                      <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                        {getInitials(task.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {/* Name & Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate transition-colors ${
                      isUnassigned ? 'text-orange-700 group-hover:text-orange-800' : 'text-slate-800 group-hover:text-blue-700'
                    }`}>
                      {task.name}
                    </p>
                    {!isUnassigned && (
                      <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">Teknisyen</p>
                    )}
                  </div>
                  
                  {/* Service Count Badge - Modernize */}
                  {!isUnassigned && (
                    <Badge 
                      variant="secondary" 
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 ${
                        serviceCount > 0 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {serviceCount} {serviceCount === 1 ? 'servis' : 'servis'}
                    </Badge>
                  )}
                </>
              ) : (
                <>
                  {/* Task Indent */}
                  <div className="w-6" />
                  
                  {/* Task Icon - Modernize */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-110"
                    style={{ backgroundColor: task.styles?.backgroundColor || '#6b7280' }}
                  >
                    <Wrench className="h-3 w-3 text-white" />
                  </div>
                  
                  {/* Task Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-slate-700 group-hover:text-blue-700 transition-colors">
                      {task.name}
                    </p>
                  </div>
                  
                  {/* Progress indicator - Modernize */}
                  {task.progress > 0 && (
                    <Badge 
                      variant="outline"
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
                        task.progress === 100
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0'
                      }`}
                    >
                      {task.progress === 100 ? '✓ Tamamlandı' : `${task.progress}%`}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

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
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [ganttViewMode, setGanttViewMode] = useState<GanttViewMode>(GanttViewMode.Week);
  const [draggedService, setDraggedService] = useState<ServiceRequest | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  // Expand/collapse state for technicians
  const [expandedTechnicians, setExpandedTechnicians] = useState<Set<string>>(new Set());

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

  // Durum renkleri - bar arka plan için
  const getStatusColor = (status: string) => {
    const colors = {
      new: '#3b82f6',        // Mavi
      assigned: '#8b5cf6',   // Mor
      in_progress: '#f59e0b', // Turuncu
      completed: '#22c55e',   // Yeşil
      cancelled: '#6b7280',   // Gri
    };
    return colors[status as keyof typeof colors] || '#6b7280';
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

  // Her teknisyenin servis sayısı
  const serviceCountMap = useMemo(() => {
    const countMap = new Map<string, number>();
    if (!serviceRequests || !technicians) return countMap;
    
    technicians.forEach(tech => {
      const count = serviceRequests.filter(s => s.assigned_technician === tech.id).length;
      countMap.set(tech.id, count);
    });
    return countMap;
  }, [serviceRequests, technicians]);

  // Varsayılan olarak tüm teknisyenleri açık yap
  useEffect(() => {
    if (filteredTechnicians.length > 0) {
      setExpandedTechnicians(prev => {
        const newSet = new Set(prev);
        filteredTechnicians.forEach(tech => {
          const projectId = `project-${tech.id}`;
          newSet.add(projectId);
        });
        return newSet;
      });
    }
  }, [filteredTechnicians]);

  // Filtrelenmiş servisler (öncelik ve durum filtresi)
  const filteredServiceRequests = useMemo(() => {
    if (!serviceRequests) return [];
    return serviceRequests.filter(service => {
      if (statusFilter && service.service_status !== statusFilter) return false;
      if (priorityFilter && service.service_priority !== priorityFilter) return false;
      return true;
    });
  }, [serviceRequests, statusFilter, priorityFilter]);

  // Gantt tasks formatına dönüştür - gantt-task-react formatı
  const ganttTasks = useMemo(() => {
    const tasks: Task[] = [];
    const projectMap = new Map<string, Task>();

    // Önce teknisyen gruplarını oluştur (project task'lar) - TÜM teknisyenler gösterilir
    filteredTechnicians.forEach((tech) => {
      const techServices = filteredServiceRequests.filter(service =>
        service.assigned_technician === tech.id
      );

      // Tüm teknisyenleri göster, servis atanmamış olsa bile
      const projectName = `${tech.first_name} ${tech.last_name}`;
      const projectId = `project-${tech.id}`;
      const isExpanded = expandedTechnicians.has(projectId);
      const projectTask: Task = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
        name: projectName,
        id: projectId,
        type: 'project',
        progress: 0,
        hideChildren: !isExpanded, // Expand/collapse state'e göre ayarla
        project: undefined,
      };
      projectMap.set(tech.id, projectTask);
      tasks.push(projectTask);

      // Her servis için task oluştur (eğer varsa)
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
          
          // Renk: Durum bazlı ana renk, öncelik progress bar'da gösterilir
          const statusColor = getStatusColor(status);
          const priorityColor = getPriorityColor(priority);

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
              progressColor: priorityColor,
              progressSelectedColor: priorityColor,
              backgroundColor: statusColor,
            },
          };

          tasks.push(task);
        });
    });

    // Atanmamış servisler artık sağ taraftaki tabloda gösteriliyor, burada göstermiyoruz

    return tasks;
  }, [filteredServiceRequests, filteredTechnicians, dateRange, expandedTechnicians, getPriorityColor, getStatusColor]);

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

  // Atanmamış servisler (filtrelenmiş)
  const unassignedServices = useMemo(() => {
    return filteredServiceRequests.filter(service => !service.assigned_technician);
  }, [filteredServiceRequests]);

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

  // Handle expander click for project tasks
  const handleExpanderClick = useCallback((task: Task) => {
    // Sadece project (teknisyen) task'ları için expand/collapse yap
    if (task.type === 'project') {
      setExpandedTechnicians(prev => {
        const newSet = new Set(prev);
        if (newSet.has(task.id)) {
          newSet.delete(task.id); // Collapse
        } else {
          newSet.add(task.id); // Expand
        }
        return newSet;
      });
    }
  }, []);

  // Drag handlers for unassigned services
  const handleDragStart = useCallback((e: React.DragEvent, service: ServiceRequest) => {
    setDraggedService(service);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', service.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedService(null);
    setDropTargetId(null);
  }, []);

  // Handle drop on Gantt chart area
  const handleGanttDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedService || !onUpdateAssignment) return;

    // Get drop coordinates relative to Gantt chart container
    const ganttContainer = e.currentTarget.closest('.gantt-container') || e.currentTarget;
    const rect = (ganttContainer as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Calculate which technician row was dropped on
    // Gantt chart has a header (~60px) and each row is ~50px
    const headerHeight = 60;
    const rowHeight = 50;
    const scrollTop = (ganttContainer as HTMLElement).scrollTop || 0;
    const adjustedY = y + scrollTop - headerHeight;
    const rowIndex = Math.floor(adjustedY / rowHeight);
    
    // Find technician based on row index
    // We need to match with the tasks that are projects (technicians)
    const projectTasks = ganttTasks.filter(t => t.type === 'project' && t.id !== 'project-unassigned');
    
    if (rowIndex >= 0 && rowIndex < projectTasks.length) {
      const projectTask = projectTasks[rowIndex];
      // Extract technician ID from project task ID (format: "project-{techId}")
      const technicianId = projectTask.id.replace('project-', '');
      const technician = technicians?.find(tech => tech.id === technicianId);
      
      if (technician) {
        // Calculate date from x position
        const x = e.clientX - rect.left;
        const listCellWidth = 200; // Width of the list cell
        const chartX = x - listCellWidth;
        
        // Calculate date based on x position and view mode
        let dropDate = new Date(currentDate);
        if (chartX > 0) {
          const columnWidth = 65;
          const columnIndex = Math.floor(chartX / columnWidth);
          
          if (viewMode === 'day') {
            dropDate = new Date(currentDate);
          } else if (viewMode === 'week') {
            const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
            dropDate = addDays(weekStart, columnIndex);
          } else {
            const monthStart = startOfMonth(currentDate);
            dropDate = addDays(monthStart, columnIndex);
          }
        }
        
        const startTime = new Date(dropDate);
        startTime.setHours(9, 0, 0, 0); // Default to 9 AM
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
        
        onUpdateAssignment(draggedService.id, technician.id, startTime, endTime);
      }
    }
    
    setDraggedService(null);
    setDropTargetId(null);
  }, [draggedService, onUpdateAssignment, technicians, currentDate, viewMode, ganttTasks]);

  const handleGanttDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Calculate which row is being hovered for visual feedback
    const ganttContainer = e.currentTarget.closest('.gantt-container') || e.currentTarget;
    const rect = (ganttContainer as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    const headerHeight = 60;
    const rowHeight = 50;
    const scrollTop = (ganttContainer as HTMLElement).scrollTop || 0;
    const adjustedY = y + scrollTop - headerHeight;
    const rowIndex = Math.floor(adjustedY / rowHeight);
    
    const projectTasks = ganttTasks.filter(t => t.type === 'project' && t.id !== 'project-unassigned');
    
    if (rowIndex >= 0 && rowIndex < projectTasks.length) {
      const projectTask = projectTasks[rowIndex];
      setDropTargetId(projectTask.id);
    } else {
      setDropTargetId(null);
    }
  }, [ganttTasks]);

  return (
    <div className="space-y-4">
      {/* Custom Gantt Styles */}
      <style>{ganttCustomStyles}</style>
      
      {/* Üst Kontrol Paneli - Modernize Edilmiş */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20">
        <CardContent className="p-4">
          {/* Üst satır - Tarih ve View Mode */}
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Sol taraf - Tarih navigasyonu */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
                className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToday}
                className="h-9 px-4 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Bugün
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNext}
                className="h-9 w-9 p-0 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-lg border-0 shadow-md">
                <p className="text-sm font-bold text-white drop-shadow-sm">
                  {viewMode === 'day' && format(currentDate, 'EEEE d MMMM yyyy', { locale: tr })}
                  {viewMode === 'week' && `${format(dateRange.start, 'd MMM', { locale: tr })} - ${format(dateRange.end, 'd MMM yyyy', { locale: tr })}`}
                  {viewMode === 'month' && format(currentDate, 'MMMM yyyy', { locale: tr })}
                </p>
              </div>
            </div>

            {/* Sağ taraf - View mode */}
            <div className="flex gap-1 border-2 border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm p-1">
              <Button
                variant={viewMode === 'day' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('day')}
                className={`h-8 px-4 transition-all duration-200 ${
                  viewMode === 'day' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Gün
              </Button>
              <Button
                variant={viewMode === 'week' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('week')}
                className={`h-8 px-4 transition-all duration-200 ${
                  viewMode === 'week' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Hafta
              </Button>
              <Button
                variant={viewMode === 'month' ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode('month')}
                className={`h-8 px-4 transition-all duration-200 ${
                  viewMode === 'month' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md' 
                    : 'hover:bg-gray-100'
                }`}
              >
                Ay
              </Button>
            </div>
          </div>
          
          {/* Alt satır - Arama ve Filtreler */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
              <Input
                placeholder="Teknisyen ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm border-2 focus:border-blue-400 transition-all duration-200 shadow-sm"
              />
            </div>
            
            {/* Öncelik Filtresi */}
            <Select value={priorityFilter || "all"} onValueChange={(v) => setPriorityFilter(v === "all" ? null : v)}>
              <SelectTrigger className="w-[150px] h-10 text-sm border-2 focus:border-blue-400 shadow-sm transition-all duration-200">
                <Filter className="h-4 w-4 mr-2 flex-shrink-0 text-blue-500" />
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                <SelectItem value="urgent">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>
                    <span className="font-medium">Acil</span>
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span>
                    <span className="font-medium">Yüksek</span>
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></span>
                    <span className="font-medium">Orta</span>
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></span>
                    <span className="font-medium">Düşük</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Durum Filtresi */}
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
              <SelectTrigger className="w-[150px] h-10 text-sm border-2 focus:border-blue-400 shadow-sm transition-all duration-200">
                <Filter className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
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
            
            {/* Filtreleri Temizle */}
            {(priorityFilter || statusFilter) && (
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 text-sm text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm"
                onClick={() => {
                  setPriorityFilter(null);
                  setStatusFilter(null);
                }}
              >
                <X className="h-4 w-4 mr-1.5" />
                Temizle
              </Button>
            )}
            
            {/* Aktif Filtre Göstergesi */}
            {(priorityFilter || statusFilter) && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-xs font-medium text-blue-700">Filtre aktif</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart Ana Bölüm - Modernize */}
      <div className="flex rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-200/50 bg-white" style={{ height: 'calc(100vh - 250px)' }}>
        {/* Ana Gantt Chart Alanı */}
        <Card className="overflow-hidden flex-1 border-0 shadow-none bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20">
          <CardContent 
            className="p-0 h-full"
            onDrop={handleGanttDrop}
            onDragOver={handleGanttDragOver}
          >
            {filteredTechnicians && filteredTechnicians.length > 0 ? (
              <div className="h-full overflow-auto gantt-container">
                <Gantt
                  tasks={ganttTasks}
                  viewMode={ganttViewMode}
                  locale="tr"
                  onDateChange={handleTaskChange}
                  onDelete={handleTaskDelete}
                  onProgressChange={handleProgressChange}
                  onDoubleClick={handleDblClick}
                  onExpanderClick={handleExpanderClick}
                  listCellWidth="240px"
                  columnWidth={65}
                  rowHeight={50}
                  headerHeight={50}
                  ganttHeight={Math.min(ganttTasks.length * 60, 600)}
                  preStepsCount={1}
                  todayColor="rgba(59, 130, 246, 0.15)"
                  rtl={false}
                  TaskListHeader={CustomTaskListHeader}
                  TaskListTable={(props) => (
                    <CustomTaskListTable
                      {...props}
                      onExpanderClick={handleExpanderClick}
                      serviceCountMap={serviceCountMap}
                      dropTargetId={dropTargetId}
                    />
                  )}
                  TooltipContent={(props) => (
                    <CustomTooltip
                      {...props}
                      serviceRequests={serviceRequests}
                    />
                  )}
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

        {/* Sağ Taraf - Atanmamış Servisler Sidebar - Modernize */}
        {unassignedServices.length > 0 && (
          <div className="w-80 bg-gradient-to-b from-orange-50 via-red-50/80 to-orange-50 flex flex-col border-l-2 border-orange-300/50 shadow-xl">
            {/* Header - Modernize */}
            <div className="p-5 bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white border-b-2 border-orange-600/50 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white/25 rounded-xl backdrop-blur-md shadow-lg ring-2 ring-white/20">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-wide">Atanmamış Servisler</h3>
                  <p className="text-xs opacity-95 mt-0.5">Teknisyenlere sürükleyip bırakın</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full font-bold text-sm shadow-md ring-1 ring-white/30">
                    {unassignedServices.length} adet
                  </span>
                </div>
                <div className="text-xs font-medium opacity-95 flex items-center gap-1.5 bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5" />
                  Beklemede
                </div>
              </div>
            </div>
            {/* Servis Listesi - Modernize */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {unassignedServices.map((service) => {
                const priority = service.service_priority || 'medium';
                const status = service.service_status || 'new';
                const statusBadge = getStatusBadge(status);

                return (
                  <div
                    key={service.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, service)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectService(service)}
                    className={`bg-white border-2 border-orange-200 rounded-xl p-3 cursor-move shadow-md hover:shadow-xl transition-all duration-300 hover:border-orange-400 hover:scale-[1.02] group ${
                      draggedService?.id === service.id ? 'opacity-50 scale-95' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm ring-2 ring-white"
                          style={{ backgroundColor: getPriorityColor(priority) }}
                        ></span>
                        <h4 className="font-bold text-sm text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                          {service.service_title}
                        </h4>
                      </div>
                      <Badge variant="outline" className={`text-xs font-semibold shadow-sm ${
                        priority === 'urgent' ? 'bg-red-500 text-white border-red-600' :
                        priority === 'high' ? 'bg-orange-500 text-white border-orange-600' :
                        priority === 'medium' ? 'bg-yellow-500 text-white border-yellow-600' :
                        'bg-green-500 text-white border-green-600'
                      }`}>
                        {priority === 'urgent' ? 'Acil' :
                         priority === 'high' ? 'Yüksek' :
                         priority === 'medium' ? 'Orta' : 'Düşük'}
                      </Badge>
                    </div>
                    {service.service_location && (
                      <div 
                        className="flex items-center gap-2 text-xs text-gray-700 mb-2 cursor-pointer hover:text-blue-600 transition-all duration-200 group/location bg-gray-50 rounded-lg px-2 py-1.5 hover:bg-blue-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/service/map?serviceId=${service.id}`);
                        }}
                        title="Haritada göster"
                      >
                        <MapPin className="h-3.5 w-3.5 text-orange-500 group-hover/location:text-blue-500 flex-shrink-0 transition-colors" />
                        <span className="truncate font-medium group-hover/location:text-blue-600">{service.service_location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs bg-blue-50 rounded-lg px-2 py-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                        <span className="font-semibold text-blue-700">
                          {service.service_due_date
                            ? format(new Date(service.service_due_date), 'HH:mm', { locale: tr })
                            : 'Tarih yok'}
                        </span>
                      </div>
                      <Badge variant="outline" className={`text-xs font-semibold shadow-sm ${statusBadge.class}`}>
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

      {/* Alt Bilgi Paneli - Öncelik Göstergeleri - Modernize */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">
                Servisleri tıklayarak detaylarını görüntüleyebilir, sürükleyerek tarihlerini değiştirebilirsiniz
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-700 text-sm">Öncelik:</span>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: '#ef4444' }}></div>
                  <span className="text-sm font-semibold text-red-700">Acil</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: '#f97316' }}></div>
                  <span className="text-sm font-semibold text-orange-700">Yüksek</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: '#eab308' }}></div>
                  <span className="text-sm font-semibold text-yellow-700">Orta</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm ring-2 ring-white" style={{ backgroundColor: '#22c55e' }}></div>
                  <span className="text-sm font-semibold text-green-700">Düşük</span>
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
