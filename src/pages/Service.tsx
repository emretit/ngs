import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import ServicePageHeader from "@/components/service/ServicePageHeader";
import ServiceKanbanBoard from "@/components/service/ServiceKanbanBoard";
import ServiceMapView from "@/components/service/ServiceMapView";
import ResourceSchedulingView from "@/components/service/ResourceSchedulingView";
import ServiceGanttView from "@/components/service/ServiceGanttView";
import ServiceCalendarView from "@/components/service/ServiceCalendarView";
import { SLAAlerter } from "@/components/service/SLAAlerter";
import { SLADashboard } from "@/components/service/SLADashboard";
import { MaintenanceCalendarView } from "@/components/service/MaintenanceCalendarView";
import { ServiceTemplateLibrary } from "@/components/service/ServiceTemplateLibrary";
import { TechnicianPerformanceDashboard } from "@/components/service/TechnicianPerformanceDashboard";
import { ServiceCostAnalysis } from "@/components/service/ServiceCostAnalysis";
import { ServicePartsInventoryAlert } from "@/components/service/ServicePartsInventoryAlert";
import { ServicePartsUsageReport } from "@/components/service/ServicePartsUsageReport";
import { CustomerSatisfactionDashboard } from "@/components/service/CustomerSatisfactionDashboard";
import { ServiceAnalyticsDashboard } from "@/components/service/ServiceAnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Clock, AlertCircle, User, MapPin, Search, Filter, ChevronUp, ChevronDown, Calendar, Trash2, Edit, Eye, Settings, FileText } from "lucide-react";
import ServiceViewToggle from "@/components/service/ServiceViewToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from '@/utils/dateUtils';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "@/hooks/use-toast";
import { getSLAStatusColor, getSLAStatusLabel, formatSLATimeRemaining, getSLATimeRemaining } from '@/utils/serviceSlaUtils';

interface ServicePageProps {
  defaultView?: "list" | "kanban" | "map" | "scheduling" | "calendar" | "sla" | "maintenance" | "templates" | "performance" | "costs" | "parts" | "satisfaction" | "analytics";
  hideHeader?: boolean;
}

