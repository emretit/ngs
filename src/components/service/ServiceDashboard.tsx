import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  MapPin,
  Users,
  Wrench
} from "lucide-react";

interface ServiceDashboardProps {
  stats: {
    total: number;
    new: number;
    inProgress: number;
    completed: number;
    urgent: number;
    unassigned: number;
    avgResponseTime?: number;
    avgCompletionTime?: number;
    onTimeCompletion?: number;
  };
}

const ServiceDashboard = ({ stats }: ServiceDashboardProps) => {
  const completionRate = stats.total > 0 
    ? ((stats.completed / stats.total) * 100).toFixed(1)
    : "0";
  
  const onTimeRate = stats.onTimeCompletion 
    ? `${stats.onTimeCompletion}%`
    : "N/A";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Toplam Servis Talepleri */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-900">
            Toplam Servis
          </CardTitle>
          <Activity className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          <p className="text-xs text-blue-700 mt-1">
            Aktif servis talepleri
          </p>
        </CardContent>
      </Card>

      {/* Acil Servisler */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-900">
            Acil Servisler
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900">{stats.urgent}</div>
          <p className="text-xs text-red-700 mt-1">
            Acil öncelikli servisler
          </p>
        </CardContent>
      </Card>

      {/* Atanmamış Servisler */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-900">
            Atanmamış
          </CardTitle>
          <Users className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900">{stats.unassigned}</div>
          <p className="text-xs text-orange-700 mt-1">
            Teknisyen bekleyen servisler
          </p>
        </CardContent>
      </Card>

      {/* Tamamlanma Oranı */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-900">
            Tamamlanma Oranı
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{completionRate}%</div>
          <p className="text-xs text-green-700 mt-1">
            {stats.completed} servis tamamlandı
          </p>
        </CardContent>
      </Card>

      {/* Devam Eden Servisler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Devam Eden</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inProgress}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Şu anda devam eden servisler
          </p>
        </CardContent>
      </Card>

      {/* Ortalama Yanıt Süresi */}
      {stats.avgResponseTime && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ort. Yanıt Süresi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime} dk</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ortalama yanıt süresi
            </p>
          </CardContent>
        </Card>
      )}

      {/* Zamanında Tamamlama */}
      {stats.onTimeCompletion && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zamanında Tamamlama</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onTimeRate}</div>
            <p className="text-xs text-muted-foreground mt-1">
              SLA'ya uygun tamamlama
            </p>
          </CardContent>
        </Card>
      )}

      {/* Yeni Servisler */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Yeni Servisler</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.new}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Bekleyen servis talepleri
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceDashboard;

