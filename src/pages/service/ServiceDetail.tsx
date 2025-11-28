import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  User, 
  MapPin, 
  Calendar,
  DollarSign,
  Package,
  FileText,
  MessageSquare,
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { ServiceHistory } from '@/components/service/ServiceHistory';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: service, isLoading } = useQuery({
    queryKey: ['service-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          *,
          employees (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          customers (
            id,
            name,
            company,
            email,
            phone
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: serviceSlip } = useQuery({
    queryKey: ['service-slip', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_slips')
        .select('*')
        .eq('service_request_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Servis bulunamadı</p>
            <Button onClick={() => navigate('/service')} className="mt-4">
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const technician = service.employees;
  const customer = service.customers;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'new':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/service')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{service.service_title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Servis No: {service.service_number || `SR-${service.id.slice(-6).toUpperCase()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(service.service_status)}>
            {service.service_status === 'completed' ? 'Tamamlandı' :
             service.service_status === 'in_progress' ? 'Devam Ediyor' :
             service.service_status === 'new' ? 'Yeni' :
             service.service_status === 'cancelled' ? 'İptal Edildi' : service.service_status}
          </Badge>
          <Badge variant="outline" className={getPriorityColor(service.service_priority)}>
            {service.service_priority === 'urgent' ? 'Acil' :
             service.service_priority === 'high' ? 'Yüksek' :
             service.service_priority === 'medium' ? 'Orta' : 'Düşük'}
          </Badge>
          <Button
            variant="default"
            onClick={() => navigate(`/service/edit/${service.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Durum</p>
                <p className="text-lg font-semibold mt-1">
                  {service.service_status === 'completed' ? 'Tamamlandı' :
                   service.service_status === 'in_progress' ? 'Devam Ediyor' :
                   service.service_status === 'new' ? 'Yeni' : 'İptal'}
                </p>
              </div>
              {service.service_status === 'completed' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : service.service_status === 'in_progress' ? (
                <Clock className="h-8 w-8 text-yellow-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-blue-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teknisyen</p>
                <p className="text-lg font-semibold mt-1">
                  {technician ? `${technician.first_name} ${technician.last_name}` : 'Atanmamış'}
                </p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Müşteri</p>
                <p className="text-lg font-semibold mt-1">
                  {customer?.name || customer?.company || 'Belirtilmemiş'}
                </p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="details">Detaylar</TabsTrigger>
          <TabsTrigger value="costs">Maliyet</TabsTrigger>
          <TabsTrigger value="parts">Parçalar</TabsTrigger>
          <TabsTrigger value="history">Geçmiş</TabsTrigger>
          <TabsTrigger value="notes">Şirket İçi Notlar</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Servis Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Servis Başlığı</p>
                  <p className="font-medium">{service.service_title}</p>
                </div>
                {service.service_request_description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Açıklama</p>
                    <p className="text-sm">{service.service_request_description}</p>
                  </div>
                )}
                {service.service_type && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Servis Tipi</p>
                    <Badge variant="outline">{service.service_type}</Badge>
                  </div>
                )}
                {service.service_location && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Konum
                    </p>
                    <p className="text-sm">{service.service_location}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>Tarih Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.service_reported_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Bildirim Tarihi</p>
                    <p className="font-medium">{formatDate(service.service_reported_date)}</p>
                  </div>
                )}
                {service.issue_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Başlangıç Tarihi</p>
                    <p className="font-medium">{formatDate(service.issue_date)}</p>
                  </div>
                )}
                {service.service_due_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hedef Tarih</p>
                    <p className="font-medium">{formatDate(service.service_due_date)}</p>
                  </div>
                )}
                {service.completion_date && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tamamlanma Tarihi</p>
                    <p className="font-medium text-green-600">{formatDate(service.completion_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>Teknisyen Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {technician ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ad Soyad</p>
                      <p className="font-medium">{technician.first_name} {technician.last_name}</p>
                    </div>
                    {technician.email && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">E-posta</p>
                        <p className="text-sm">{technician.email}</p>
                      </div>
                    )}
                    {technician.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Telefon</p>
                        <p className="text-sm">{technician.phone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Teknisyen atanmamış</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>Müşteri Bilgileri</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Müşteri Adı</p>
                      <p className="font-medium">{customer.name || customer.company}</p>
                    </div>
                    {customer.email && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">E-posta</p>
                        <p className="text-sm">{customer.email}</p>
                      </div>
                    )}
                    {customer.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Telefon</p>
                        <p className="text-sm">{customer.phone}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Müşteri bilgisi bulunamadı</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Servis Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.service_details && (
                <div>
                  <p className="text-sm font-medium mb-2">Servis Detayları</p>
                  <pre className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                    {JSON.stringify(service.service_details, null, 2)}
                  </pre>
                </div>
              )}
              {service.equipment_data && (
                <div>
                  <p className="text-sm font-medium mb-2">Ekipman Bilgileri</p>
                  <pre className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                    {JSON.stringify(service.equipment_data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">İşçilik Maliyeti</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    parseFloat(service.labor_cost) || 0
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Parça Maliyeti</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    parseFloat(service.parts_cost) || 0
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Toplam Maliyet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    parseFloat(service.total_cost) || 0
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Parts Tab */}
        <TabsContent value="parts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>Kullanılan Parçalar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serviceSlip?.service_details?.parts_used && 
               Array.isArray(serviceSlip.service_details.parts_used) &&
               serviceSlip.service_details.parts_used.length > 0 ? (
                <div className="space-y-2">
                  {serviceSlip.service_details.parts_used.map((part: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{part.name || 'Parça'}</p>
                        <p className="text-sm text-muted-foreground">
                          Miktar: {part.quantity} {part.unit || 'adet'}
                        </p>
                      </div>
                      <p className="font-medium">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                          (part.unit_price || 0) * (part.quantity || 1)
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Henüz parça kullanılmamış</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <ServiceHistory serviceRequestId={id} />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>Şirket İçi Notlar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {service.notes && Array.isArray(service.notes) && service.notes.length > 0 ? (
                <div className="space-y-3">
                  {service.notes.map((note: string, index: number) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">{note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Henüz şirket içi not eklenmemiş</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