const ServicePage = ({ defaultView = "scheduling", hideHeader = false }: ServicePageProps = {}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userData } = useCurrentUser();
  // Silme onayı için state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRequest | null>(null);
  const [activeView, setActiveView] = useState<"list" | "kanban" | "map" | "scheduling" | "calendar" | "sla" | "maintenance" | "templates" | "performance" | "costs" | "parts" | "satisfaction" | "analytics">(defaultView);
  // URL parametresinden view'ı kontrol et
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam) {
      if (viewParam === 'list') {
        setActiveView('list');
      } else if (viewParam === 'kanban') {
        setActiveView('kanban');
      } else if (viewParam === 'map') {
        setActiveView('map');
      } else if (viewParam === 'scheduling') {
        setActiveView('scheduling');
      } else if (viewParam === 'calendar') {
        setActiveView('calendar');
      } else if (viewParam === 'sla') {
        setActiveView('sla');
      } else if (viewParam === 'maintenance') {
        setActiveView('maintenance');
      } else if (viewParam === 'templates') {
        setActiveView('templates');
      } else if (viewParam === 'performance') {
        setActiveView('performance');
      } else if (viewParam === 'costs') {
        setActiveView('costs');
      } else if (viewParam === 'parts') {
        setActiveView('parts');
      } else if (viewParam === 'satisfaction') {
        setActiveView('satisfaction');
      } else if (viewParam === 'analytics') {
        setActiveView('analytics');
      }
    } else {
      setActiveView(defaultView);
    }
  }, [searchParams, defaultView]);
  // Liste görünümü için state'ler
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<"title" | "priority" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { data: serviceRequests, isLoading, error, deleteServiceRequest } = useServiceRequests();
  const queryClient = useQueryClient();

  // Durum güncelleme mutation'ı
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, newStatus }: { requestId: string, newStatus: string }) => {
      const { data, error } = await supabase
        .from('service_requests')
        .update({ service_status: newStatus })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast({
        title: "Başarılı",
        description: "Servis durumu güncellendi.",
      });
    },
    onError: (error) => {
      console.error('Durum güncelleme hatası:', error);
      toast({
        title: "Hata",
        description: "Servis durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  });

  // Durum güncelleme handler'ı
  const handleUpdateStatus = (requestId: string, newStatus: string) => {
    updateStatusMutation.mutate({ requestId, newStatus });
  };
  // Teknisyenleri getir
  const { data: technicians } = useQuery({
    queryKey: ['technicians', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return [];
      }
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', userData.company_id)
        .eq('department', 'Teknik')
        .eq('status', 'aktif');
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id,
  });
  // Müşteri verilerini getir
  const { data: customers } = useQuery({
    queryKey: ['customers', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return [];
      }
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company')
        .eq('company_id', userData.company_id);
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id,
  });
  const handleSelectRequest = (request: ServiceRequest) => {
    navigate(`/service/edit/${request.id}`);
  };

  const handleEditRequest = (request: ServiceRequest) => {
    navigate(`/service/edit/${request.id}`);
  };
  // Silme fonksiyonu
  const handleDeleteService = (service: ServiceRequest) => {
    setServiceToDelete(service);
    setDeleteConfirmOpen(true);
  };
  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteServiceRequest(serviceToDelete.id);
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    }
  };
  // Öncelik renklerini belirle
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: '#ef4444',
      high: '#f97316',
      medium: '#eab308', 
      low: '#22c55e',
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  };
  // Liste görünümü için filtreleme
  const filteredServices = serviceRequests?.filter(request => {
    const matchesSearch = !searchQuery || 
      request.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.service_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.service_request_description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'new' && (request.service_status === 'new' || request.service_status === 'assigned')) ||
      (statusFilter !== 'new' && request.service_status === statusFilter);
    const matchesPriority = priorityFilter === 'all' || request.service_priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];
  // Sıralama
  const sortedServices = [...filteredServices].sort((a, b) => {
    let valueA, valueB;
    if (sortField === "title") {
      valueA = (a.service_title || '').toLowerCase();
      valueB = (b.service_title || '').toLowerCase();
    } else if (sortField === "priority") {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      valueA = priorityOrder[a.service_priority as keyof typeof priorityOrder] || 0;
      valueB = priorityOrder[b.service_priority as keyof typeof priorityOrder] || 0;
    } else { // created_at
      valueA = new Date(a.created_at || 0).getTime();
      valueB = new Date(b.created_at || 0).getTime();
    }
    if (sortDirection === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });
  const handleSort = (field: "title" | "priority" | "created_at") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "created_at" ? "desc" : "asc");
    }
  };
  // Servis taleplerini durumlarına göre grupla
  const groupedServiceRequests = useMemo(() => {
    if (!serviceRequests) return {};
    
    return serviceRequests.reduce((acc, request) => {
      const status = request.service_status || 'new';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(request);
      return acc;
    }, {} as { [key: string]: ServiceRequest[] });
  }, [serviceRequests]);

  return (
    <>
      <div className="space-y-6">
        {!hideHeader && (
          <ServicePageHeader 
            activeView={activeView} 
            setActiveView={setActiveView}
            onCreateRequest={() => navigate("/service/new")}
            serviceRequests={groupedServiceRequests}
          />
        )}
        
        {/* SLA Alerts */}
        <SLAAlerter />
        
        {/* Parts Inventory Alerts */}
        <ServicePartsInventoryAlert />
        
        {/* Content based on view */}
        {activeView === "scheduling" ? (
          /* Gantt Chart View */
          <ServiceGanttView
            serviceRequests={serviceRequests || []}
            technicians={technicians || []}
            onSelectService={handleSelectRequest}
            onUpdateAssignment={async (serviceId, technicianId, startTime, endTime) => {
              try {
                // Servis bilgisini al
                const { data: service, error: serviceError } = await supabase
                  .from('service_requests')
                  .select('service_title, company_id')
                  .eq('id', serviceId)
                  .single();

                if (serviceError || !service) {
                  throw new Error('Servis bulunamadı');
                }

                // Teknisyenin user_id'sini bul
                const { data: technician, error: techError } = await supabase
                  .from('employees')
                  .select('user_id, first_name, last_name')
                  .eq('id', technicianId)
                  .single();

                if (techError || !technician) {
                  throw new Error('Teknisyen bulunamadı');
                }

                // Servis atama güncellemesi
                const { error } = await supabase
                  .from('service_requests')
                  .update({
                    assigned_technician: technicianId,
                    issue_date: startTime.toISOString(),
                    service_due_date: endTime.toISOString(),
                    service_status: 'assigned'
                  })
                  .eq('id', serviceId);

                if (error) {
                  throw error;
                }

                // Teknisyene bildirim gönder (eğer user_id varsa)
                if (technician.user_id) {
                  const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert({
                      user_id: technician.user_id,
                      title: 'Yeni Servis Ataması',
                      body: `${service.service_title} servisi size atandı. Tarih: ${formatDate(startTime, 'dd MMM yyyy HH:mm')}`,
                      type: 'service_assignment',
                      service_request_id: serviceId,
                      technician_id: technicianId,
                      company_id: service.company_id,
                      is_read: false,
                    });

                  if (notificationError) {
                    console.error('Bildirim gönderme hatası:', notificationError);
                    // Bildirim hatası kritik değil, devam et
                  }
                }

                queryClient.invalidateQueries({ queryKey: ['service-requests'] });
                toast({
                  title: "Başarılı",
                  description: "Servis teknisyene atandı ve bildirim gönderildi.",
                });
              } catch (error: any) {
                console.error('Servis atama hatası:', error);
                toast({
                  title: "Hata",
                  description: error.message || "Servis ataması güncellenirken bir hata oluştu.",
                  variant: "destructive",
                });
              }
            }}
          />
        ) : activeView === "map" ? (
          /* Map View */
          <ServiceMapView
            serviceRequests={serviceRequests || []}
            technicians={technicians || []}
            onSelectService={handleSelectRequest}
          />
        ) : activeView === "calendar" ? (
          /* Calendar View */
          <ServiceCalendarView
            serviceRequests={serviceRequests || []}
            technicians={technicians || []}
            onSelectService={handleSelectRequest}
          />
        ) : activeView === "sla" ? (
          /* SLA Dashboard View */
          <SLADashboard />
        ) : activeView === "maintenance" ? (
          /* Maintenance Calendar View */
          <MaintenanceCalendarView />
        ) : activeView === "templates" ? (
          /* Service Templates Library */
          <ServiceTemplateLibrary />
        ) : activeView === "performance" ? (
          /* Technician Performance Dashboard */
          <TechnicianPerformanceDashboard />
        ) : activeView === "costs" ? (
          /* Service Cost Analysis */
          <ServiceCostAnalysis />
        ) : activeView === "parts" ? (
          /* Parts Usage Report */
          <ServicePartsUsageReport />
        ) : activeView === "satisfaction" ? (
          /* Customer Satisfaction Dashboard */
          <CustomerSatisfactionDashboard />
        ) : activeView === "analytics" ? (
          /* Service Analytics Dashboard */
          <ServiceAnalyticsDashboard />
        ) : activeView === "kanban" ? (
          /* Kanban Board View */
          <>
            {/* Filters for Kanban View */}
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gradient-to-r from-card/80 to-muted/40 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
              <div className="relative w-[400px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Servis adı, lokasyon veya açıklama ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
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
            </div>
            <ServiceKanbanBoard
              serviceRequests={serviceRequests || []}
              technicians={technicians || []}
              customers={customers || []}
              onSelectRequest={handleSelectRequest}
              onDeleteService={handleDeleteService}
              onUpdateStatus={handleUpdateStatus}
              searchQuery={searchQuery}
              priorityFilter={priorityFilter}
            />
          </>
        ) : (
          /* Liste Görünümü */
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gradient-to-r from-card/80 to-muted/40 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
              <div className="relative w-[400px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Servis adı, lokasyon veya açıklama ile ara..."
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
            </div>
            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b">
                    <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                      🔢 Servis No
                    </TableHead>
                    <TableHead 
                      className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center">
                        <span>🔧 Servis Adı</span>
                        {sortField === "title" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                      📍 Lokasyon
                    </TableHead>
                    <TableHead 
                      className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("priority")}
                    >
                      <div className="flex items-center">
                        <span>⚡ Öncelik</span>
                        {sortField === "priority" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                      📊 Durum
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                      👤 Teknisyen
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                      📅 Bildirilme
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                      📋 Planlanan
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                      ⏰ Teslim
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left align-middle font-bold text-foreground/80 whitespace-nowrap text-sm tracking-wide">
                      ⚙️ İşlemler
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                        Yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : sortedServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                        Servis talebi bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedServices.map((service) => {
                      const technician = technicians?.find(tech => tech.id === service.assigned_technician);
                      const slaTimeRemaining = service.sla_due_time
                        ? getSLATimeRemaining(new Date(service.sla_due_time))
                        : null;
                      return (
                        <TableRow 
                          key={service.id} 
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="px-4 py-4">
                            <div className="text-sm font-mono text-muted-foreground">
                              {service.service_number || 'SR-' + service.id.slice(-6).toUpperCase()}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">{service.service_title}</p>
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Müşteri:</span> {
                                  service.customer_id ? (() => {
                                    const customer = customers?.find(c => c.id === service.customer_id);
                                    return customer?.company || customer?.name || 'Bilinmeyen Müşteri';
                                  })() : 'Belirtilmemiş'
                                }
                              </p>
                              {service.service_request_description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  <span className="font-medium">Servis Talebi:</span> {service.service_request_description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {service.service_location || 'Belirtilmemiş'}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <Badge 
                              variant="outline" 
                              className={`${
                                service.service_priority === 'urgent' ? 'border-red-500 text-red-700 bg-red-50' :
                                service.service_priority === 'high' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                                service.service_priority === 'medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                'border-green-500 text-green-700 bg-green-50'
                              }`}
                            >
                              {service.service_priority === 'urgent' ? 'Acil' :
                               service.service_priority === 'high' ? 'Yüksek' :
                               service.service_priority === 'medium' ? 'Orta' : 'Düşük'}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <Badge 
                                variant="outline"
                                className={`${
                                  service.service_status === 'new' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                                  service.service_status === 'in_progress' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                  service.service_status === 'completed' ? 'border-green-500 text-green-700 bg-green-50' :
                                  'border-gray-500 text-gray-700 bg-gray-50'
                                }`}
                              >
                                {service.service_status === 'new' ? 'Yeni' :
                                 service.service_status === 'in_progress' ? 'Devam Ediyor' :
                                 service.service_status === 'completed' ? 'Tamamlandı' :
                                 service.service_status === 'assigned' ? 'Atanmış' : 'Bilinmeyen'}
                              </Badge>
                              {service.sla_status && (
                                <Badge 
                                  variant="outline"
                                  className={`text-xs ${getSLAStatusColor(service.sla_status as any)}`}
                                  title={slaTimeRemaining ? formatSLATimeRemaining(slaTimeRemaining) : ''}
                                >
                                  {getSLAStatusLabel(service.sla_status as any)}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              {technician ? `${technician.first_name} ${technician.last_name}` : 
                               service.assigned_technician ? 'Bilinmeyen Teknisyen' : 'Atanmamış'}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {service.service_reported_date ? formatDate(service.service_reported_date) : 'Bildirilmedi'}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {service.issue_date ? formatDate(service.issue_date) : 'Planlanmamış'}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {service.service_due_date ? formatDate(service.service_due_date) : 'Tarih belirtilmemiş'}
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-4 text-center">
                            <div className="flex justify-center space-x-2">
                              {/* Düzenle Butonu */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectRequest(service);
                                }}
                                className="h-8 w-8"
                                title="Detay"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {/* Silme Butonu */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteService(service);
                                }}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                title="Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
      {/* Silme Onay Dialog'u */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Servis Talebini Sil
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600 mb-2">
                Bu servis talebini silmek istediğinizden emin misiniz?
              </p>
              {serviceToDelete && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">{serviceToDelete.service_title}</p>
                  <p className="text-sm text-gray-600">
                    Servis No: {serviceToDelete.service_number || 'SR-' + serviceToDelete.id.slice(-6).toUpperCase()}
                  </p>
                </div>
              )}
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Bu işlem geri alınamaz. Servis talebi ve ilgili tüm veriler kalıcı olarak silinecektir.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          </DialogContent>
        </Dialog>
    </>
  );
};
export default ServicePage;
export { ServicePage };
