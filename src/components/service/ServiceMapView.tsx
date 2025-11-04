import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, AlertCircle } from "lucide-react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { formatDate } from "@/utils/dateUtils";

interface ServiceMapViewProps {
  serviceRequests: ServiceRequest[];
  technicians?: any[];
  onSelectService: (service: ServiceRequest) => void;
}

const ServiceMapView = ({ 
  serviceRequests, 
  technicians,
  onSelectService 
}: ServiceMapViewProps) => {
  // Servis lokasyonlarını filtrele ve grupla
  const servicesByLocation = useMemo(() => {
    const grouped: { [key: string]: ServiceRequest[] } = {};
    
    serviceRequests.forEach(service => {
      const location = service.service_location || "Lokasyon Belirtilmemiş";
      if (!grouped[location]) {
        grouped[location] = [];
      }
      grouped[location].push(service);
    });
    
    return grouped;
  }, [serviceRequests]);

  // Öncelik renklerini belirle
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  // Durum renklerini belirle
  const getStatusColor = (status: string) => {
    const colors = {
      new: 'border-blue-500 bg-blue-50',
      assigned: 'border-purple-500 bg-purple-50',
      in_progress: 'border-yellow-500 bg-yellow-50',
      on_hold: 'border-orange-500 bg-orange-50',
      completed: 'border-green-500 bg-green-50',
      cancelled: 'border-red-500 bg-red-50',
    };
    return colors[status as keyof typeof colors] || 'border-gray-500 bg-gray-50';
  };

  return (
    <div className="space-y-4">
      {/* Harita Görünümü - Placeholder (Google Maps veya OpenStreetMap entegrasyonu yapılabilir) */}
      <Card className="h-[600px] relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Servis Lokasyonları Haritası
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          {/* Harita placeholder - Gerçek harita entegrasyonu için Google Maps veya Leaflet kullanılabilir */}
          <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="h-12 w-12 text-blue-400 mx-auto" />
              <p className="text-lg font-semibold text-blue-700">Harita Görünümü</p>
              <p className="text-sm text-blue-600">
                {Object.keys(servicesByLocation).length} farklı lokasyonda servis
              </p>
              <p className="text-xs text-blue-500 mt-2">
                Google Maps veya OpenStreetMap entegrasyonu yapılacak
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lokasyon Bazlı Servis Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(servicesByLocation).map(([location, services]) => (
          <Card 
            key={location} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => services.length > 0 && onSelectService(services[0])}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="line-clamp-1">{location}</span>
                </CardTitle>
                <Badge variant="outline" className="ml-2">
                  {services.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.slice(0, 3).map((service) => {
                const technician = technicians?.find(
                  tech => tech.id === service.assigned_technician
                );
                
                return (
                  <div
                    key={service.id}
                    className={`p-2 rounded-lg border-2 ${getStatusColor(service.service_status || 'new')}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {service.service_title}
                      </p>
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(service.service_priority || 'medium')} flex-shrink-0 ml-2`} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {service.assigned_technician && technician ? (
                        <>
                          <User className="h-3 w-3" />
                          <span>{technician.first_name} {technician.last_name}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" />
                          <span>Atanmamış</span>
                        </>
                      )}
                      {service.service_due_date && (
                        <>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{formatDate(service.service_due_date, 'dd MMM')}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {services.length > 3 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{services.length - 3} servis daha
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Boş Durum */}
      {Object.keys(servicesByLocation).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-muted-foreground mb-2">
              Haritada gösterilecek servis yok
            </p>
            <p className="text-sm text-muted-foreground">
              Servis taleplerine lokasyon ekleyerek harita görünümünde görebilirsiniz
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceMapView;

