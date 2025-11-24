import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, User, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ServiceWorkOrders() {
  const navigate = useNavigate();
  const { data: serviceRequests, isLoading } = useServiceRequests();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // İş emri durumlarına göre filtreleme
  const filteredWorkOrders = serviceRequests?.filter(service => {
    const matchesSearch = service.service_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.service_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || service.service_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // İstatistikler
  const stats = {
    total: serviceRequests?.length || 0,
    open: serviceRequests?.filter(s => s.service_status === 'new').length || 0,
    inProgress: serviceRequests?.filter(s => s.service_status === 'in_progress' || s.service_status === 'assigned').length || 0,
    completed: serviceRequests?.filter(s => s.service_status === 'completed').length || 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
      case 'assigned':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress':
      case 'assigned':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
      case 'closed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Açık',
      pending: 'Beklemede',
      assigned: 'Atandı',
      in_progress: 'Devam Ediyor',
      completed: 'Tamamlandı',
      closed: 'Kapatıldı',
      cancelled: 'İptal Edildi',
    };
    return labels[status] || status;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">İş Emirleri</h1>
          <p className="text-muted-foreground">Servis iş emirlerini yönetin ve takip edin</p>
        </div>
        <Button onClick={() => navigate('/service/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni İş Emri
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İş Emri</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Açık</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
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
                  placeholder="İş emri ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="open">Açık</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="assigned">Atandı</SelectItem>
                <SelectItem value="in_progress">Devam Ediyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="closed">Kapatıldı</SelectItem>
                <SelectItem value="cancelled">İptal Edildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* İş Emirleri Tablosu */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İş Emri No</TableHead>
                <TableHead>Başlık</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Teknisyen</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkOrders && filteredWorkOrders.length > 0 ? (
                filteredWorkOrders.map((workOrder) => (
                  <TableRow 
                    key={workOrder.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/service/detail/${workOrder.id}`)}
                  >
                    <TableCell className="font-medium">{workOrder.service_number}</TableCell>
                    <TableCell>{workOrder.service_title}</TableCell>
                    <TableCell>{(workOrder.customer_data as any)?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {workOrder.assigned_technician ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{workOrder.assigned_technician}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Atanmadı</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(workOrder.service_status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(workOrder.service_status)}
                          {getStatusLabel(workOrder.service_status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={workOrder.service_priority === 'high' ? 'destructive' : 
                                workOrder.service_priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {workOrder.service_priority === 'high' ? 'Yüksek' :
                         workOrder.service_priority === 'medium' ? 'Orta' : 'Düşük'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {workOrder.issue_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(workOrder.issue_date), 'dd MMM yyyy', { locale: tr })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/service/edit/${workOrder.id}`);
                        }}
                      >
                        Düzenle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    İş emri bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

