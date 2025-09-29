import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Fuel, Gauge, TrendingUp, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// Schema mapping: Using cashflow_transactions for fuel entries
// - category_id: fuel category
// - amount: fuel cost
// - date: fuel date
// - description: station, liters, odometer reading
// - attachment_url: receipt
// - company_id: company filter
// Using service_activities for odometer entries
// - title: "Odometer Reading"
// - description: current km
// - related_item_id: vehicle_id (equipment.id)
// - related_item_type: "vehicle"
interface FuelEntry {
  id: string;
  amount: number;
  date: string;
  description: string;
  attachment_url?: string;
  company_id: string;
}
interface OdometerEntry {
  id: string;
  title: string;
  description: string;
  related_item_id: string;
  created_at: string;
}
interface Vehicle {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
}
interface VehicleFuelProps {
  
  
}
export default function VehicleFuel({ isCollapsed, setIsCollapsed }: VehicleFuelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-fuel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, model, manufacturer')
        .eq('category', 'vehicle')
        .order('name');
      if (error) throw error;
      return data as Vehicle[];
    },
  });
  const { data: fuelEntries, isLoading: loadingFuel } = useQuery({
    queryKey: ['fuel-entries'],
    queryFn: async () => {
      // Get fuel category
      const { data: fuelCategory } = await supabase
        .from('cashflow_categories')
        .select('id')
        .eq('name', 'Yakıt')
        .eq('type', 'expense')
        .single();
      if (!fuelCategory) return [];
      const { data, error } = await supabase
        .from('cashflow_transactions')
        .select('*')
        .eq('category_id', fuelCategory.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as FuelEntry[];
    },
  });
  const { data: odometerEntries, isLoading: loadingOdometer } = useQuery({
    queryKey: ['odometer-entries', selectedVehicle],
    queryFn: async () => {
      let query = supabase
        .from('service_activities')
        .select('*')
        .eq('title', 'Odometer Reading')
        .eq('related_item_type', 'vehicle')
        .order('created_at', { ascending: false });
      if (selectedVehicle !== 'all') {
        query = query.eq('related_item_id', selectedVehicle);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as OdometerEntry[];
    },
  });
  const parseFuelData = (description: string) => {
    // Parse description like "Shell - 45.5L - 152,340 km"
    const match = description.match(/(.+?)\s*-\s*([\d,\.]+)L\s*-\s*([\d,\.]+)\s*km/);
    if (match) {
      return {
        station: match[1],
        liters: parseFloat(match[2].replace(',', '.')),
        odometer: parseInt(match[3].replace(/[,\.]/g, ''))
      };
    }
    return { station: description, liters: 0, odometer: 0 };
  };
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name}` : 'Bilinmeyen Araç';
  };
  const calculateFuelEfficiency = (entries: FuelEntry[]) => {
    if (entries.length < 2) return 0;
    const sortedEntries = entries
      .map(entry => ({
        ...entry,
        parsed: parseFuelData(entry.description)
      }))
      .filter(entry => entry.parsed.liters > 0 && entry.parsed.odometer > 0)
      .sort((a, b) => a.parsed.odometer - b.parsed.odometer);
    if (sortedEntries.length < 2) return 0;
    const totalDistance = sortedEntries[sortedEntries.length - 1].parsed.odometer - sortedEntries[0].parsed.odometer;
    const totalFuel = sortedEntries.reduce((sum, entry) => sum + entry.parsed.liters, 0);
    return totalDistance / totalFuel; // km/L
  };
  const filteredFuelEntries = fuelEntries?.filter(entry => {
    const parsed = parseFuelData(entry.description);
    return entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           parsed.station?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  const efficiency = fuelEntries ? calculateFuelEfficiency(fuelEntries) : 0;
  if (loadingFuel || loadingOdometer) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Yakıt & Kilometre Takibi</h1>
          <p className="text-muted-foreground">Yakıt tüketimi ve kilometre kayıtlarını yönetin</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yakıt Ekle
          </Button>
          <Button variant="outline" className="gap-2">
            <Gauge className="h-4 w-4" />
            KM Ekle
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Ortalama Tüketim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {efficiency.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">km/L</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Fuel className="h-5 w-5 text-blue-600" />
              Bu Ay Yakıt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fuelEntries
                ?.filter(entry => {
                  const entryDate = new Date(entry.date);
                  const now = new Date();
                  return entryDate.getMonth() === now.getMonth() && 
                         entryDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, entry) => sum + entry.amount, 0)
                .toFixed(0) || '0'} <span className="text-sm font-normal text-muted-foreground">₺</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5 text-purple-600" />
              Toplam KM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {odometerEntries?.[0]?.description?.replace(/\D/g, '') || '0'} <span className="text-sm font-normal text-muted-foreground">km</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Yakıt kaydı ara..."
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
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Yakıt Kayıtları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İstasyon</TableHead>
                  <TableHead>Litre</TableHead>
                  <TableHead>Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuelEntries?.slice(0, 10).map((entry) => {
                  const parsed = parseFuelData(entry.description);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(entry.date).toLocaleDateString('tr-TR')}
                        </div>
                      </TableCell>
                      <TableCell>{parsed.station}</TableCell>
                      <TableCell>{parsed.liters.toFixed(1)}L</TableCell>
                      <TableCell>{entry.amount.toFixed(2)}₺</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Kilometre Kayıtları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Araç</TableHead>
                  <TableHead>Kilometre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {odometerEntries?.slice(0, 10).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </TableCell>
                    <TableCell>{getVehicleName(entry.related_item_id)}</TableCell>
                    <TableCell>{entry.description} km</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}