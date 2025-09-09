
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { ServiceRequest } from "@/hooks/useServiceRequests";

interface ServiceSummaryStatsProps {
  serviceRequests: ServiceRequest[] | undefined;
}

interface StatsData {
  total: number;
  new: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export const ServiceSummaryStats: React.FC<ServiceSummaryStatsProps> = ({ serviceRequests }) => {
  const getSummaryStats = (): StatsData => {
    if (!serviceRequests) return { total: 0, new: 0, inProgress: 0, completed: 0, highPriority: 0 };
    
    return {
      total: serviceRequests.length,
      new: serviceRequests.filter(req => req.status === 'new').length,
      inProgress: serviceRequests.filter(req => req.status === 'in_progress').length,
      completed: serviceRequests.filter(req => req.status === 'completed').length,
      highPriority: serviceRequests.filter(req => req.priority === 'high').length
    };
  };

  const stats = getSummaryStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Talepler</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Tüm servis talepleri
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Yeni Talepler</CardTitle>
          <AlertTriangle className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.new}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Henüz işleme alınmamış
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Devam Edenler</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Üzerinde çalışılan talepler
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tamamlananlar</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Çözüme kavuşmuş talepler
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
