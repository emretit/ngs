import React, { useMemo, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/styles';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, AlertCircle, Loader2 } from "lucide-react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import { formatDate } from "@/utils/dateUtils";
import { useLocationIQGeocoding } from "@/hooks/useLocationIQGeocoding";

// Fix for default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface ServiceMapViewProps {
  serviceRequests: ServiceRequest[];
  technicians?: any[];
  onSelectService: (service: ServiceRequest) => void;
  selectedServiceId?: string;
}

interface ServiceWithCoordinates extends ServiceRequest {
  latitude?: number;
  longitude?: number;
}

const ServiceMapView = ({ 
  serviceRequests, 
  technicians,
  onSelectService,
  selectedServiceId
}: ServiceMapViewProps) => {
  const { geocode, isGeocoding } = useLocationIQGeocoding();
  const [servicesWithCoords, setServicesWithCoords] = useState<ServiceWithCoordinates[]>([]);
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);

  // Geocode all service locations
  useEffect(() => {
    const geocodeServices = async () => {
      setIsLoadingCoords(true);
      
      const servicesWithLocations: ServiceWithCoordinates[] = [];
      
      for (const service of serviceRequests) {
        if (service.service_location) {
          try {
            const result = await geocode(service.service_location);
            if (result) {
              servicesWithLocations.push({
                ...service,
                latitude: result.latitude,
                longitude: result.longitude,
              });
            } else {
              servicesWithLocations.push(service);
            }
          } catch (error) {
            console.error('Geocoding error for service:', service.id, error);
            servicesWithLocations.push(service);
          }
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          servicesWithLocations.push(service);
        }
      }
      
      setServicesWithCoords(servicesWithLocations);
      setIsLoadingCoords(false);
    };

    if (serviceRequests.length > 0) {
      geocodeServices();
    }
  }, [serviceRequests, geocode]);

  // Services with valid coordinates
  const mappableServices = useMemo(() => {
    return servicesWithCoords.filter(s => s.latitude && s.longitude);
  }, [servicesWithCoords]);

  // Group services by location
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

  // Priority colors
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  // Status colors
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

  // Custom marker icon based on priority
  const createCustomIcon = (priority: string, isSelected: boolean = false) => {
    const color = priority === 'urgent' ? 'red' : 
                  priority === 'high' ? 'orange' : 
                  priority === 'medium' ? 'gold' : 'green';
    
    const size = isSelected ? 32 : 24;
    const borderWidth = isSelected ? 4 : 2;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${borderWidth}px solid ${isSelected ? '#3b82f6' : 'white'}; box-shadow: 0 2px 8px rgba(0,0,0,${isSelected ? 0.5 : 0.3});"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Find selected service coordinates
  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return servicesWithCoords.find(s => s.id === selectedServiceId && s.latitude && s.longitude);
  }, [selectedServiceId, servicesWithCoords]);

  // Default center (Turkey - Ankara) or selected service location
  const mapCenter = useMemo(() => {
    if (selectedService?.latitude && selectedService?.longitude) {
      return [selectedService.latitude, selectedService.longitude] as [number, number];
    }
    return [39.9334, 32.8597] as [number, number];
  }, [selectedService]);

  const mapZoom = useMemo(() => {
    if (selectedService?.latitude && selectedService?.longitude) {
      return 15; // Zoom in to selected service
    }
    return 6; // Default zoom for all services
  }, [selectedService]);

  return (
    <div className="space-y-4">
      {/* Interactive Map */}
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Servis Lokasyonları Haritası
            {isLoadingCoords && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
            <Badge variant="outline" className="ml-auto">
              {mappableServices.length} lokasyon
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            {mappableServices.length > 0 ? (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
                key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MarkerClusterGroup>
                  {mappableServices.map((service) => {
                    if (!service.latitude || !service.longitude) return null;
                    
                    const technician = technicians?.find(
                      tech => tech.id === service.assigned_technician
                    );

                    const isSelected = selectedServiceId === service.id;

                    return (
                      <Marker
                        key={service.id}
                        position={[service.latitude, service.longitude]}
                        icon={createCustomIcon(service.service_priority || 'medium', isSelected)}
                        eventHandlers={{
                          click: () => onSelectService(service),
                        }}
                      >
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <h3 className="font-semibold text-sm mb-2">
                              {service.service_title}
                            </h3>
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                <span className="text-gray-600">
                                  {service.service_location}
                                </span>
                              </div>
                              
                              {technician && (
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  <span className="text-gray-600">
                                    {technician.first_name} {technician.last_name}
                                  </span>
                                </div>
                              )}
                              
                              {service.service_due_date && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-gray-600">
                                    {formatDate(service.service_due_date, 'dd MMM yyyy')}
                                  </span>
                                </div>
                              )}
                              
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {service.service_status}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {service.service_priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>
              </MapContainer>
            ) : (
              <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-12 w-12 text-blue-400 mx-auto" />
                  <p className="text-lg font-semibold text-blue-700">
                    {isLoadingCoords ? 'Lokasyonlar yükleniyor...' : 'Haritada gösterilecek lokasyon yok'}
                  </p>
                  <p className="text-sm text-blue-600">
                    {isLoadingCoords 
                      ? 'Adresler koordinatlara çevriliyor...'
                      : 'Servis taleplerine lokasyon ekleyerek harita görünümünde görebilirsiniz'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location-based Service List */}
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

      {/* Empty State */}
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
