import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Vehicle } from "@/types/vehicle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Car, Gauge, Calendar, AlertCircle, MapPin, Fuel, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface VehicleDetailsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const VehicleDetails = ({ isCollapsed, setIsCollapsed }: VehicleDetailsProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      if (!id) throw new Error("Araç ID'si gerekli");
      
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Araç bulunamadı");
      
      return data as Vehicle;
    },
    enabled: !!id,
    meta: {
      onError: (error: Error) => {
        toast({
          variant: "destructive",
          title: "Hata",
          description: error.message || "Araç detayları yüklenirken hata oluştu",
        });
      },
    },
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'aktif': 'bg-green-100 text-green-800 border-green-200',
      'bakım': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'pasif': 'bg-red-100 text-red-800 border-red-200',
      'satıldı': 'bg-gray-100 text-gray-800 border-gray-200',
      'hasar': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const isInsuranceExpiring = (insuranceEnd: string) => {
    if (!insuranceEnd) return false;
    const today = new Date();
    const insuranceDate = new Date(insuranceEnd);
    const diffTime = insuranceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Car className="h-16 w-16 text-muted-foreground" />
        <div className="text-xl font-semibold">Araç bulunamadı</div>
        <Button onClick={() => navigate('/vehicles')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Araç Listesine Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/vehicles')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Geri Dön
                </Button>
                <div>
                  <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Car className="h-8 w-8 text-primary" />
                    {vehicle.plate_number}
                  </h1>
                  <p className="text-muted-foreground">
                    {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                  </p>
                </div>
              </div>
              <Badge className={getStatusBadge(vehicle.status)}>
                {vehicle.status}
              </Badge>
            </div>

            {/* Vehicle Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-blue-600" />
                    Kilometre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'Bilinmiyor'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Fuel className="h-5 w-5 text-green-600" />
                    Yakıt Türü
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold capitalize">
                    {vehicle.fuel_type || 'Bilinmiyor'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vehicle.transmission || 'Bilinmiyor'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    Satın Alma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold">
                    {vehicle.purchase_date ? new Date(vehicle.purchase_date).getFullYear() : 'Bilinmiyor'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vehicle.purchase_price ? `₺${vehicle.purchase_price.toLocaleString()}` : 'Fiyat bilinmiyor'}
                  </div>
                </CardContent>
              </Card>

              <Card className={isInsuranceExpiring(vehicle.insurance_end_date || '') ? 'border-orange-200 bg-orange-50' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-lg flex items-center gap-2 ${isInsuranceExpiring(vehicle.insurance_end_date || '') ? 'text-orange-800' : ''}`}>
                    <AlertCircle className="h-5 w-5" />
                    Sigorta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-semibold ${isInsuranceExpiring(vehicle.insurance_end_date || '') ? 'text-orange-800' : ''}`}>
                    {vehicle.insurance_end_date ? new Date(vehicle.insurance_end_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vehicle.insurance_company || 'Şirket bilinmiyor'}
                  </div>
                  {isInsuranceExpiring(vehicle.insurance_end_date || '') && (
                    <div className="text-xs text-orange-700 mt-1">
                      ⚠️ Yakında sona eriyor
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alert Cards */}
            {(isInsuranceExpiring(vehicle.insurance_end_date || '') || vehicle.status === 'bakım') && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-800 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Dikkat Gereken Durumlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {isInsuranceExpiring(vehicle.insurance_end_date || '') && (
                      <div className="text-sm text-orange-700">
                        🚨 Sigorta poliçesi 30 gün içinde sona erecek
                      </div>
                    )}
                    {vehicle.status === 'bakım' && (
                      <div className="text-sm text-orange-700">
                        🔧 Araç şu anda bakımda
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detailed Information Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Genel Bilgiler
                </TabsTrigger>
                <TabsTrigger value="specifications" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Teknik Özellikler
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Konum & Atama
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tarihler & Belgeler
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Temel Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Plaka:</div>
                        <div>{vehicle.plate_number}</div>
                        <div className="font-medium">Marka:</div>
                        <div>{vehicle.brand}</div>
                        <div className="font-medium">Model:</div>
                        <div>{vehicle.model}</div>
                        <div className="font-medium">Yıl:</div>
                        <div>{vehicle.year || 'Bilinmiyor'}</div>
                        <div className="font-medium">Renk:</div>
                        <div>{vehicle.color || 'Bilinmiyor'}</div>
                        <div className="font-medium">Durum:</div>
                        <div>
                          <Badge className={getStatusBadge(vehicle.status)}>
                            {vehicle.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Finansal Bilgiler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Satın Alma Fiyatı:</div>
                        <div>{vehicle.purchase_price ? `₺${vehicle.purchase_price.toLocaleString()}` : 'Bilinmiyor'}</div>
                        <div className="font-medium">Güncel Değer:</div>
                        <div>{vehicle.current_value ? `₺${vehicle.current_value.toLocaleString()}` : 'Bilinmiyor'}</div>
                        <div className="font-medium">Kilometre:</div>
                        <div>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'Bilinmiyor'}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="specifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Teknik Özellikler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Motor Hacmi:</div>
                          <div>{vehicle.engine_size || 'Bilinmiyor'}</div>
                          <div className="font-medium">Yakıt Türü:</div>
                          <div className="capitalize">{vehicle.fuel_type || 'Bilinmiyor'}</div>
                          <div className="font-medium">Şanzıman:</div>
                          <div className="capitalize">{vehicle.transmission || 'Bilinmiyor'}</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="font-medium">Şasi No:</div>
                          <div className="font-mono text-xs">{vehicle.vin_number || 'Bilinmiyor'}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Konum Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Konum:</div>
                        <div>{vehicle.location_address || 'Atanmamış'}</div>
                        <div className="font-medium">Departman:</div>
                        <div>{vehicle.assigned_department || 'Atanmamış'}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sürücü Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <div className="font-medium mb-2">Atanmış Sürücü:</div>
                        <div>{vehicle.assigned_driver_id ? 'Atanmış' : 'Atanmamış'}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sigorta Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Sigorta Şirketi:</div>
                        <div>{vehicle.insurance_company || 'Bilinmiyor'}</div>
                        <div className="font-medium">Poliçe No:</div>
                        <div>{vehicle.insurance_policy_number || 'Bilinmiyor'}</div>
                        <div className="font-medium">Başlangıç:</div>
                        <div>{vehicle.insurance_start_date ? new Date(vehicle.insurance_start_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</div>
                        <div className="font-medium">Bitiş:</div>
                        <div className={isInsuranceExpiring(vehicle.insurance_end_date || '') ? 'text-orange-600 font-semibold' : ''}>
                          {vehicle.insurance_end_date ? new Date(vehicle.insurance_end_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Muayene Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-medium">Son Muayene:</div>
                        <div>{vehicle.inspection_date ? new Date(vehicle.inspection_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</div>
                        <div className="font-medium">Sonraki Muayene:</div>
                        <div>{vehicle.next_inspection_date ? new Date(vehicle.next_inspection_date).toLocaleDateString('tr-TR') : 'Bilinmiyor'}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {vehicle.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{vehicle.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
  );
};

export default VehicleDetails;
