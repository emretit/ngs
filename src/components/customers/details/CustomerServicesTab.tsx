import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { formatDate } from '@/utils/dateUtils';

interface CustomerServicesTabProps {
  customer: Customer;
}

export const CustomerServicesTab = ({ customer }: CustomerServicesTabProps) => {
  const navigate = useNavigate();
  
  // Filtreleme ve sıralama state'leri
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<"service_title" | "service_priority" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Müşteriye özel servis taleplerini getir
  const { data: serviceRequests, isLoading, error } = useQuery({
    queryKey: ['customer-service-requests', customer.id],
    queryFn: async () => {
      try {
        console.log('Fetching service requests for customer:', customer.id);
        
        const { data, error } = await supabase
          .from('service_requests')
          .select('*')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Service requests error:', error);
          throw error;
        }
        
        console.log('Service requests data:', data);
        return data || [];
      } catch (err) {
        console.error('Service requests fetch error:', err);
        throw err;
      }
    },
  });

  // Teknisyenleri getir
  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('is_technical', true)
        .eq('status', 'aktif');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Servis taleplerini filtrele
  const filteredServices = useMemo(() => {
    if (!serviceRequests) return [];
    
    return serviceRequests.filter(request => {
      const matchesSearch = !searchQuery || 
        request.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.service_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.service_request_description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'new' && (request.service_status === 'new' || request.service_status === 'assigned')) ||
        (statusFilter !== 'new' && request.service_status === statusFilter);
      
      const matchesPriority = priorityFilter === 'all' || request.service_priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [serviceRequests, searchQuery, statusFilter, priorityFilter]);

  // Sıralama
  const sortedServices = useMemo(() => {
    return [...filteredServices].sort((a, b) => {
      let valueA, valueB;
      
      if (sortField === "service_title") {
        valueA = (a.service_title || '').toLowerCase();
        valueB = (b.service_title || '').toLowerCase();
      } else if (sortField === "service_priority") {
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
  }, [filteredServices, sortField, sortDirection]);

  const handleSort = (field: "service_title" | "service_priority" | "created_at") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "created_at" ? "desc" : "asc");
    }
  };

  const handleServiceClick = (service: any) => {
    navigate(`/service/edit/${service.id}`);
  };

  const handleNewService = () => {
    navigate(`/service/new?customer_id=${customer.id}`);
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

  // Durum ikonları
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
      case 'assigned':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Pause className="h-4 w-4 text-gray-500" />;
    }
  };

  // Öncelik renkleri
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'border-red-500 text-red-700 bg-red-50',
      high: 'border-orange-500 text-orange-700 bg-orange-50',
      medium: 'border-yellow-500 text-yellow-700 bg-yellow-50',
      low: 'border-green-500 text-green-700 bg-green-50',
    };
    return colors[priority as keyof typeof colors] || 'border-gray-500 text-gray-700 bg-gray-50';
  };

  // Durum renkleri
  const getStatusColor = (status: string) => {
    const colors = {
      new: 'border-blue-500 text-blue-700 bg-blue-50',
      assigned: 'border-blue-500 text-blue-700 bg-blue-50',
      in_progress: 'border-yellow-500 text-yellow-700 bg-yellow-50',
      completed: 'border-green-500 text-green-700 bg-green-50',
      cancelled: 'border-red-500 text-red-700 bg-red-50',
    };
    return colors[status as keyof typeof colors] || 'border-gray-500 text-gray-700 bg-gray-50';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-red-500">
            <h3 className="font-semibold mb-2">Servis talepleri yüklenirken bir hata oluştu</h3>
            <p className="text-sm text-gray-600 mb-4">
              Hata detayı: {error instanceof Error ? error.message : 'Bilinmeyen hata'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
            >
              Sayfayı Yenile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toplam</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yeni</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Devam Ediyor</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tamamlandı</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acil</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atanmamış</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
              </div>
              <User className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
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
        </CardContent>
      </Card>

      {/* Servis Talepleri Listesi */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Servis Talepleri</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {customer.name || customer.company} için oluşturulan tüm servis talepleri
              </p>
            </div>
            <Button onClick={handleNewService} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Servis Talebi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedServices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm">
                      🔢 Servis No
                    </TableHead>
                    <TableHead 
                      className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("service_title")}
                    >
                      <div className="flex items-center">
                        <span>🔧 Servis Adı</span>
                        {sortField === "service_title" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm">
                      📍 Lokasyon
                    </TableHead>
                    <TableHead 
                      className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("service_priority")}
                    >
                      <div className="flex items-center">
                        <span>⚡ Öncelik</span>
                        {sortField === "service_priority" && (
                          sortDirection === "asc" ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm">
                      📊 Durum
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm">
                      👤 Teknisyen
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm">
                      📅 Bildirilme
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm">
                      📋 Planlanan
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left font-bold text-foreground/80 whitespace-nowrap text-sm">
                      ⚙️ İşlemler
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedServices.map((service) => {
                    const technician = technicians?.find(tech => tech.id === service.assigned_technician);
                    return (
                      <TableRow 
                        key={service.id} 
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleServiceClick(service)}
                      >
                        <TableCell className="px-4 py-4">
                          <div className="text-sm font-mono text-muted-foreground">
                            {service.service_number || 'SR-' + service.id.slice(-6).toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{service.service_title}</p>
                            {service.service_request_description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {service.service_request_description}
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
                            className={getPriorityColor(service.service_priority)}
                          >
                            {service.service_priority === 'urgent' ? 'Acil' :
                             service.service_priority === 'high' ? 'Yüksek' :
                             service.service_priority === 'medium' ? 'Orta' : 'Düşük'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(service.service_status)}
                            <Badge 
                              variant="outline"
                              className={getStatusColor(service.service_status)}
                            >
                              {service.service_status === 'new' ? 'Yeni' :
                               service.service_status === 'assigned' ? 'Atanmış' :
                               service.service_status === 'in_progress' ? 'Devam Ediyor' :
                               service.service_status === 'completed' ? 'Tamamlandı' :
                               service.service_status === 'cancelled' ? 'İptal' : 'Bilinmeyen'}
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
                        <TableCell className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceClick(service);
                              }}
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceClick(service);
                              }}
                              title="Detayları Görüntüle"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Henüz servis talebi yok</h3>
              <p className="text-gray-600 mb-4">Bu müşteri için henüz hiç servis talebi oluşturulmamış.</p>
              <Button onClick={handleNewService} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                İlk Servis Talebini Oluştur
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
