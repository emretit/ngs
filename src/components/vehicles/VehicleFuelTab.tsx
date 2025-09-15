import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Fuel, Gauge, TrendingUp, Calendar } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleFuel, useFuelStats } from "@/hooks/useVehicleFuel";

export default function VehicleFuelTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");

  const { data: vehicles } = useVehicles();
  const { data: fuelRecords, isLoading } = useVehicleFuel();
  const { data: stats } = useFuelStats();

  const filteredFuelRecords = fuelRecords?.filter(record => {
    const matchesSearch = record.fuel_station?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = selectedVehicle === 'all' || record.vehicle_id === selectedVehicle;
    return matchesSearch && matchesVehicle;
  });

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Yakıt Kaydı
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Fuel className="h-5 w-5 text-blue-600" />
              Bu Ay Yakıt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{stats?.totalCostThisMonth?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              {stats?.totalLitersThisMonth?.toFixed(1) || 0} litre
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5 text-green-600" />
              Ortalama Verim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageEfficiency?.toFixed(1) || 0} <span className="text-sm font-normal">km/L</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Toplam Kayıt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.recordCount || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Ortalama Fiyat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{filteredFuelRecords && filteredFuelRecords.length > 0 ? 
                (filteredFuelRecords.reduce((sum, record) => sum + record.cost_per_liter, 0) / filteredFuelRecords.length).toFixed(2) : 
                '0.00'}
            </div>
            <div className="text-sm text-muted-foreground">litre başına</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İstasyon ara..."
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
      </div>

      {/* Fuel Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Yakıt Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Araç</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>İstasyon</TableHead>
                <TableHead>Litre</TableHead>
                <TableHead>Litre Fiyatı</TableHead>
                <TableHead>Toplam Maliyet</TableHead>
                <TableHead>KM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFuelRecords?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="font-medium">
                      {record.vehicles?.plate_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {record.vehicles?.brand} {record.vehicles?.model}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(record.fuel_date).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>{record.fuel_station || '-'}</TableCell>
                  <TableCell>{record.liters.toFixed(1)} L</TableCell>
                  <TableCell>₺{record.cost_per_liter.toFixed(2)}</TableCell>
                  <TableCell>₺{record.total_cost.toFixed(2)}</TableCell>
                  <TableCell>
                    {record.mileage ? `${record.mileage.toLocaleString()} km` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFuelRecords?.length === 0 && (
            <div className="text-center py-8">
              <Fuel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Yakıt kaydı bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
