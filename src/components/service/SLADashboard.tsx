import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSLAStatistics, useServicesWithSLAIssues } from '@/hooks/service/useServiceSLA';
import { getSLAStatusColor, getSLAStatusLabel, formatSLATimeRemaining } from '@/utils/serviceSlaUtils';
import { getSLATimeRemaining } from '@/utils/serviceSlaUtils';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Activity 
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SLADashboardProps {
  startDate?: Date;
  endDate?: Date;
}

export const SLADashboard: React.FC<SLADashboardProps> = ({ 
  startDate, 
  endDate 
}) => {
  const { data: statistics, isLoading: statsLoading } = useSLAStatistics(startDate, endDate);
  const { data: servicesWithIssues, isLoading: issuesLoading } = useServicesWithSLAIssues();
  const navigate = useNavigate();

  if (statsLoading || issuesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const onTimeRate = statistics?.onTimePercentage || 0;
  const breachedRate = statistics?.breachedPercentage || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* On Time Rate */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              Zamanında Tamamlama
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {onTimeRate.toFixed(1)}%
            </div>
            <p className="text-xs text-green-700 mt-1">
              {statistics?.onTime || 0} / {statistics?.total || 0} servis
            </p>
            <Progress value={onTimeRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Breached Rate */}
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900">
              İhlal Edilen
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {breachedRate.toFixed(1)}%
            </div>
            <p className="text-xs text-red-700 mt-1">
              {statistics?.breached || 0} servis ihlal edildi
            </p>
            <Progress value={breachedRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* At Risk */}
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">
              Risk Altında
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {statistics?.atRisk || 0}
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Servis risk altında
            </p>
          </CardContent>
        </Card>

        {/* Total Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Servis
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              SLA takibi yapılan servisler
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Services with Issues */}
      {servicesWithIssues && servicesWithIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span>SLA Sorunlu Servisler</span>
                <Badge variant="outline" className="ml-2">
                  {servicesWithIssues.length}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/service?view=list&sla_filter=issues')}
              >
                Tümünü Gör
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {servicesWithIssues.slice(0, 10).map((service) => {
                const timeRemaining = service.sla_due_time
                  ? getSLATimeRemaining(new Date(service.sla_due_time))
                  : null;

                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/service/edit/${service.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {service.service_title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getSLAStatusColor(service.sla_status as any)}`}
                        >
                          {getSLAStatusLabel(service.sla_status as any)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {service.sla_due_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(service.sla_due_time), 'dd MMM yyyy HH:mm', { locale: tr })}
                            </span>
                          </div>
                        )}
                        {timeRemaining && (
                          <div className="flex items-center gap-1">
                            <span className={timeRemaining.isOverdue ? 'text-red-600 font-medium' : ''}>
                              {formatSLATimeRemaining(timeRemaining)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Badge
                        variant="outline"
                        className={
                          service.service_priority === 'urgent'
                            ? 'border-red-500 text-red-700'
                            : service.service_priority === 'high'
                            ? 'border-orange-500 text-orange-700'
                            : service.service_priority === 'medium'
                            ? 'border-yellow-500 text-yellow-700'
                            : 'border-green-500 text-green-700'
                        }
                      >
                        {service.service_priority === 'urgent'
                          ? 'Acil'
                          : service.service_priority === 'high'
                          ? 'Yüksek'
                          : service.service_priority === 'medium'
                          ? 'Orta'
                          : 'Düşük'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLA Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span>SLA Performans Trendi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Grafik görünümü yakında eklenecek</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};







