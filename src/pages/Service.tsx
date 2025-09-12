
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import ServicePageHeader from "@/components/service/ServicePageHeader";
import ServiceStatsCards from "@/components/service/ServiceStatsCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CalendarDays, Users, Clock, AlertCircle, CheckCircle, XCircle, Pause, ChevronLeft, ChevronRight, Eye, EyeOff, User, MapPin, Search, Filter, ChevronUp, ChevronDown, Calendar, Trash2, Edit } from "lucide-react";
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
  const [searchParams] = useSearchParams();
  
  // Silme onayı için state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRequest | null>(null);

  // Calendar state'leri
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(Views.WEEK);
  const [showCompletedServices, setShowCompletedServices] = useState(true);
  const [showResourceView, setShowResourceView] = useState(true);
  const [assignedServices, setAssignedServices] = useState<Map<string, string>>(new Map());
  const [activeView, setActiveView] = useState<"calendar" | "list">("calendar");

  // URL parametresinden view'ı kontrol et
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'list') {
      setActiveView('list');
    }
  }, [searchParams]);
  
  // Liste görünümü için state'ler
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<"title" | "priority" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: serviceRequests, isLoading, error, deleteServiceRequest } = useServiceRequests();

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

  // Müşteri verilerini getir
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, company');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSelectRequest = (request: ServiceRequest) => {
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
        title: request.service_title || 'Servis Talebi',
        start: request.issue_date ? new Date(request.issue_date) : (request.service_due_date ? new Date(request.service_due_date) : new Date()),
        end: request.issue_date ? new Date(new Date(request.issue_date).getTime() + 2 * 60 * 60 * 1000) : (request.service_due_date ? new Date(new Date(request.service_due_date).getTime() + 2 * 60 * 60 * 1000) : new Date(Date.now() + 2 * 60 * 60 * 1000)), // 2 saat sonra
        resourceId: request.assigned_technician || 'unassigned',
        priority: request.service_priority || 'medium',
        status: request.service_status || 'pending',
        location: request.service_location || 'Belirtilmemiş',
        serviceType: request.service_type || 'Genel',
        description: request.service_request_description || '',
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
    navigate(`/service/edit/${event.id}`);
  }, [navigate]);

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

  // İstatistikleri hesapla
  const stats = {
    total: serviceRequests?.length || 0,
    new: serviceRequests?.filter(r => r.service_status === 'new').length || 0,
    inProgress: serviceRequests?.filter(r => r.service_status === 'in_progress').length || 0,
    completed: serviceRequests?.filter(r => r.service_status === 'completed').length || 0,
    urgent: serviceRequests?.filter(r => r.service_priority === 'urgent').length || 0,
    unassigned: serviceRequests?.filter(r => !r.assigned_technician).length || 0,
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
              onCreateRequest={() => navigate("/service/new")}
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

              {/* Modern Servis Takvimi */}
              <div className="flex rounded-xl overflow-hidden shadow-lg border border-gray-200" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Ana Takvim Alanı */}
                <div className="flex-1 flex flex-col bg-white">
                  {/* Teknisyen Satırları - Scroll Container'a Header Dahil */}
                  <div className="flex-1 overflow-y-auto bg-gray-50/30">
                    {/* Gün Başlıkları - Scroll Container İçinde */}
                    <div className="flex border-b border-gray-200 bg-gradient-to-r from-slate-50 to-slate-100">
                      {/* Sol boş alan - Teknisyen başlığı için - Sabit Genişlik */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 font-bold text-sm shadow-inner" style={{ minWidth: '160px', maxWidth: '160px', flexShrink: 0, boxSizing: 'border-box' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">Teknisyenler / Günler</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Gün sütunları Container - Teknisyen Satırlarıyla Aynı Yapı */}
                      <div className="flex flex-1">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = moment(currentDate).startOf('week').add(i, 'days');
                        const turkishDays = {
                          'Sunday': 'Pazar    ',      // 5 + 4 boşluk = 9 karakter
                          'Monday': 'Pazartesi',      // 8 + 1 boşluk = 9 karakter
                          'Tuesday': 'Salı     ',     // 4 + 5 boşluk = 9 karakter
                          'Wednesday': 'Çarşamba',     // 8 + 1 boşluk = 9 karakter
                          'Thursday': 'Perşembe ',     // 8 + 1 boşluk = 9 karakter
                          'Friday': 'Cuma     ',      // 4 + 5 boşluk = 9 karakter
                          'Saturday': 'Cumartesi'      // 9 karakter (zaten eşit)
                        };
                        const dayName = date.format('dddd');
                        const turkishDay = turkishDays[dayName as keyof typeof turkishDays] || dayName;
                        const isToday = date.isSame(moment(), 'day');
                        const isWeekend = i === 5 || i === 6; // Cumartesi & Pazar
                        
                        return (
                          <div 
                            key={i} 
                            className={`flex-1 p-3 text-center transition-all duration-300 ${
                              isToday ? 'bg-gradient-to-b from-blue-50 to-blue-100 border-b-2 border-blue-400' :
                              isWeekend ? 'bg-gradient-to-b from-orange-50 to-orange-100' : 
                              'bg-gradient-to-b from-gray-50 to-gray-100'
                            } ${i < 6 ? 'border-r border-gray-200/60' : ''} hover:bg-gradient-to-b hover:from-gray-100 hover:to-gray-150`}
                            style={{ flexBasis: 'calc(100% / 7)', maxWidth: 'calc(100% / 7)', boxSizing: 'border-box' }}
                          >
                            <div className={`text-xs font-semibold ${
                              isToday ? 'text-blue-700' : 
                              isWeekend ? 'text-orange-700' : 
                              'text-gray-600'
                            }`}>
                              {turkishDay}
                            </div>
                            <div className={`text-sm font-bold mt-1 ${
                              isToday ? 'text-blue-800' : 
                              isWeekend ? 'text-orange-800' : 
                              'text-gray-800'
                            }`}>
                              {date.format('DD MMM')}
                            </div>
                            {isToday && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mx-auto mt-1 shadow-sm"></div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                    {resources.map((tech, techIndex) => (
                      <div key={tech.resourceId} className="flex border-b border-gray-200/60 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-300" style={{ minHeight: '80px' }}>
                        {/* Teknisyen İsmi - Header ile Aynı Genişlik */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-200 p-4 flex items-center gap-3 shadow-sm" style={{ minWidth: '160px', maxWidth: '160px', flexShrink: 0, boxSizing: 'border-box' }}>
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-inner border border-blue-200">
                            <User className="w-4 h-4 text-blue-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{tech.title}</p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              Teknisyen
                            </p>
                          </div>
                        </div>
                        
                        {/* Gün Hücreleri Container - Eşit Dağılım */}
                        <div className="flex flex-1">
                        {/* Gün hücreleri - Modern Drag & Drop */}
                        {Array.from({ length: 7 }, (_, i) => {
                          const date = moment(currentDate).startOf('week').add(i, 'days');
                          const isToday = date.isSame(moment(), 'day');
                          const isWeekend = i === 5 || i === 6;
                          
                          // Bu teknisyen ve günde servis var mı kontrol et
                          const dayServices = calendarEvents.filter(event => {
                            const eventDate = moment(event.start);
                            return eventDate.isSame(date, 'day') && event.resourceId === tech.resourceId;
                          });

                          return (
                        <div 
                          key={i} 
                          className={`flex-1 p-3 min-h-20 relative group transition-all duration-300 ${
                            isToday ? 'bg-blue-50/40 border-l border-blue-200' :
                            isWeekend ? 'bg-orange-50/30' : 
                            'bg-white hover:bg-blue-50/20'
                          } ${i < 6 ? 'border-r border-gray-200/60' : ''} 
                          hover:shadow-inner cursor-pointer`}
                          style={{ flexBasis: 'calc(100% / 7)', maxWidth: 'calc(100% / 7)', boxSizing: 'border-box' }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('bg-blue-100', 'border-blue-300', 'border-2', 'border-dashed');
                            e.currentTarget.classList.add('bg-green-100');
                            
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
                              
                              // Animasyonlu başarı mesajı
                              const successMessage = document.createElement('div');
                              successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white p-3 rounded-lg shadow-lg z-50 animate-pulse';
                              successMessage.innerHTML = `✅ ${service.title} başarıyla ${tech.title} teknisyenine atandı!`;
                              document.body.appendChild(successMessage);
                              setTimeout(() => successMessage.remove(), 3000);
                              
                              // Hücreyi normal haline döndür
                              setTimeout(() => {
                                e.currentTarget.classList.remove('bg-green-100');
                              }, 1000);
                              
                              // Burada gerçek atama işlemi yapılacak
                              // TODO: Supabase'e servisi teknisyene atama
                            }
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('bg-blue-100', 'border-blue-300', 'border-2', 'border-dashed');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('bg-blue-100', 'border-blue-300', 'border-2', 'border-dashed');
                          }}
                        >
                              {/* Servis Kartları - Responsive Tasarım */}
                              {dayServices.map((service, serviceIndex) => (
                                <div 
                                  key={serviceIndex}
                                  className="relative mb-1.5 w-full rounded-md px-2 py-1.5 text-white cursor-pointer shadow-sm transform transition-all duration-200 hover:scale-[1.02] hover:shadow-md group/service overflow-hidden"
                                  style={{ 
                                    backgroundColor: service.style?.backgroundColor || '#3b82f6',
                                    fontSize: '9px',
                                    lineHeight: '1.2',
                                    maxWidth: '100%'
                                  }}
                                  onClick={() => handleSelectEvent(service)}
                                >
                                  <div className="font-medium truncate text-xs mb-0.5 flex items-center gap-1">
                                    <span className="w-1 h-1 bg-white/60 rounded-full flex-shrink-0"></span>
                                    <span className="truncate">{service.title}</span>
                                  </div>
                                  {service.location && (
                                    <div className="opacity-90 truncate text-xs flex items-center gap-1 mb-0.5">
                                      <MapPin className="w-2 h-2 flex-shrink-0" />
                                      <span className="truncate">{service.location}</span>
                                    </div>
                                  )}
                                  <div className="opacity-80 text-xs flex items-center gap-1">
                                    <Clock className="w-2 h-2 flex-shrink-0" />
                                    <span className="truncate">
                                    {moment(service.start).format('HH:mm')} - {moment(service.end).format('HH:mm')}
                                    </span>
                                  </div>
                                  
                                  {/* Hover overlay */}
                                  <div className="absolute inset-0 bg-white/10 rounded-md opacity-0 group-hover/service:opacity-100 transition-opacity duration-200"></div>
                                </div>
                              ))}
                              
                              {/* Boş gün için placeholder - Responsive */}
                              {dayServices.length === 0 && (
                                <div className="opacity-0 group-hover:opacity-30 transition-opacity duration-300 text-center py-3 w-full">
                                  <div className="w-6 h-6 border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center">
                                    <Plus className="w-2.5 h-2.5 text-gray-400" />
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1 truncate px-1">Sürükleyin</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modern Atanmamış Servisler Sidebar */}
                <div className="w-80 bg-gradient-to-b from-orange-50 to-red-50 flex flex-col border-l border-orange-200 shadow-inner">
                  {/* Header - Modern Gradient */}
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
                  
                    {/* Count Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-white/20 px-2 py-1 rounded-full font-medium">
                          {calendarEvents.filter(event => !event.resourceId || event.resourceId === 'unassigned').length} adet
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
                    {/* Atanmamış servisleri filtrele */}
                    {calendarEvents
                      .filter(event => !event.resourceId || event.resourceId === 'unassigned')
                      .map((service, index) => (
                        <div 
                          key={index}
                          className="bg-white border border-orange-200 rounded-lg p-2 cursor-move shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-300 group relative"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', JSON.stringify(service));
                            e.currentTarget.style.opacity = '0.6';
                            e.currentTarget.style.transform = 'rotate(1deg) scale(0.98)';
                            e.currentTarget.classList.add('shadow-lg');
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                            e.currentTarget.classList.remove('shadow-lg');
                          }}
                        >
                          {/* Kompakt Header - Başlık ve Öncelik */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: service.style?.backgroundColor || '#3b82f6' }}
                              ></span>
                              <h4 className="font-medium text-gray-900 text-xs truncate">
                                {service.title}
                              </h4>
                            </div>
                            
                            {/* Kompakt Öncelik Badge */}
                            <div className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                              service.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              service.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              service.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${
                                service.priority === 'urgent' ? 'bg-red-500' :
                                service.priority === 'high' ? 'bg-orange-500' :
                                service.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}></span>
                              {service.priority === 'urgent' ? 'Acil' :
                               service.priority === 'high' ? 'Yüksek' :
                               service.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </div>
                          </div>
                          
                          {/* Kompakt Lokasyon */}
                          {service.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                              <MapPin className="h-2.5 w-2.5 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{service.location}</span>
                            </div>
                          )}
                          
                          {/* Kompakt Alt Bilgi - Zaman ve Durum */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="h-2.5 w-2.5 text-blue-500" />
                              <span className="font-medium">
                                {moment(service.start).format('HH:mm')} - {moment(service.end).format('HH:mm')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-orange-600">
                              <User className="h-2.5 w-2.5" />
                              <span className="font-medium">Atanmamış</span>
                            </div>
                          </div>
                          
                          {/* Kompakt Drag Handle */}
                          <div className="absolute top-1 right-1 opacity-20 group-hover:opacity-40 transition-opacity">
                            <div className="grid grid-cols-2 gap-0.5">
                              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
                              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
                              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
                              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    
                    {/* Atanmamış servis yoksa - Modern Empty State */}
                    {calendarEvents.filter(event => !event.resourceId || event.resourceId === 'unassigned').length === 0 && (
                      <div className="text-center py-12 px-4">
                        <div className="relative">
                          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                            <CheckCircle className="h-8 w-8 text-white" />
                          </div>
                          
                          {/* Success animation rings */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 border-2 border-green-300 rounded-full animate-ping opacity-20"></div>
                          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-14 h-14 border-2 border-green-400 rounded-full animate-ping opacity-30 animation-delay-150"></div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Harika İş! 🎉</h3>
                        <p className="text-sm text-gray-600 mb-4">Tüm servisler teknisyenlere atanmış durumda.</p>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                          ✨ Servis takiminiz verimli çalışıyor!
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modern Alt Bilgi Paneli */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 p-4 shadow-inner">
                <div className="flex items-center justify-between">
                  {/* Sol taraf - Yardım bilgisi */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                  </div>
                    <div className="text-xs text-gray-700">
                      <p className="font-medium">💡 İpucu: Servisleri sürükle & bırak ile atayabilirsiniz</p>
                      <p className="text-gray-500 mt-1">Atanmamış servisleri teknisyenlere ve tarih hücrelerine sürükleyin</p>
                        </div>
                        </div>
                  
                  {/* Sağ taraf - Öncelik Legendası */}
                  <div className="flex items-center gap-6">
                    <div className="text-xs text-gray-700">
                      <span className="font-semibold">Öncelik Seviyeleri:</span>
                        </div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div>
                        <span className="text-xs font-medium text-red-700">Acil</span>
                        </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></div>
                        <span className="text-xs font-medium text-orange-700">Yüksek</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm"></div>
                        <span className="text-xs font-medium text-yellow-700">Orta</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></div>
                        <span className="text-xs font-medium text-green-700">Düşük</span>
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
                                        return customer?.name || customer?.company || 'Bilinmeyen Müşteri';
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
                                  {service.service_reported_date ? moment(service.service_reported_date).format('DD.MM.YYYY') : 'Bildirilmedi'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {service.issue_date ? moment(service.issue_date).format('DD.MM.YYYY') : 'Planlanmamış'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {service.service_due_date ? moment(service.service_due_date).format('DD.MM.YYYY') : 'Tarih belirtilmemiş'}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {/* Düzenle Butonu */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectRequest(service);
                                    }}
                                    title="Düzenle"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  {/* Detay Butonu */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectRequest(service);
                                    }}
                                    title="Detayları Görüntüle"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  
                                  {/* Silme Butonu */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteService(service);
                                    }}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
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

        </div>
      </main>
    </div>
  );
};

export default ServicePage;
