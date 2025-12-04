import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTechnicianPerformance } from '@/hooks/service/useTechnicianPerformance';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Award,
  Target,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const TechnicianPerformanceDashboard: React.FC = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [sortBy, setSortBy] = useState<'completed' | 'sla' | 'time' | 'name'>('completed');

  const { data: performance, isLoading } = useTechnicianPerformance(startDate, endDate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!performance || performance.technicians.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Teknisyen performans verisi bulunamadı</p>
        </CardContent>
      </Card>
    );
  }

  const sortedTechnicians = [...performance.technicians].sort((a, b) => {
    switch (sortBy) {
      case 'completed':
        return b.completedServices - a.completedServices;
      case 'sla':
        return b.slaComplianceRate - a.slaComplianceRate;
      case 'time':
        return a.averageCompletionTime - b.averageCompletionTime;
      case 'name':
        return a.technicianName.localeCompare(b.technicianName);
      default:
        return 0;
    }
  });

  const topPerformers = sortedTechnicians.slice(0, 3);

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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              Toplam Teknisyen
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {performance.totalTechnicians}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Aktif teknisyen sayısı
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Ort. Tamamlanma
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {performance.averageCompletionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-green-700 mt-1">
              Ortalama tamamlanma oranı
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">
              SLA Uyumu
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {performance.averageSLACompliance.toFixed(1)}%
            </div>
            <p className="text-xs text-purple-700 mt-1">
              Ortalama SLA uyum oranı
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">
              Memnuniyet
            </CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {performance.averageSatisfaction.toFixed(1)}/5
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Ortalama müşteri memnuniyeti
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span>En İyi Performans Gösterenler</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPerformers.map((tech, index) => (
                <div
                  key={tech.technicianId}
                  className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-semibold">{tech.technicianName}</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tamamlanan:</span>
                      <span className="font-medium">{tech.completedServices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SLA Uyumu:</span>
                      <span className="font-medium">{tech.slaComplianceRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ort. Süre:</span>
                      <span className="font-medium">{tech.averageCompletionTime.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Teknisyen Performans Detayları</span>
            </CardTitle>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Tamamlanan Servis</SelectItem>
                <SelectItem value="sla">SLA Uyumu</SelectItem>
                <SelectItem value="time">Ortalama Süre</SelectItem>
                <SelectItem value="name">İsim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teknisyen</TableHead>
                  <TableHead className="text-center">Toplam</TableHead>
                  <TableHead className="text-center">Tamamlanan</TableHead>
                  <TableHead className="text-center">Devam Eden</TableHead>
                  <TableHead className="text-center">Ort. Süre</TableHead>
                  <TableHead className="text-center">SLA Uyumu</TableHead>
                  <TableHead className="text-center">Zamanında</TableHead>
                  <TableHead className="text-center">Büyüme</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTechnicians.map((tech) => {
                  const completionRate = tech.totalServices > 0
                    ? (tech.completedServices / tech.totalServices) * 100
                    : 0;

                  return (
                    <TableRow key={tech.technicianId}>
                      <TableCell className="font-medium">
                        {tech.technicianName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{tech.totalServices}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {tech.completedServices}
                          </Badge>
                          <Progress value={completionRate} className="w-16 h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {tech.inProgressServices}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{tech.averageCompletionTime.toFixed(1)}s</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant="outline"
                            className={
                              tech.slaComplianceRate >= 90
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : tech.slaComplianceRate >= 70
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }
                          >
                            {tech.slaComplianceRate.toFixed(1)}%
                          </Badge>
                          <Progress value={tech.slaComplianceRate} className="w-16 h-1" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {tech.onTimeCompletionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {tech.growthRate >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={tech.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {tech.growthRate >= 0 ? '+' : ''}{tech.growthRate.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};











