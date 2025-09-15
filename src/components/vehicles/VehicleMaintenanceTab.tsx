import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Wrench, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleMaintenance, useMaintenanceStats, useUpcomingMaintenance } from "@/hooks/useVehicleMaintenance";

export default function VehicleMaintenanceTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");

  const { data: vehicles } = useVehicles();
  const { data: maintenanceRecords, isLoading } = useVehicleMaintenance();
  const { data: stats } = useMaintenanceStats();
  const { data: upcomingMaintenance } = useUpcomingMaintenance();

  const filteredMaintenanceRecords = maintenanceRecords?.filter(record => {
    const matchesSearch = record.maintenance_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesVehicle = selectedVehicle === 'all' || record.vehicle_id === selectedVehicle;
    return matchesSearch && matchesStatus && matchesVehicle;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'planlandı': 'bg-blue-100 text-blue-800',
      'devam_ediyor': 'bg-yellow-100 text-yellow-800',
      'tamamlandı': 'bg-green-100 text-green-800',
      'iptal': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Bakım Kaydı
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              Tamamlanan
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              Bu Ay Maliyeti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{stats?.thisMonthCost?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Bakım türü ara..."
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
          {vehicles?.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.plate_number} - {vehicle.brand} {vehicle.model}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="planlandı">Planlandı</option>
          <option value="devam_ediyor">Devam Ediyor</option>
          <option value="tamamlandı">Tamamlandı</option>
          <option value="iptal">İptal</option>
        </select>
      </div>

      {/* Maintenance Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bakım Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Araç</TableHead>
                <TableHead>Bakım Türü</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Maliyet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaintenanceRecords?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">
                      {record.vehicles?.plate_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.vehicles?.brand} {record.vehicles?.model}
                    </div>
                  </TableCell>
                  <TableCell>{record.maintenance_type}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.maintenance_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.maintenance_date).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {record.cost ? `₺${record.cost.toLocaleString()}` : '-'}
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
  );
}
