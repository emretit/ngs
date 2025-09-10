
import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import { ServiceRequestDetail } from "@/components/service/ServiceRequestDetail";
import ServicePageHeader from "@/components/service/ServicePageHeader";
import ServiceStatsCards from "@/components/service/ServiceStatsCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CalendarDays, Users, Clock, AlertCircle, CheckCircle, XCircle, Pause, ChevronLeft, ChevronRight, Eye, EyeOff, User, MapPin, Search, Filter, ChevronUp, ChevronDown, Calendar } from "lucide-react";
import ServiceViewToggle from "@/components/service/ServiceViewToggle";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/tr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('tr');
// Haftanın Pazartesi'den başlaması için
moment.updateLocale('tr', {
  week: {
    dow: 1, // Pazartesi = 1, Pazar = 0
  }
});
const localizer = momentLocalizer(moment);

// Custom Resource View - React Big Calendar'da resource view için özel view gerekli

interface ServicePageProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const ServicePage = ({ isCollapsed, setIsCollapsed }: ServicePageProps) => {
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Calendar state'leri
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);
  const [showCompletedServices, setShowCompletedServices] = useState(true);
  const [showResourceView, setShowResourceView] = useState(true);
  const [assignedServices, setAssignedServices] = useState<Map<string, string>>(new Map());
  const [activeView, setActiveView] = useState<"calendar" | "list">("calendar");
  
  // Liste görünümü için state'ler
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<"title" | "priority" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: serviceRequests, isLoading, error } = useServiceRequests();

  // Teknisyenleri getir
  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('department', 'Teknik')
        .eq('status', 'aktif');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSelectRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsDetailOpen(true);
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

  // Test verisi - sadece atanmış servisler
  const testEvents = [
    {
      id: '1',
      title: 'Klima Bakımı',
      start: new Date(2024, 8, 10, 9, 0),
      end: new Date(2024, 8, 10, 11, 0),
      resourceId: 'tech1',
      priority: 'high',
      status: 'in_progress',
      location: 'Ofis A',
      serviceType: 'Bakım',
      description: 'Aylık rutin klima bakımı',
    },
    {
      id: '2',
      title: 'Elektrik Panosu Kontrolü',
      start: new Date(2024, 8, 10, 14, 0),
      end: new Date(2024, 8, 10, 16, 0),
      resourceId: 'tech2',
      priority: 'medium',
      status: 'assigned',
      location: 'Ofis B',
      serviceType: 'Kontrol',
      description: 'Elektrik panosunda rutin kontrol',
    },
    {
      id: '3',
      title: 'Network Kurulumu',
      start: new Date(2024, 8, 11, 10, 0),
      end: new Date(2024, 8, 11, 12, 0),
      resourceId: 'tech3',
      priority: 'urgent',
      status: 'new',
      location: 'Yeni Ofis',
      serviceType: 'Kurulum',
      description: 'Yeni ofis için network altyapısı kurulumu',
    }
  ];

  const testTechnicians = [
    { id: 'tech1', first_name: 'Can', last_name: 'Öztürk' },
    { id: 'tech2', first_name: 'Zeynep', last_name: 'Arslan' },
    { id: 'tech3', first_name: 'Ahmet', last_name: 'Yılmaz' },
    { id: 'tech4', first_name: 'Mehmet', last_name: 'Kaya' },
    { id: 'tech5', first_name: 'Ali', last_name: 'Demir' },
  ];

  // Calendar events'leri oluştur
  const calendarEvents = useMemo(() => {
    const allEvents = [...testEvents];
    
    // Gerçek servis taleplerini de ekle
    if (serviceRequests && serviceRequests.length > 0) {
      const realEvents = serviceRequests.map(request => ({
        id: `real-${request.id}`,
        title: request.title || 'Servis Talebi',
        start: request.due_date ? new Date(request.due_date) : new Date(),
        end: request.due_date ? new Date(new Date(request.due_date).getTime() + 2 * 60 * 60 * 1000) : new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 saat sonra
        resourceId: request.assigned_to || 'unassigned',
        priority: request.priority || 'medium',
        status: request.status || 'pending',
        location: request.location || 'Belirtilmemiş',
        serviceType: request.service_type || 'Genel',
        description: request.description || '',
      }));
      allEvents.push(...realEvents);
    }
    
    return allEvents
      .filter(event => {
        // Tamamlanan servisleri filtrele
        if (!showCompletedServices && event.status === 'completed') {
          return false;
        }
        
        // Arama filtresi
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            event.title?.toLowerCase().includes(searchLower) ||
            event.location?.toLowerCase().includes(searchLower) ||
            event.description?.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }
        
        // Durum filtresi
        if (statusFilter !== 'all') {
          if (statusFilter === 'new' && event.status !== 'new' && event.status !== 'assigned') {
            return false;
          } else if (statusFilter !== 'new' && event.status !== statusFilter) {
            return false;
          }
        }
        
        // Öncelik filtresi
        if (priorityFilter !== 'all' && event.priority !== priorityFilter) {
          return false;
        }
        
        return true;
      })
      .map(event => {
        // Eğer bu servis atanmışsa, assignedServices state'inden resourceId'yi al
        const assignedResourceId = assignedServices.get(event.id);
        const finalResourceId = assignedResourceId || event.resourceId;
        
        return {
          id: event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          resourceId: finalResourceId,
          priority: event.priority,
          status: event.status,
          location: event.location,
          serviceType: event.serviceType,
          style: {
            backgroundColor: getPriorityColor(event.priority),
            borderColor: getPriorityColor(event.priority),
            color: 'white',
            borderRadius: '6px',
            border: 'none',
            fontSize: '12px',
            fontWeight: '500',
          }
        };
      });
  }, [showCompletedServices, serviceRequests, assignedServices, searchQuery, statusFilter, priorityFilter]);

  // Resources'ları oluştur
  const resources = useMemo(() => {
    // Veritabanından gelen teknisyenler varsa onları kullan, yoksa test verilerini kullan
    const techList = technicians && technicians.length > 0 ? technicians : testTechnicians;
    
    return techList.map(tech => ({
      resourceId: tech.id,
      title: `${tech.first_name} ${tech.last_name}`,
    }));
  }, [technicians]);

  // Event handlers
  const handleSelectEvent = useCallback((event: any) => {
    console.log('Event selected:', event);
  }, []);

  const handleEventDrop = useCallback(({ event, start, end }: any) => {
    console.log('Event moved:', event, start, end);
  }, []);

  const handleEventResize = useCallback(({ event, start, end }: any) => {
    console.log('Event resized:', event, start, end);
  }, []);

  const eventStyleGetter = useCallback((event: any) => {
    return {
      style: {
        backgroundColor: getPriorityColor(event.priority),
        borderColor: getPriorityColor(event.priority),
        color: 'white',
        borderRadius: '6px',
        border: 'none',
        fontSize: '12px',
        fontWeight: '500',
        opacity: event.status === 'completed' ? 0.7 : 1,
      }
    };
  }, []);

  // Liste görünümü için filtreleme
  const filteredServices = serviceRequests?.filter(request => {
    const matchesSearch = !searchQuery || 
      request.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'new' && (request.status === 'new' || request.status === 'assigned')) ||
      (statusFilter !== 'new' && request.status === statusFilter);
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  // Sıralama
  const sortedServices = [...filteredServices].sort((a, b) => {
    let valueA, valueB;
    
    if (sortField === "title") {
      valueA = (a.title || '').toLowerCase();
      valueB = (b.title || '').toLowerCase();
    } else if (sortField === "priority") {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      valueA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      valueB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
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

  // İstatistikleri hesapla
  const stats = {
    total: serviceRequests?.length || 0,
    new: serviceRequests?.filter(r => r.status === 'new').length || 0,
    inProgress: serviceRequests?.filter(r => r.status === 'in_progress').length || 0,
    completed: serviceRequests?.filter(r => r.status === 'completed').length || 0,
    urgent: serviceRequests?.filter(r => r.priority === 'urgent').length || 0,
    unassigned: serviceRequests?.filter(r => !r.assigned_to).length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`transition-all duration-300 ${isCollapsed ? 'ml-[60px]' : 'ml-64'}`}>
        <TopBar />
        <div className="w-full p-6">
          <div className="space-y-6">
            <ServicePageHeader 
              activeView={activeView} 
              setActiveView={setActiveView}
              onCreateRequest={() => {
                // Header component'inde form açılacak
              }}
            />

            <ServiceStatsCards 
              stats={stats} 
              viewType={activeView} 
            />

            {/* Content based on view */}
            {activeView === "calendar" ? (
              /* React Big Calendar */
              <>
                {/* Filters for Calendar View */}
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

                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                    Servis Takvimi
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                      className="ml-2"
                    >
                      <CalendarDays className="h-4 w-4 mr-1" />
                      Bugün
                    </Button>
                  </div>
                </div>

                {/* Kontrol Paneli */}
                <div className="flex items-center justify-between gap-4">
                  {/* Görünüm Seçici */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Görünüm:</span>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <Button
                        variant={view === Views.DAY ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView(Views.DAY)}
                        className="h-8 px-3"
                      >
                        Gün
                      </Button>
                      <Button
                        variant={view === Views.WEEK ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView(Views.WEEK)}
                        className="h-8 px-3"
                      >
                        Hafta
                      </Button>
                      <Button
                        variant={view === Views.MONTH ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView(Views.MONTH)}
                        className="h-8 px-3"
                      >
                        Ay
                      </Button>
                    </div>
                  </div>

                  {/* Filtre Kontrolü */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResourceView(!showResourceView)}
                      className={`h-8 ${showResourceView ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Teknisyen Görünümü
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCompletedServices(!showCompletedServices)}
                      className={`h-8 ${showCompletedServices ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                    >
                      {showCompletedServices ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                      Tamamlanan
                    </Button>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{resources.length} teknisyen</span>
                      <span>•</span>
                      <span>{calendarEvents.length} servis</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Gantt Style Calendar with Unassigned Services */}
              <div className="flex" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Ana Takvim Alanı */}
                <div className="flex-1 flex flex-col border-r border-gray-300">
                  {/* Gün Başlıkları */}
                  <div className="flex border-b border-gray-300">
                    {/* Sol boş alan - Teknisyen başlığı için */}
                    <div className="w-36 bg-blue-600 text-white p-2 font-semibold text-sm border-r border-blue-700">
                      Teknisyenler / Günler
                    </div>
                    
                    {/* Gün sütunları - Tam hafta (Pazartesi-Pazar) */}
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = moment(currentDate).startOf('week').add(i, 'days');
                      const turkishDays = {
                        'Sunday': 'Pazar',
                        'Monday': 'Pazartesi', 
                        'Tuesday': 'Salı',
                        'Wednesday': 'Çarşamba',
                        'Thursday': 'Perşembe',
                        'Friday': 'Cuma',
                        'Saturday': 'Cumartesi'
                      };
                      const dayName = date.format('dddd');
                      const turkishDay = turkishDays[dayName as keyof typeof turkishDays] || dayName;
                      
                      return (
                        <div key={i} className={`w-32 bg-gray-100 p-2 text-center ${i < 6 ? 'border-r border-gray-300' : ''}`}>
                          <div className="text-xs font-medium text-gray-700">{turkishDay}</div>
                          <div className="text-sm font-semibold text-gray-900 mt-1">{date.format('DD MMM')}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Teknisyen Satırları */}
                  <div className="flex-1 overflow-y-auto">
                    {resources.map((tech, techIndex) => (
                      <div key={tech.resourceId} className="flex border-b border-gray-200 hover:bg-gray-50">
                        {/* Teknisyen İsmi */}
                        <div className="w-36 bg-gray-50 border-r border-gray-300 p-2 flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900 truncate">{tech.title}</p>
                            <p className="text-xs text-gray-500">Teknisyen</p>
                          </div>
                        </div>
                        
                        {/* Gün hücreleri - Tam hafta (Pazartesi-Pazar) */}
                        {Array.from({ length: 7 }, (_, i) => {
                          const date = moment(currentDate).startOf('week').add(i, 'days');
                          
                          // Bu teknisyen ve günde servis var mı kontrol et
                          const dayServices = calendarEvents.filter(event => {
                            const eventDate = moment(event.start);
                            return eventDate.isSame(date, 'day') && event.resourceId === tech.resourceId;
                          });

                          return (
                        <div 
                          key={i} 
                          className={`w-32 p-2 min-h-20 relative hover:bg-gray-50 transition-colors ${i < 6 ? 'border-r border-gray-200' : ''}`}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.backgroundColor = '';
                            e.currentTarget.style.border = '';
                            
                            const serviceData = e.dataTransfer.getData('text/plain');
                            if (serviceData) {
                              const service = JSON.parse(serviceData);
                              console.log('✅ Servis atandı:', service.title, '→ Teknisyen:', tech.title, 'Gün:', i);
                              
                              // State'i güncelle - servisi teknisyene ata
                              setAssignedServices(prev => {
                                const newMap = new Map(prev);
                                newMap.set(service.id, tech.resourceId);
                                return newMap;
                              });
                              
                              // Başarı mesajı göster
                              alert(`✅ ${service.title} servisi ${tech.title} teknisyenine atandı!`);
                              
                              // Burada gerçek atama işlemi yapılacak
                              // TODO: Supabase'e servisi teknisyene atama
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.backgroundColor = '#dbeafe';
                            e.currentTarget.style.border = '2px dashed #3b82f6';
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '';
                            e.currentTarget.style.border = '';
                          }}
                        >
                              {dayServices.map((service, serviceIndex) => (
                                <div 
                                  key={serviceIndex}
                                  className="mb-1 rounded px-2 py-1 text-xs text-white cursor-pointer"
                                  style={{ 
                                    backgroundColor: service.style?.backgroundColor || '#3b82f6',
                                    fontSize: '9px',
                                    lineHeight: '1.2'
                                  }}
                                  onClick={() => handleSelectEvent(service)}
                                >
                                  <div className="font-medium truncate text-xs">{service.title}</div>
                                  <div className="opacity-80 truncate text-xs">{service.location}</div>
                                  <div className="opacity-70 text-xs">
                                    {moment(service.start).format('HH:mm')} - {moment(service.end).format('HH:mm')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Atanmamış Servisler Sidebar */}
                <div className="w-80 bg-gray-50 flex flex-col border-l border-gray-300">
                  <div className="p-3 bg-orange-600 text-white border-b border-orange-700">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Atanmamış Servisler
                    </h3>
                    <p className="text-xs opacity-90 mt-1">Teknisyenlere sürükleyip bırakın</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {/* Atanmamış servisleri filtrele */}
                    {calendarEvents
                      .filter(event => !event.resourceId || event.resourceId === 'unassigned')
                      .map((service, index) => (
                        <div 
                          key={index}
                          className="bg-white border border-gray-200 rounded-lg p-2 cursor-move hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', JSON.stringify(service));
                            e.currentTarget.style.opacity = '0.5';
                            e.currentTarget.style.transform = 'rotate(5deg)';
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'rotate(0deg)';
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-xs truncate">{service.title}</h4>
                              {service.location && (
                                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {service.location}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: service.style?.backgroundColor || '#3b82f6' }}
                                ></span>
                                <span className="text-xs text-gray-500">
                                  {moment(service.start).format('HH:mm')} - {moment(service.end).format('HH:mm')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2">
                              <User className="h-3 w-3 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {/* Atanmamış servis yoksa */}
                    {calendarEvents.filter(event => !event.resourceId || event.resourceId === 'unassigned').length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Tüm servisler atanmış!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alt Bilgi Paneli */}
              <div className="bg-gray-50 border-t border-gray-200 p-2">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    <span>Servisleri sürükleyerek farklı teknisyenlere ve zamanlara atayabilirsiniz</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span>Öncelik:</span>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>Acil</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span>Yüksek</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span>Orta</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Düşük</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                          <TableCell colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                            Yükleniyor...
                          </TableCell>
                        </TableRow>
                      ) : sortedServices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                            Servis talebi bulunamadı
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedServices.map((service) => {
                          const technician = technicians?.find(tech => tech.id === service.assigned_to);
                          return (
                            <TableRow 
                              key={service.id} 
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleSelectRequest(service)}
                            >
                              <TableCell className="px-4 py-4">
                                <div className="text-sm font-mono text-muted-foreground">
                                  {service.service_number || 'SR-' + service.id.slice(-6).toUpperCase()}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">{service.title}</p>
                                  {service.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {service.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  {service.location || 'Belirtilmemiş'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <Badge 
                                  variant="outline" 
                                  className={`${
                                    service.priority === 'urgent' ? 'border-red-500 text-red-700 bg-red-50' :
                                    service.priority === 'high' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                                    service.priority === 'medium' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                    'border-green-500 text-green-700 bg-green-50'
                                  }`}
                                >
                                  {service.priority === 'urgent' ? 'Acil' :
                                   service.priority === 'high' ? 'Yüksek' :
                                   service.priority === 'medium' ? 'Orta' : 'Düşük'}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <Badge 
                                  variant="outline"
                                  className={`${
                                    service.status === 'new' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                                    service.status === 'in_progress' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                    service.status === 'completed' ? 'border-green-500 text-green-700 bg-green-50' :
                                    'border-gray-500 text-gray-700 bg-gray-50'
                                  }`}
                                >
                                  {service.status === 'new' ? 'Yeni' :
                                   service.status === 'in_progress' ? 'Devam Ediyor' :
                                   service.status === 'completed' ? 'Tamamlandı' :
                                   service.status === 'assigned' ? 'Atanmış' : 'Bilinmeyen'}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  {technician ? `${technician.first_name} ${technician.last_name}` : 
                                   service.assigned_to ? 'Bilinmeyen Teknisyen' : 'Atanmamış'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {service.reported_date ? moment(service.reported_date).format('DD.MM.YYYY') : 'Bildirilmedi'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {service.due_date ? moment(service.due_date).format('DD.MM.YYYY') : 'Tarih belirtilmemiş'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {!service.assigned_to ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // TODO: Teknisyen atama
                                      }}
                                    >
                                      <User className="h-4 w-4 mr-1" />
                                      Ata
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectRequest(service);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      Detay
                                    </Button>
                                  )}
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

          <ServiceRequestDetail 
            serviceRequest={selectedRequest}
            isOpen={isDetailOpen}
            onClose={() => {
              setIsDetailOpen(false);
              setSelectedRequest(null);
            }}
          />

        </div>
      </main>
    </div>
  );
};

export default ServicePage;
