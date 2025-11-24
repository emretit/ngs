import React, { useState } from 'react';
import { Search, Calendar, User, Clock, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function ServiceHistory() {
  const navigate = useNavigate();
  const { data: serviceRequests, isLoading } = useServiceRequests();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  // Tamamlanmış servisleri filtrele
  const completedServices = serviceRequests?.filter(
    service => service.service_status === 'completed' || service.service_status === 'closed'
  );

  // Arama ve zaman filtreleme
  const filteredServices = completedServices?.filter(service => {
    const matchesSearch = 
      service.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.service_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.customer_data?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (timeFilter === 'all') return true;
    
    const completionDate = service.completion_date ? new Date(service.completion_date) : null;
    if (!completionDate) return false;

    const now = new Date();
    const diffTime = now.getTime() - completionDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (timeFilter) {
      case 'week':
        return diffDays <= 7;
      case 'month':
        return diffDays <= 30;
      case 'quarter':
        return diffDays <= 90;
      case 'year':
        return diffDays <= 365;
      default:
        return true;
    }
  });

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
        <h1 className="text-3xl font-bold tracking-tight">Servis Geçmişi</h1>
        <p className="text-muted-foreground">Tamamlanmış servislerin detaylı geçmişi</p>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Servis</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedServices?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Tamamlanmış</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Hafta</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedServices?.filter(s => {
                if (!s.completion_date) return false;
                const diffDays = Math.ceil((new Date().getTime() - new Date(s.completion_date).getTime()) / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Son 7 gün</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu Ay</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedServices?.filter(s => {
                if (!s.completion_date) return false;
                const diffDays = Math.ceil((new Date().getTime() - new Date(s.completion_date).getTime()) / (1000 * 60 * 60 * 24));
                return diffDays <= 30;
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Son 30 gün</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Süre</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Tamamlama süresi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Servis ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Zaman aralığı" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Zamanlar</SelectItem>
                <SelectItem value="week">Son 7 Gün</SelectItem>
                <SelectItem value="month">Son 30 Gün</SelectItem>
                <SelectItem value="quarter">Son 3 Ay</SelectItem>
                <SelectItem value="year">Son 1 Yıl</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Servis Geçmişi Listesi */}
      <div className="space-y-4">
        {filteredServices && filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <Card 
              key={service.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/service/detail/${service.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{service.service_title}</CardTitle>
                    <CardDescription>
                      <span className="font-medium">{service.service_number}</span>
                      {service.customer_data?.name && ` • ${service.customer_data.name}`}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Tamamlandı
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {service.assigned_technician && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{service.assigned_technician}</span>
                    </div>
                  )}
                  {service.completion_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(service.completion_date), 'dd MMM yyyy', { locale: tr })}</span>
                    </div>
                  )}
                  {service.total_cost && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{service.total_cost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                    </div>
                  )}
                  {service.customer_rating && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500">★</span>
                      <span>{service.customer_rating}/5</span>
                    </div>
                  )}
                </div>
                {service.service_request_description && (
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {service.service_request_description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Servis geçmişi bulunamadı</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Arama kriterlerinize uygun sonuç bulunamadı.' : 'Henüz tamamlanmış servis bulunmuyor.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

