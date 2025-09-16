import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Wrench, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleMaintenance, useMaintenanceStats, useUpcomingMaintenance } from "@/hooks/useVehicleMaintenance";
import Navbar from "@/components/Navbar";
import TopBar from "@/components/TopBar";

// Schema mapping: Using service_requests for maintenance work orders
// - service_title: maintenance type
// - service_description: maintenance details
// - customer_id: vehicle_id (equipment.id)
// - service_status: pending, in_progress, completed
// - service_priority: low, medium, high
// - assigned_technician: mechanic
// - scheduled_date: maintenance date
// - company_id: company filter

interface MaintenanceRecord {
  id: string;
  service_title: string;
  service_description: string;
  customer_id: string; // vehicle_id in context
  service_status: string;
  service_priority: string;
  assigned_technician?: string;
  scheduled_date?: string;
  created_at: string;
  completed_at?: string;
  company_id: string;
}

interface VehicleMaintenanceProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function VehicleMaintenance({ isCollapsed, setIsCollapsed }: VehicleMaintenanceProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");

  const { data: vehicles } = useVehicles();
  const { data: maintenanceRecords, isLoading } = useVehicleMaintenance();
  const { data: stats } = useMaintenanceStats();
  const { data: upcomingMaintenance } = useUpcomingMaintenance();

  const maintenanceTypes = [
    'periodic', 'oil_change', 'brake_service', 'tire_change', 
    'inspection', 'repair', 'emergency'
  ];

  const getMaintenanceTypeLabel = (type: string) => {
    const labels = {
      'periodic': 'Periyodik Bakım',
      'oil_change': 'Yağ Değişimi',
      'brake_service': 'Fren Servisi',
      'tire_change': 'Lastik Değişimi',
      'inspection': 'Kontrol',
      'repair': 'Onarım',
      'emergency': 'Acil Müdahale'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'new': 'bg-blue-100 text-blue-800',
      'assigned': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.plate_number} - ${vehicle.brand} ${vehicle.model}` : 'Bilinmeyen Araç';
  };

  const getUpcomingMaintenance = (vehicle: Vehicle) => {
    if (!vehicle.maintenance_schedule) return null;
    
    try {
      const schedule = vehicle.maintenance_schedule;
      if (schedule.next_service_date) {
        const nextDate = new Date(schedule.next_service_date);
        const today = new Date();
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30 && diffDays > 0) {
          return diffDays;
        }
      }
    } catch (e) {
      console.log('Error parsing maintenance schedule:', e);
    }
    
    return null;
  };

  const filteredMaintenanceRecords = maintenanceRecords?.filter(record => {
    const matchesSearch = record.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesVehicle = selectedVehicle === 'all' || record.vehicle_id === selectedVehicle;
    return matchesSearch && matchesStatus && matchesVehicle;
  });

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
          <h1 className="text-3xl font-bold">Bakım & Servis</h1>
          <p className="text-muted-foreground">Araç bakım ve servis işlemlerini yönetin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Bakım Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Bekleyen İşler
            </CardTitle>
          </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.pending || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
              </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Bu Ay Tamamlanan
            </CardTitle>
          </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.completed || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
              </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Yaklaşan Bakımlar
            </CardTitle>
          </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingMaintenance?.length || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
              </div>
            </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Bakım ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <select
          value={selectedVehicle}
          onChange={(e) => setSelectedVehicle(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Araçlar</option>
          {vehicles?.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.name} - {vehicle.manufacturer} {vehicle.model}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="new">Yeni</option>
          <option value="assigned">Atandı</option>
          <option value="in_progress">Devam Ediyor</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal Edildi</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Bakım Kayıtları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Araç</TableHead>
                <TableHead>Bakım Türü</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Planlanan Tarih</TableHead>
                <TableHead>Tamamlanma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaintenanceRecords?.map((record) => (
                <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {getVehicleName(record.vehicle_id)}
                    </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getMaintenanceTypeLabel(record.service_title)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {record.service_description}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(record.service_status)}>
                      {record.service_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityBadge(record.service_priority)}>
                      {record.service_priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.scheduled_date && (
                       <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(record.scheduled_date as string).toLocaleDateString('tr-TR')}
                        </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.completed_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        {new Date(record.completed_at).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMaintenanceRecords?.length === 0 && (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Bakım kaydı bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}