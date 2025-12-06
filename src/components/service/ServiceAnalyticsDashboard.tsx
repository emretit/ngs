import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useServiceAnalytics } from '@/hooks/service/useServiceAnalytics';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const ServiceAnalyticsDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { data: analytics, isLoading } = useServiceAnalytics(startDate, endDate);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics || analytics.totalServices === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Analitik verisi bulunamadı</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Başlangıç Tarihi</label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1.5 block">Bitiş Tarihi</label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                setEndDate(new Date());
              }}
            >
              Bu Ay
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              Toplam Servis
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {analytics.totalServices}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {analytics.completedServices} tamamlandı
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Tamamlanma Oranı
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {analytics.completionRate.toFixed(1)}%
            </div>
            <Progress value={analytics.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">
              Ort. Tamamlanma
            </CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {analytics.averageCompletionTime.toFixed(1)}s
            </div>
            <p className="text-xs text-purple-700 mt-1">
              Ortalama süre
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">
              Kar Marjı
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {analytics.profitMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              {formatCurrency(analytics.profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services by Status and Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              <span>Durum Dağılımı</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.servicesByStatus.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {item.status === 'completed' ? 'Tamamlandı' :
                       item.status === 'in_progress' ? 'Devam Ediyor' :
                       item.status === 'new' ? 'Yeni' :
                       item.status === 'cancelled' ? 'İptal Edildi' : item.status}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Öncelik Dağılımı</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.servicesByPriority.map((item) => (
                <div key={item.priority}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      {item.priority === 'urgent' ? 'Acil' :
                       item.priority === 'high' ? 'Yüksek' :
                       item.priority === 'medium' ? 'Orta' :
                       item.priority === 'low' ? 'Düşük' : item.priority}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.count}</span>
                      <span className="text-xs text-muted-foreground">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      {analytics.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Aylık Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.monthlyTrend.map((trend) => (
                <div key={trend.month} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{trend.month}</span>
                    <Badge variant="outline">{trend.total} servis</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Toplam:</span>
                      <span className="ml-2 font-medium">{trend.total}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tamamlanan:</span>
                      <span className="ml-2 font-medium text-green-600">{trend.completed}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gelir:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(trend.revenue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Maliyet:</span>
                      <span className="ml-2 font-medium text-red-600">
                        {formatCurrency(trend.cost)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Technicians and Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {analytics.technicianPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>En Aktif Teknisyenler</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teknisyen</TableHead>
                    <TableHead className="text-center">Tamamlanan</TableHead>
                    <TableHead className="text-center">Ort. Süre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.technicianPerformance.map((tech) => (
                    <TableRow key={tech.technicianId}>
                      <TableCell className="font-medium">{tech.technicianName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{tech.completedCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">{tech.averageTime.toFixed(1)}s</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {analytics.topCustomers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>En Çok Servis Alan Müşteriler</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead className="text-center">Servis</TableHead>
                    <TableHead className="text-right">Toplam Gelir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topCustomers.map((customer) => (
                    <TableRow key={customer.customerId}>
                      <TableCell className="font-medium">{customer.customerName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{customer.serviceCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-medium">
                          {formatCurrency(customer.totalRevenue)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};














