import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Car, Gauge, Calendar, AlertCircle, TrendingUp, Fuel, Wrench, DollarSign } from "lucide-react";
import { useVehicles, useVehicleStats } from "@/hooks/useVehicles";
import { Vehicle } from "@/types/vehicle";

export default function VehicleListTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  const { data: vehicles, isLoading } = useVehicles();
  const { data: stats } = useVehicleStats();

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'aktif': 'bg-green-100 text-green-800',
      'bakım': 'bg-yellow-100 text-yellow-800',
      'pasif': 'bg-red-100 text-red-800',
      'satıldı': 'bg-gray-100 text-gray-800',
      'hasar': 'bg-orange-100 text-orange-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
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
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Araç
        </Button>
      </div>

      {/* Dashboard Overview */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Araç Dashboard</h2>
            <p className="text-muted-foreground">Araç durumu ve önemli uyarılar</p>
          </div>
        </div>

        {/* Status Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  Toplam Araç
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Kayıtlı araç</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Aktif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">{stats.aktif}</div>
                <div className="text-sm text-green-600">Çalışır durumda</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                  <Wrench className="h-5 w-5 text-yellow-600" />
                  Bakımda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-700">{stats.bakım}</div>
                <div className="text-sm text-yellow-600">Serviste</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Pasif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">{stats.pasif}</div>
                <div className="text-sm text-red-600">Kullanılmıyor</div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-gray-200 bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  Satıldı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-700">{stats.satıldı}</div>
                <div className="text-sm text-gray-600">Elden çıkarıldı</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Fuel className="h-5 w-5 text-blue-600" />
                Ortalama KM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicles && vehicles.length > 0 
                  ? Math.round(vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0) / vehicles.length).toLocaleString()
                  : '0'
                } km
              </div>
              <div className="text-sm text-muted-foreground">Filo ortalaması</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Ortalama Yaş
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vehicles && vehicles.length > 0 
                  ? Math.round(vehicles.reduce((sum, v) => {
                      const currentYear = new Date().getFullYear();
                      return sum + (currentYear - (v.year || currentYear));
                    }, 0) / vehicles.length)
                  : '0'
                } yıl
              </div>
              <div className="text-sm text-muted-foreground">Filo ortalaması</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Uyarılar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {vehicles?.filter(v => isInsuranceExpiring(v.insurance_end_date || '')).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Sigorta süresi dolacak</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Plaka veya marka ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="bakım">Bakımda</option>
          <option value="pasif">Pasif</option>
          <option value="satıldı">Satıldı</option>
          <option value="hasar">Hasarlı</option>
        </select>
      </div>

      {/* Vehicle List Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Araç Listesi</h3>
          <div className="text-sm text-muted-foreground">
            {filteredVehicles?.length || 0} araç gösteriliyor
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles?.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{vehicle.plate_number}</CardTitle>
                  </div>
                  <Badge className={getStatusBadge(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Kilometre</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">{vehicle.purchase_date ? new Date(vehicle.purchase_date).getFullYear() : 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Model Yılı</div>
                    </div>
                  </div>
                </div>

                {/* Fuel & Transmission */}
                {vehicle.fuel_type && (
                  <div className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4 text-purple-600" />
                    <div>
                      <span className="font-medium capitalize">{vehicle.fuel_type}</span>
                      <span className="text-muted-foreground"> • </span>
                      <span className="capitalize">{vehicle.transmission}</span>
                    </div>
                  </div>
                )}

                {/* Location */}
                {vehicle.location_address && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="text-muted-foreground">📍</div>
                    <span className="text-muted-foreground truncate">{vehicle.location_address}</span>
                  </div>
                )}

                {/* Alerts */}
                {isInsuranceExpiring(vehicle.insurance_end_date || '') && (
                  <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-100 p-2 rounded-md border border-orange-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Sigorta yakında sona eriyor</span>
                  </div>
                )}

                {vehicle.status === 'bakım' && (
                  <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded-md border border-yellow-200">
                    <Wrench className="h-4 w-4" />
                    <span className="font-medium">Araç bakımda</span>
                  </div>
                )}

                {/* Action Button */}
                <Button 
                  variant="outline" 
                  className="w-full mt-4 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                >
                  Detayları Görüntüle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {filteredVehicles?.length === 0 && (
        <div className="text-center py-8">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Araç bulunamadı</p>
        </div>
      )}
    </div>
  );
}
