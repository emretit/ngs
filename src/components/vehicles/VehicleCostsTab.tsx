import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, DollarSign, TrendingUp, Calendar, PieChart } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleFuel } from "@/hooks/useVehicleFuel";
import { useVehicleMaintenance } from "@/hooks/useVehicleMaintenance";
import { useVehicleIncidents } from "@/hooks/useVehicleIncidents";

export default function VehicleCostsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: vehicles } = useVehicles();
  const { data: fuelRecords } = useVehicleFuel();
  const { data: maintenanceRecords } = useVehicleMaintenance();
  const { data: incidents } = useVehicleIncidents();

  // Combine all cost records
  const allCosts = [
    ...(fuelRecords?.map(record => ({
      id: record.id,
      vehicle_id: record.vehicle_id,
      vehicles: record.vehicles,
      date: record.fuel_date,
      category: 'Yakıt',
      description: `${record.liters.toFixed(1)}L yakıt - ${record.fuel_station || 'Belirsiz istasyon'}`,
      amount: record.total_cost,
      type: 'fuel' as const
    })) || []),
    ...(maintenanceRecords?.filter(record => record.cost && record.cost > 0).map(record => ({
      id: record.id,
      vehicle_id: record.vehicle_id,
      vehicles: record.vehicles,
      date: record.maintenance_date,
      category: 'Bakım',
      description: `${record.maintenance_type} - ${record.description || ''}`,
      amount: record.cost || 0,
      type: 'maintenance' as const
    })) || []),
    ...(incidents?.filter(incident => (incident.cost && incident.cost > 0) || (incident.fine_amount && incident.fine_amount > 0)).map(incident => ({
      id: incident.id,
      vehicle_id: incident.vehicle_id,
      vehicles: incident.vehicles,
      date: incident.incident_date,
      category: incident.incident_type === 'trafik_cezası' || incident.incident_type === 'park_cezası' ? 'Ceza' : 'Onarım/Hasar',
      description: incident.description,
      amount: (incident.cost || 0) + (incident.fine_amount || 0),
      type: 'incident' as const
    })) || [])
  ];

  const filteredCosts = allCosts
    .filter(cost => {
      const matchesSearch = cost.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVehicle = selectedVehicle === 'all' || cost.vehicle_id === selectedVehicle;
      const matchesCategory = selectedCategory === 'all' || cost.category === selectedCategory;
      return matchesSearch && matchesVehicle && matchesCategory;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate stats
  const thisMonth = new Date();
  thisMonth.setDate(1);
  
  const thisMonthCosts = allCosts.filter(cost => {
    const costDate = new Date(cost.date);
    return costDate >= thisMonth;
  });

  const totalThisMonth = thisMonthCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const totalAllTime = allCosts.reduce((sum, cost) => sum + cost.amount, 0);

  const categoryTotals = allCosts.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>);

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      'Yakıt': 'bg-blue-100 text-blue-800',
      'Bakım': 'bg-green-100 text-green-800',
      'Ceza': 'bg-red-100 text-red-800',
      'Onarım/Hasar': 'bg-orange-100 text-orange-800',
      'Sigorta': 'bg-purple-100 text-purple-800'
    };
    return categoryColors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Maliyet Kaydı
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Bu Ay Toplam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{totalThisMonth.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {thisMonthCosts.length} işlem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Genel Toplam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{totalAllTime.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              {allCosts.length} işlem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              En Yüksek Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {Object.keys(categoryTotals).length > 0 && 
                (Object.entries(categoryTotals) as [string, number][])
                  .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'Yok'
              }
            </div>
            <div className="text-sm text-muted-foreground">
              ₺{Object.keys(categoryTotals).length > 0 && 
                ((Object.entries(categoryTotals) as [string, number][])
                  .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[1] as number | undefined)?.toLocaleString() || '0'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Ortalama Aylık
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{Math.round(totalAllTime / 12).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">tahmini</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} className="text-center">
                <Badge className={getCategoryBadge(category)} variant="secondary">
                  {category}
                </Badge>
                <div className="text-lg font-bold mt-2">₺{total.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">
                  %{totalAllTime ? (((total as number) / totalAllTime) * 100).toFixed(1) : '0.0'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Açıklama ara..."
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
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Kategoriler</option>
          <option value="Yakıt">Yakıt</option>
          <option value="Bakım">Bakım</option>
          <option value="Ceza">Ceza</option>
          <option value="Onarım/Hasar">Onarım/Hasar</option>
          <option value="Sigorta">Sigorta</option>
        </select>
      </div>

      {/* Costs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maliyet Detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Araç</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Tür</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCosts.map((cost) => (
                <TableRow key={`${cost.type}-${cost.id}`}>
                  <TableCell>
                    <div className="font-medium">
                      {cost.vehicles?.plate_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {cost.vehicles?.brand} {cost.vehicles?.model}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(cost.date).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryBadge(cost.category)}>
                      {cost.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{cost.description}</TableCell>
                  <TableCell className="font-bold">
                    ₺{cost.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {cost.type === 'fuel' && 'Yakıt'}
                      {cost.type === 'maintenance' && 'Bakım'}
                      {cost.type === 'incident' && 'Olay'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCosts.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Maliyet kaydı bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
