import React, { useEffect } from 'react';
import { useServicesWithSLAIssues } from '@/hooks/service/useServiceSLA';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatSLATimeRemaining, getSLAStatusColor, getSLAStatusLabel } from '@/utils/serviceSlaUtils';
import { getSLATimeRemaining } from '@/utils/serviceSlaUtils';
import { useNavigate } from 'react-router-dom';

/**
 * Component to display SLA alerts for services with issues
 */
export const SLAAlerter: React.FC = () => {
  const { data: servicesWithIssues, isLoading } = useServicesWithSLAIssues();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  if (!servicesWithIssues || servicesWithIssues.length === 0) {
    return null;
  }

  const breachedServices = servicesWithIssues.filter(s => s.sla_status === 'breached');
  const atRiskServices = servicesWithIssues.filter(s => s.sla_status === 'at_risk');

  return (
    <div className="space-y-2 mb-4">
      {/* Breached Services */}
      {breachedServices.length > 0 && (
        <Alert variant="destructive" className="border-red-500">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>SLA İhlal Edildi ({breachedServices.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/service?view=list&sla_status=breached')}
            >
              Görüntüle
            </Button>
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-1 mt-2">
              {breachedServices.slice(0, 3).map((service) => {
                const timeRemaining = service.sla_due_time
                  ? getSLATimeRemaining(new Date(service.sla_due_time))
                  : null;
                
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-2 bg-red-50 rounded text-sm cursor-pointer hover:bg-red-100"
                    onClick={() => navigate(`/service/edit/${service.id}`)}
                  >
                    <span className="font-medium">{service.service_title}</span>
                    <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
                      {timeRemaining ? formatSLATimeRemaining(timeRemaining) : 'İhlal edildi'}
                    </Badge>
                  </div>
                );
              })}
              {breachedServices.length > 3 && (
                <div className="text-xs text-muted-foreground mt-1">
                  +{breachedServices.length - 3} servis daha
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* At Risk Services */}
      {atRiskServices.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="flex items-center justify-between">
            <span>SLA Risk Altında ({atRiskServices.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/service?view=list&sla_status=at_risk')}
            >
              Görüntüle
            </Button>
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-1 mt-2">
              {atRiskServices.slice(0, 3).map((service) => {
                const timeRemaining = service.sla_due_time
                  ? getSLATimeRemaining(new Date(service.sla_due_time))
                  : null;
                
                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-2 bg-yellow-50 rounded text-sm cursor-pointer hover:bg-yellow-100"
                    onClick={() => navigate(`/service/edit/${service.id}`)}
                  >
                    <span className="font-medium">{service.service_title}</span>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
                      {timeRemaining ? formatSLATimeRemaining(timeRemaining) : 'Risk altında'}
                    </Badge>
                  </div>
                );
              })}
              {atRiskServices.length > 3 && (
                <div className="text-xs text-muted-foreground mt-1">
                  +{atRiskServices.length - 3} servis daha
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};


