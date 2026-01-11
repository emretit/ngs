import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Wrench, 
  TrendingUp,
  Settings,
  BarChart3,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Target,
  Zap,
  Users,
  MapPin,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useState } from 'react';
import StatusBadge from '@/components/common/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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

export default function ServiceDashboard() {
  const navigate = useNavigate();
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

  const { data: serviceRequests, isLoading } = useServiceRequests();

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
        
        .eq('is_technical', true)
        .eq('status', 'aktif');
      if (error) throw error;
      return data;
    },
    enabled: !!userData?.company_id,
  });

  // İstatistikleri hesapla - memoized
  const stats = useMemo(() => {
    const totalServices = serviceRequests?.length || 0;
    const completedServices = serviceRequests?.filter(s => s.service_status === 'completed').length || 0;
    const inProgressServices = serviceRequests?.filter(s => s.service_status === 'in_progress').length || 0;
    const newServices = serviceRequests?.filter(s => s.service_status === 'new' || s.service_status === 'assigned').length || 0;
    const cancelledServices = serviceRequests?.filter(s => s.service_status === 'cancelled').length || 0;
    const onHoldServices = serviceRequests?.filter(s => s.service_status === 'on_hold').length || 0;
    
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

    // Öncelik dağılımı
    const urgentCount = serviceRequests?.filter(s => s.service_priority === 'urgent').length || 0;
    const highCount = serviceRequests?.filter(s => s.service_priority === 'high').length || 0;
    const mediumCount = serviceRequests?.filter(s => s.service_priority === 'medium').length || 0;
    const lowCount = serviceRequests?.filter(s => s.service_priority === 'low').length || 0;

    // Atanmış servisler
    const assignedServices = serviceRequests?.filter(s => s.assigned_technician).length || 0;
    const unassignedServices = totalServices - assignedServices;

    // Teknisyen başına ortalama servis
    const avgServicesPerTechnician = technicians && technicians.length > 0 
      ? (assignedServices / technicians.length).toFixed(1)
      : '0';

    return {
      total: totalServices,
      completed: completedServices,
      inProgress: inProgressServices,
      new: newServices,
      cancelled: cancelledServices,
      onHold: onHoldServices,
      thisWeekCompleted,
      thisMonthCompleted,
      completionRate,
      averageCompletionTime,
      totalRevenue,
      totalCost,
      profit,
      profitMargin,
      urgentCount,
      highCount,
      mediumCount,
      lowCount,
      assignedServices,
      unassignedServices,
      avgServicesPerTechnician,
      techniciansCount: technicians?.length || 0,
    };
  }, [serviceRequests, technicians]);

  // Recent services
  const recentServices = useMemo(() => {
    return serviceRequests?.slice(0, 5) || [];
  }, [serviceRequests]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

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
