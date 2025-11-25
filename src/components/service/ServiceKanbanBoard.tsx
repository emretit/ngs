import React, { useState, useMemo } from "react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Edit,
  Eye,
  Trash2,
  MoreVertical
} from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface ServiceKanbanBoardProps {
  serviceRequests: ServiceRequest[];
  technicians: any[];
  customers: any[];
  onSelectRequest: (request: ServiceRequest) => void;
  onDeleteService: (request: ServiceRequest) => void;
  onUpdateStatus: (requestId: string, newStatus: string) => void;
  searchQuery?: string;
  priorityFilter?: string;
}

type ServiceStatus = 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

interface KanbanColumn {
  id: ServiceStatus;
  title: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const ServiceKanbanBoard = ({
  serviceRequests,
  technicians,
  customers,
  onSelectRequest,
  onDeleteService,
  onUpdateStatus,
  searchQuery = '',
  priorityFilter = 'all',
}: ServiceKanbanBoardProps) => {
  const navigate = useNavigate();
  const [draggedItem, setDraggedItem] = useState<ServiceRequest | null>(null);

  // Kanban kolonları - ServiceNow tarzı
  const columns: KanbanColumn[] = [
    {
      id: 'new',
      title: 'Yeni',
      icon: AlertCircle,
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      id: 'assigned',
      title: 'Atanmış',
      icon: Circle,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'in_progress',
      title: 'Devam Ediyor',
      icon: Clock,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      id: 'on_hold',
      title: 'Beklemede',
      icon: AlertTriangle,
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'completed',
      title: 'Tamamlandı',
      icon: CheckCircle2,
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'cancelled',
      title: 'İptal',
      icon: XCircle,
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  // Servisleri durumlara göre grupla ve filtrele
  const groupedServices = useMemo(() => {
    const grouped: Record<ServiceStatus, ServiceRequest[]> = {
      new: [],
      assigned: [],
      in_progress: [],
      on_hold: [],
      completed: [],
      cancelled: []
    };

    // Önce filtreleri uygula
    const filteredRequests = serviceRequests.filter(request => {
      // Arama filtresi
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          request.service_title?.toLowerCase().includes(searchLower) ||
          request.service_location?.toLowerCase().includes(searchLower) ||
          request.service_request_description?.toLowerCase().includes(searchLower) ||
          request.service_number?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Öncelik filtresi
      if (priorityFilter !== 'all' && request.service_priority !== priorityFilter) {
        return false;
      }

      return true;
    });

    // Sonra gruplara ayır
    filteredRequests.forEach(request => {
      const status = request.service_status as ServiceStatus;
      if (grouped[status]) {
        grouped[status].push(request);
      } else {
        grouped.new.push(request);
      }
    });

    return grouped;
  }, [serviceRequests, searchQuery, priorityFilter]);

  // Öncelik renkleri
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Öncelik etiketleri
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Acil';
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, service: ServiceRequest) => {
    setDraggedItem(service);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: ServiceStatus) => {
    e.preventDefault();

    if (draggedItem && draggedItem.service_status !== targetStatus) {
      onUpdateStatus(draggedItem.id, targetStatus);
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Müşteri adını bul
  const getCustomerName = (customerId: string) => {
    const customer = customers?.find(c => c.id === customerId);
    return customer?.company || customer?.name || 'Bilinmeyen Müşteri';
  };

  // Teknisyen adını bul
  const getTechnicianName = (technicianId: string) => {
    const technician = technicians?.find(t => t.id === technicianId);
    return technician ? `${technician.first_name} ${technician.last_name}` : 'Atanmamış';
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 h-full">
        {columns.map((column) => {
          const ColumnIcon = column.icon;
          const columnServices = groupedServices[column.id];
          const count = columnServices.length;

          return (
            <div
              key={column.id}
              className="flex flex-col bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Kolon Header */}
              <div className={`${column.bgColor} ${column.borderColor} border-b-2 p-4 sticky top-0 z-10`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 bg-white rounded-lg shadow-sm ${column.borderColor} border`}>
                      <ColumnIcon className={`h-4 w-4 ${column.color}`} />
                    </div>
                    <h3 className={`font-bold text-sm ${column.color}`}>
                      {column.title}
                    </h3>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${column.bgColor} ${column.color} border ${column.borderColor} font-bold`}
                  >
                    {count}
                  </Badge>
                </div>
              </div>

              {/* Kolon Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-2 space-y-3 min-h-[200px]">
                {columnServices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${column.bgColor} flex items-center justify-center`}>
                      <ColumnIcon className={`h-6 w-6 ${column.color} opacity-40`} />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Servis yok</p>
                  </div>
                ) : (
                  columnServices.map((service) => {
                    const technician = technicians?.find(t => t.id === service.assigned_technician);

                    return (
                      <Card
                        key={service.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, service)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 cursor-move hover:shadow-lg transition-all duration-200 border-l-4 ${
                          service.service_priority === 'urgent' ? 'border-l-red-500' :
                          service.service_priority === 'high' ? 'border-l-orange-500' :
                          service.service_priority === 'medium' ? 'border-l-yellow-500' :
                          'border-l-green-500'
                        } ${draggedItem?.id === service.id ? 'opacity-50 scale-95' : ''}`}
                      >
                        {/* Kart Header - Başlık ve Menu */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-semibold text-sm text-gray-900 truncate cursor-pointer hover:text-blue-600"
                              onClick={() => onSelectRequest(service)}
                            >
                              {service.service_title || 'Başlıksız Servis'}
                            </h4>
                            <p className="text-xs text-gray-500 font-mono">
                              {service.service_number || 'SR-' + service.id.slice(-6).toUpperCase()}
                            </p>
                          </div>

                          {/* Dropdown Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onSelectRequest(service)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Görüntüle
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onSelectRequest(service)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteService(service)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Öncelik Badge */}
                        <div className="mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(service.service_priority || 'low')} border`}
                          >
                            {getPriorityLabel(service.service_priority || 'low')}
                          </Badge>
                        </div>

                        {/* Müşteri Bilgisi */}
                        {service.customer_id && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{getCustomerName(service.customer_id)}</span>
                          </div>
                        )}

                        {/* Lokasyon */}
                        {service.service_location && (
                          <div 
                            className="flex items-center gap-1.5 text-xs text-gray-600 mb-2 cursor-pointer hover:text-blue-600 transition-colors group"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/service/map?serviceId=${service.id}`);
                            }}
                            title="Haritada göster"
                          >
                            <MapPin className="h-3 w-3 flex-shrink-0 text-red-500 group-hover:text-blue-500 transition-colors" />
                            <span className="truncate group-hover:text-blue-600">{service.service_location}</span>
                          </div>
                        )}

                        {/* Tarih Bilgisi */}
                        {service.service_due_date && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                            <Calendar className="h-3 w-3 flex-shrink-0 text-blue-500" />
                            <span>{formatDate(service.service_due_date)}</span>
                          </div>
                        )}

                        {/* Teknisyen */}
                        <div className="pt-2 mt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            {technician ? (
                              <>
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                  {technician.first_name?.charAt(0)}{technician.last_name?.charAt(0)}
                                </div>
                                <span className="text-xs font-medium text-gray-700 truncate">
                                  {technician.first_name} {technician.last_name}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="h-3 w-3 text-gray-400" />
                                </div>
                                <span className="text-xs text-gray-500 italic">Atanmamış</span>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceKanbanBoard;
