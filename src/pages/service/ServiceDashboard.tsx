import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Wrench, 
  FileText,
  TrendingUp,
  Settings,
  List,
  Map,
  KanbanSquare,
  BarChart3,
  History,
  PlusCircle,
  CalendarClock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ServiceDashboard() {
  const navigate = useNavigate();
  const { data: serviceRequests, isLoading } = useServiceRequests();

  // İstatistikleri hesapla
  const totalServices = serviceRequests?.length || 0;
  const completedServices = serviceRequests?.filter(s => s.service_status === 'completed').length || 0;
  const inProgressServices = serviceRequests?.filter(s => s.service_status === 'in_progress').length || 0;
  const pendingServices = serviceRequests?.filter(s => s.service_status === 'pending').length || 0;
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

  // Hızlı erişim kartları
  const quickAccessCards = [
    {
      title: 'Servis Yönetimi',
      description: 'Servis taleplerini yönet',
      icon: Settings,
      path: '/service/management',
      color: 'text-blue-600'
    },
    {
      title: 'Yeni Servis Talebi',
      description: 'Yeni servis talebi oluştur',
      icon: PlusCircle,
      path: '/service/new',
      color: 'text-green-600'
    },
    {
      title: 'Servis Geçmişi',
      description: 'Tamamlanmış servisleri görüntüle',
      icon: History,
      path: '/service/history',
      color: 'text-gray-600'
    },
    {
      title: 'Analitik',
      description: 'Servis istatistikleri ve raporlar',
      icon: BarChart3,
      path: '/service/analytics',
      color: 'text-cyan-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Servis Dashboard</h1>
        <p className="text-muted-foreground">Servis yönetimi genel bakış ve hızlı erişim</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Servis</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServices}</div>
            <p className="text-xs text-muted-foreground">Tüm servisler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedServices}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% tamamlama oranı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressServices}</div>
            <p className="text-xs text-muted-foreground">İşlemde olan servisler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingServices}</div>
            <p className="text-xs text-muted-foreground">Onay bekleyen servisler</p>
          </CardContent>
        </Card>
      </div>

      {/* Haftalık ve Aylık İstatistikler */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Hafta</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekCompleted}</div>
            <p className="text-xs text-muted-foreground">Son 7 günde tamamlanan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthCompleted}</div>
            <p className="text-xs text-muted-foreground">Son 30 günde tamamlanan</p>
          </CardContent>
        </Card>
      </div>

      {/* Hızlı Erişim */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Hızlı Erişim</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickAccessCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card 
                key={card.path}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(card.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${card.color}`} />
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                  </div>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Son Servisler */}
      {serviceRequests && serviceRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Son Servisler</h2>
            <Button variant="outline" onClick={() => navigate('/service/management')}>
              Tümünü Gör
            </Button>
          </div>
          <div className="space-y-4">
            {serviceRequests.slice(0, 5).map((service) => (
              <Card 
                key={service.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/service/detail/${service.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{service.service_title || 'Servis Talebi'}</CardTitle>
                      <CardDescription>
                        <span className="font-medium">{service.service_number}</span>
                        {service.created_at && ` • ${format(new Date(service.created_at), 'dd MMM yyyy', { locale: tr })}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {service.service_status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {service.service_status === 'in_progress' && (
                        <Clock className="h-5 w-5 text-blue-500" />
                      )}
                      {service.service_status === 'pending' && (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

