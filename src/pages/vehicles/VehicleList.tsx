import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Car, Gauge, Calendar, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Schema mapping: Using equipment table as vehicle master record
// - name: vehicle identifier/plate
// - model: vehicle model
// - serial_number: VIN/chassis number  
// - category: vehicle type (sedan, truck, etc.)
// - manufacturer: vehicle brand
// - status: active/inactive/maintenance
// - specifications: vehicle specs as JSON (engine, fuel type, etc.)
// - customer_id: assigned driver/department
// - location_address: current location
// - installation_date: purchase/lease date
// - warranty_start/end: warranty period

interface Vehicle {
  id: string;
  name: string; // plate number
  model: string;
  manufacturer: string;
  category: string;
  status: string;
  serial_number: string; // VIN
  specifications: any;
  customer_id: string;
  location_address: string;
  installation_date: string;
  warranty_end: string;
  company_id: string;
}

export default function VehicleList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('category', 'vehicle')
        .order('name');

      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'maintenance': 'bg-yellow-100 text-yellow-800',
      'inactive': 'bg-red-100 text-red-800',
      'sold': 'bg-gray-100 text-gray-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const isWarrantyExpiring = (warrantyEnd: string) => {
    if (!warrantyEnd) return false;
    const today = new Date();
    const warrantyDate = new Date(warrantyEnd);
    const diffTime = warrantyDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
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

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Araç ara..."
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
          <option value="active">Aktif</option>
          <option value="maintenance">Bakımda</option>
          <option value="inactive">Pasif</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles?.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                </div>
                <Badge className={getStatusBadge(vehicle.status)}>
                  {vehicle.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {vehicle.manufacturer} {vehicle.model}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  <span>VIN: {vehicle.serial_number?.slice(-6) || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{vehicle.installation_date ? new Date(vehicle.installation_date).getFullYear() : 'N/A'}</span>
                </div>
              </div>
              
              {vehicle.location_address && (
                <p className="text-xs text-muted-foreground">
                  📍 {vehicle.location_address}
                </p>
              )}

              {isWarrantyExpiring(vehicle.warranty_end) && (
                <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  <AlertCircle className="h-3 w-3" />
                  Garanti yakında sona eriyor
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
  );
}