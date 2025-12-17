import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import ServicePageHeader from "@/components/service/ServicePageHeader";
import ServiceKanbanBoard from "@/components/service/ServiceKanbanBoard";
import ServiceMapView from "@/components/service/ServiceMapView";
import ResourceSchedulingView from "@/components/service/ResourceSchedulingView";
import ServiceGanttView from "@/components/service/ServiceGanttView";
import ServiceCalendarView from "@/components/service/ServiceCalendarView";
import { MaintenanceCalendarView } from "@/components/service/MaintenanceCalendarView";
import { ServiceTemplateLibrary } from "@/components/service/ServiceTemplateLibrary";
import { TechnicianPerformanceDashboard } from "@/components/service/TechnicianPerformanceDashboard";
import { ServicePartsInventoryAlert } from "@/components/service/ServicePartsInventoryAlert";
import { ServicePartsUsageReport } from "@/components/service/ServicePartsUsageReport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Clock, 
  AlertCircle, 
  User, 
  MapPin, 
  Search, 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  Calendar, 
  Trash2, 
  Edit, 
  Eye, 
  Settings, 
  FileText,
  Wrench,
  Plus,
  TrendingUp,
  CheckCircle,
  BarChart3,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";
import ServiceViewToggle from "@/components/service/ServiceViewToggle";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from '@/utils/dateUtils';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import StatusBadge from '@/components/common/StatusBadge';

interface ServicePageProps {
  defaultView?: "list" | "kanban" | "map" | "scheduling" | "calendar" | "maintenance" | "templates" | "performance" | "parts" | "dashboard";
  hideHeader?: boolean;
}

const MONTHS = [
  { value: "all", label: "Tüm Aylar" },
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" }
];

