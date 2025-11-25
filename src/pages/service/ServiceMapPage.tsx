import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import ServiceMapView from "@/components/service/ServiceMapView";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ServiceMapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedServiceId = searchParams.get('serviceId');
  const { userData } = useCurrentUser();
  const { data: serviceRequests = [], isLoading } = useServiceRequests();

  // Teknisyenleri getir
  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians-for-map", userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return [];
      }
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name, position, department, status")
        .eq("company_id", userData.company_id)
        .eq("status", "aktif");
      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const handleSelectService = (service: ServiceRequest) => {
    navigate(`/service/detail/${service.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Servisler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Servis Haritası</h1>
        <p className="text-muted-foreground">Servis lokasyonlarını harita üzerinde görüntüleyin</p>
      </div>

      {/* Map View */}
      <ServiceMapView
        serviceRequests={serviceRequests}
        technicians={technicians}
        onSelectService={handleSelectService}
        selectedServiceId={selectedServiceId || undefined}
      />
    </div>
  );
}


