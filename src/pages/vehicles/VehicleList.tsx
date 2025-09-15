import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Car, Gauge, Calendar, AlertCircle } from "lucide-react";
import { useVehicles, useVehicleStats } from "@/hooks/useVehicles";
import { Vehicle } from "@/types/vehicle";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";

interface VehicleListProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function VehicleList({ isCollapsed, setIsCollapsed }: VehicleListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-64"
        }`}>
          <TopBar />
          <div className="flex justify-center p-8">Yükleniyor...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-[60px]" : "ml-64"
      }`}>
        <TopBar />
        <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Araç Yönetimi</h1>
          <p className="text-muted-foreground">Şirket araçlarınızı yönetin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Araç
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-center">{stats.total}</div>
              <div className="text-sm text-muted-foreground text-center">Toplam</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-center text-green-600">{stats.aktif}</div>
              <div className="text-sm text-muted-foreground text-center">Aktif</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-center text-yellow-600">{stats.bakım}</div>
              <div className="text-sm text-muted-foreground text-center">Bakımda</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-center text-red-600">{stats.pasif}</div>
              <div className="text-sm text-muted-foreground text-center">Pasif</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-center text-gray-600">{stats.satıldı}</div>
              <div className="text-sm text-muted-foreground text-center">Satıldı</div>
            </CardContent>
          </Card>
        </div>
      )}

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles?.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  <span>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'KM: N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{vehicle.purchase_date ? new Date(vehicle.purchase_date).getFullYear() : 'N/A'}</span>
                </div>
              </div>
              
              {vehicle.location_address && (
                <p className="text-xs text-muted-foreground">
                  📍 {vehicle.location_address}
                </p>
              )}

              {isInsuranceExpiring(vehicle.insurance_end_date || '') && (
                <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  <AlertCircle className="h-3 w-3" />
                  Sigorta yakında sona eriyor
                </div>
              )}

              {vehicle.fuel_type && (
                <div className="text-xs text-muted-foreground">
                  Yakıt: {vehicle.fuel_type} • {vehicle.transmission}
                </div>
              )}

              <Button variant="outline" className="w-full mt-3">
                Detayları Görüntüle
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles?.length === 0 && (
        <div className="text-center py-8">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Araç bulunamadı</p>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}