const ServicePage = ({ defaultView = "dashboard", hideHeader = false }: ServicePageProps = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userData } = useCurrentUser();
  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum.toString());
  
  // Generate years (5 years back, current year, 2 years forward)
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);
  
  const selectedMonthName = selectedMonth === "all"
    ? "Tüm Aylar"
    : MONTHS.find(m => m.value === selectedMonth)?.label || "";

  const dateLabel = `${selectedYear} - ${selectedMonthName}`;

  // Silme onayı için state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRequest | null>(null);
  const [activeView, setActiveView] = useState<"list" | "kanban" | "map" | "scheduling" | "calendar" | "maintenance" | "templates" | "performance" | "parts" | "dashboard">(defaultView);
  
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
      } else if (viewParam === 'maintenance') {
        setActiveView('maintenance');
      } else if (viewParam === 'templates') {
        setActiveView('templates');
      } else if (viewParam === 'performance') {
        setActiveView('performance');
      } else if (viewParam === 'parts') {
        setActiveView('parts');
      } else if (viewParam === 'dashboard') {
        setActiveView('dashboard');
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

  // İstatistikleri hesapla - memoized
  const stats = useMemo(() => {
    const totalServices = serviceRequests?.length || 0;
    const completedServices = serviceRequests?.filter(s => s.service_status === 'completed').length || 0;
    const inProgressServices = serviceRequests?.filter(s => s.service_status === 'in_progress').length || 0;
    const newServices = serviceRequests?.filter(s => s.service_status === 'new' || s.service_status === 'assigned').length || 0;
    const cancelledServices = serviceRequests?.filter(s => s.service_status === 'cancelled').length || 0;
    
    // Bu hafta tamamlanan servisler
    const thisWeekCompleted = serviceRequests?.filter(s => {
      if (s.service_status !== 'completed' || !s.completion_date) return false;
      const completionDate = new Date(s.completion_date);
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length || 0;

    // Bu ay tamamlanan servisler
    const thisMonthCompleted = serviceRequests?.filter(s => {
      if (s.service_status !== 'completed' || !s.completion_date) return false;
      const completionDate = new Date(s.completion_date);
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length || 0;

    // Tamamlama oranı
    const completionRate = totalServices > 0 ? ((completedServices / totalServices) * 100).toFixed(1) : '0';

    // Ortalama tamamlama süresi (saat)
    const completedWithDates = serviceRequests?.filter(
      (s) => s.service_status === 'completed' && s.issue_date && s.completion_date
    ) || [];
    const totalCompletionHours = completedWithDates.reduce((sum, s) => {
      const start = new Date(s.issue_date!);
      const end = new Date(s.completion_date!);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);
    const averageCompletionTime = completedWithDates.length > 0
      ? (totalCompletionHours / completedWithDates.length).toFixed(1)
      : '0';

    // Toplam gelir ve maliyet
    const totalRevenue = serviceRequests?.reduce((sum, s) => sum + (parseFloat(String(s.total_cost || '0'))), 0) || 0;
    const totalCost = serviceRequests?.reduce((sum, s) => sum + (parseFloat(String(s.service_cost || '0'))), 0) || 0;
    const profit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0';

    return {
      total: totalServices,
      completed: completedServices,
      inProgress: inProgressServices,
      new: newServices,
      cancelled: cancelledServices,
      thisWeekCompleted,
      thisMonthCompleted,
      completionRate,
      averageCompletionTime,
      totalRevenue,
      totalCost,
      profit,
      profitMargin,
    };
  }, [serviceRequests]);

  // Recent services
  const recentServices = useMemo(() => {
    return serviceRequests?.slice(0, 5) || [];
  }, [serviceRequests]);

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
      toast.success("Servis durumu güncellendi.");
    },
    onError: (error) => {
      console.error('Durum güncelleme hatası:', error);
      toast.error("Servis durumu güncellenirken bir hata oluştu.");
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
        .eq('is_technical', true)
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
  
  const handleDeleteConfirm = () => {
    if (serviceToDelete) {
      deleteServiceRequest(serviceToDelete.id);
      setDeleteConfirmOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setServiceToDelete(null);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Dashboard View
  if (activeView === "dashboard") {
    return (
      <>
        {/* Clean Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg text-white shadow-lg">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Servis Yönetimi Dashboard
                </h1>
                <p className="text-xs text-muted-foreground/70">
                  Tüm servis işlemlerinizi takip edin ve yönetin
                </p>
              </div>
            </div>

            {/* Year and Month Selectors */}
            <div className="flex items-center gap-2">
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-[120px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ay Seçin" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Ana İstatistik Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Toplam Servis */}
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Toplam Servis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{stats.completed} tamamlanan</span>
                </div>
              </CardContent>
            </Card>

            {/* Tamamlanan */}
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Tamamlanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>%{stats.completionRate} oran</span>
                </div>
              </CardContent>
            </Card>

            {/* Devam Eden */}
            <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  Devam Eden
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 text-yellow-500" />
                  <span>İşlemde olan</span>
                </div>
              </CardContent>
            </Card>

            {/* Bekleyen */}
            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Bekleyen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.new}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span>Onay bekleyen</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* İkinci Satır İstatistikler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ortalama Tamamlama Süresi */}
            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Ort. Tamamlama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.averageCompletionTime}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 text-purple-500" />
                  <span>saat</span>
                </div>
              </CardContent>
            </Card>

            {/* Toplam Gelir */}
            <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Toplam Gelir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(stats.totalRevenue)}
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span>Kar marjı: %{stats.profitMargin}</span>
                </div>
              </CardContent>
            </Card>

            {/* Bu Hafta */}
            <Card className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-500" />
                  Bu Hafta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-600">{stats.thisWeekCompleted}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 text-cyan-500" />
                  <span>Tamamlanan servis</span>
                </div>
              </CardContent>
            </Card>

            {/* Bu Ay */}
            <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  Bu Ay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">{stats.thisMonthCompleted}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-indigo-500" />
                  <span>Tamamlanan servis</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ana Aksiyon Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Servis Yönetimi Card */}
            <div
              className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-200 cursor-pointer"
              onClick={() => navigate("/service/management")}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Servis Yönetimi</h2>
                      <p className="text-xs text-gray-500">Tüm servis talepleri</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/service/management");
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Yeni
                    </Button>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">{dateLabel}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam Servis</span>
                    <span className="text-sm font-bold text-gray-900">{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Devam Eden</span>
                    <span className="text-sm font-bold text-orange-600">{stats.inProgress}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Tamamlanan</span>
                      <span className="text-sm font-bold text-green-600">{stats.completed}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Yeni Servis Talebi Card */}
            <div
              className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-green-200 cursor-pointer"
              onClick={() => navigate("/service/new")}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Yeni Servis</h2>
                      <p className="text-xs text-gray-500">Servis talebi oluştur</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/service/new");
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Yeni
                    </Button>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">{dateLabel}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Bekleyen</span>
                    <span className="text-sm font-bold text-gray-900">{stats.new}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Bu Hafta</span>
                    <span className="text-sm font-bold text-orange-600">{stats.thisWeekCompleted}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Bu Ay</span>
                      <span className="text-sm font-bold text-green-600">{stats.thisMonthCompleted}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analitik Card */}
            <div
              className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-orange-200 cursor-pointer"
              onClick={() => navigate("/service/performance")}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Analitik</h2>
                      <p className="text-xs text-gray-500">İstatistikler ve raporlar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/service/performance");
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Görüntüle
                    </Button>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="text-xs font-normal text-orange-600 bg-orange-50 px-2 py-1 rounded">{dateLabel}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam Servis</span>
                    <span className="text-sm font-bold text-gray-900">{stats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Tamamlama Oranı</span>
                    <span className="text-sm font-bold text-orange-600">%{stats.completionRate}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Bu Hafta</span>
                      <span className="text-sm font-bold text-green-600">{stats.thisWeekCompleted}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Harita Card */}
            <div
              className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-purple-200 cursor-pointer"
              onClick={() => navigate("/service/map")}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Harita Görünümü</h2>
                      <p className="text-xs text-gray-500">Servis lokasyonları</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/service/map");
                      }}
                    >
                      <MapPin className="h-3 w-3" />
                      Aç
                    </Button>
                  </div>
                </div>
                <div className="mb-3">
                  <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded">{dateLabel}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Aktif Servisler</span>
                    <span className="text-sm font-bold text-gray-900">{stats.inProgress + stats.new}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam</span>
                    <span className="text-sm font-bold text-purple-600">{stats.total}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Services */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wrench className="h-5 w-5 text-blue-500" />
                    Son Servisler
                  </CardTitle>
                  {recentServices.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate("/service/management")}
                    >
                      Tümünü Gör
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {recentServices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Henüz servis bulunmuyor</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/service/detail/${service.id}`)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{service.service_title || 'Servis Talebi'}</div>
                          <div className="text-xs text-muted-foreground">
                            {service.service_number} •{" "}
                            {service.created_at &&
                              format(new Date(service.created_at), "dd MMM yyyy", { locale: tr })}
                          </div>
                        </div>
                        <StatusBadge status={service.service_status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly & Monthly Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-green-500" />
                  Haftalık & Aylık Özet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Bu Hafta</div>
                        <div className="text-xs text-muted-foreground">Son 7 günde tamamlanan</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">{stats.thisWeekCompleted}</div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Bu Ay</div>
                        <div className="text-xs text-muted-foreground">Son 30 günde tamamlanan</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{stats.thisMonthCompleted}</div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Target className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Tamamlama Oranı</div>
                        <div className="text-xs text-muted-foreground">Genel başarı oranı</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">%{stats.completionRate}</div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Ortalama Süre</div>
                        <div className="text-xs text-muted-foreground">Tamamlama süresi</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{stats.averageCompletionTime}s</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

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
                  const notificationTitle = 'Yeni Servis Ataması';
                  const notificationBody = `${service.service_title} servisi size atandı. Tarih: ${formatDate(startTime, 'dd MMM yyyy HH:mm')}`;
                  
                  // Database'e bildirim kaydı ekle
                  const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert({
                      user_id: technician.user_id,
                      title: notificationTitle,
                      body: notificationBody,
                      type: 'service_assignment',
                      service_request_id: serviceId,
                      technician_id: technicianId,
                      company_id: service.company_id,
                      is_read: false,
                    });

                  if (notificationError) {
                    console.error('Bildirim kaydı hatası:', notificationError);
                    // Bildirim hatası kritik değil, devam et
                  }

                  // Push notification gönder (mobil uygulamaya)
                  try {
                    console.log('📱 Push notification gönderiliyor...', {
                      user_id: technician.user_id,
                      title: notificationTitle,
                      body: notificationBody
                    });

                    const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push-notification', {
                      body: {
                        user_id: technician.user_id,
                        title: notificationTitle,
                        body: notificationBody,
                        data: {
                          type: 'service_assignment',
                          service_request_id: serviceId,
                          action: 'open_service_request',
                        }
                      }
                    });

                    if (pushError) {
                      console.error('❌ Push notification gönderme hatası:', pushError);
                      // Hata detaylarını göster
                      toast.error(`Push notification hatası: ${pushError.message || 'Bilinmeyen hata'}`);
                    } else {
                      console.log('✅ Push notification başarıyla gönderildi:', pushData);
                      if (pushData?.fcm_message_id) {
                        console.log('📨 FCM Message ID:', pushData.fcm_message_id);
                      }
                    }
                  } catch (pushErr: any) {
                    console.error('❌ Push notification çağrı hatası:', pushErr);
                    console.error('Hata detayları:', {
                      message: pushErr?.message,
                      stack: pushErr?.stack,
                      name: pushErr?.name
                    });
                    toast.error(`Push notification gönderilemedi: ${pushErr?.message || 'Bilinmeyen hata'}`);
                    // Push notification hatası kritik değil, devam et
                  }
                }

                queryClient.invalidateQueries({ queryKey: ['service-requests'] });
                toast.success("Servis teknisyene atandı ve bildirim gönderildi.");
              } catch (error: any) {
                console.error('Servis atama hatası:', error);
                toast.error(error.message || "Servis ataması güncellenirken bir hata oluştu.");
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
        ) : activeView === "maintenance" ? (
          /* Maintenance Calendar View */
          <MaintenanceCalendarView />
        ) : activeView === "templates" ? (
          /* Service Templates Library */
          <ServiceTemplateLibrary />
        ) : activeView === "performance" ? (
          /* Technician Performance Dashboard */
          <TechnicianPerformanceDashboard />
        ) : activeView === "parts" ? (
          /* Parts Usage Report */
          <ServicePartsUsageReport />
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
      <ConfirmationDialogComponent
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Servis Talebini Sil"
        description={
          serviceToDelete
            ? `"${serviceToDelete.service_title}" (Servis No: ${serviceToDelete.service_number || 'SR-' + serviceToDelete.id.slice(-6).toUpperCase()}) servis talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz. Servis talebi ve ilgili tüm veriler kalıcı olarak silinecektir.`
            : "Bu servis talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz. Servis talebi kalıcı olarak silinecektir."
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={false}
      />
    </>
  );
};
export default ServicePage;
export { ServicePage };
