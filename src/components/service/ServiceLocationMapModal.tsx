import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Loader2, AlertCircle } from "lucide-react";
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

interface ServiceLocationMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceRequest | null;
  technician?: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

const ServiceLocationMapModal: React.FC<ServiceLocationMapModalProps> = ({
  open,
  onOpenChange,
  service,
  technician,
}) => {
  const { geocode, isGeocoding } = useLocationIQGeocoding();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Geocode service location when modal opens
  useEffect(() => {
    if (open && service?.service_location) {
      const fetchCoordinates = async () => {
        setError(null);
        setCoordinates(null);
        
        try {
          const result = await geocode(service.service_location!);
          if (result) {
            setCoordinates({
              lat: result.latitude,
              lng: result.longitude,
            });
          } else {
            setError('Konum bulunamadı');
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          setError('Konum bulunurken bir hata oluştu');
        }
      };

      fetchCoordinates();
    } else {
      // Reset when modal closes
      setCoordinates(null);
      setError(null);
    }
  }, [open, service?.service_location, geocode]);

  // Priority colors for marker
  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'green',
    };
    return colors[priority as keyof typeof colors] || 'gray';
  };

  // Custom marker icon based on priority
  const createCustomIcon = (priority: string) => {
    const color = getPriorityColor(priority);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Default center (Turkey - Ankara)
  const defaultCenter: [number, number] = [39.9334, 32.8597];
  const defaultZoom = 6;

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {service.service_title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {/* Service Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{service.service_location}</span>
            </div>
            {technician && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {technician.first_name} {technician.last_name}
                </span>
              </div>
            )}
            {service.service_due_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {formatDate(service.service_due_date, 'dd MMM yyyy')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {service.service_status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {service.service_priority}
              </Badge>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 min-h-[400px] rounded-lg overflow-hidden border">
            {isGeocoding ? (
              <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                  <p className="text-sm text-blue-700">Konum bulunuyor...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                  <p className="text-sm text-red-700">{error}</p>
                  <p className="text-xs text-red-600">{service.service_location}</p>
                </div>
              </div>
            ) : coordinates ? (
              <MapContainer
                center={[coordinates.lat, coordinates.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[coordinates.lat, coordinates.lng]}
                  icon={createCustomIcon(service.service_priority || 'medium')}
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
              </MapContainer>
            ) : (
              <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">Konum bilgisi yok</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceLocationMapModal;






