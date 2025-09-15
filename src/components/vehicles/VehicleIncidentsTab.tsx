import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, AlertTriangle, Calendar, DollarSign, Clock } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleIncidents, useIncidentStats, usePendingFines } from "@/hooks/useVehicleIncidents";

export default function VehicleIncidentsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: vehicles } = useVehicles();
  const { data: incidents, isLoading } = useVehicleIncidents();
  const { data: stats } = useIncidentStats();
  const { data: pendingFines } = usePendingFines();

  const filteredIncidents = incidents?.filter(incident => {
    const matchesSearch = incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = selectedVehicle === 'all' || incident.vehicle_id === selectedVehicle;
    const matchesType = selectedIncidentType === 'all' || incident.incident_type === selectedIncidentType;
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    return matchesSearch && matchesVehicle && matchesType && matchesStatus;
  });

  const getIncidentTypeBadge = (type: string) => {
    const typeColors = {
      'kaza': 'bg-red-100 text-red-800',
      'trafik_cezası': 'bg-orange-100 text-orange-800',
      'park_cezası': 'bg-yellow-100 text-yellow-800',
      'hasar': 'bg-purple-100 text-purple-800',
      'hırsızlık': 'bg-gray-100 text-gray-800',
      'arıza': 'bg-blue-100 text-blue-800'
    };
    return typeColors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'beklemede': 'bg-yellow-100 text-yellow-800',
      'çözüldü': 'bg-green-100 text-green-800',
      'ödendi': 'bg-blue-100 text-blue-800',
      'inceleniyor': 'bg-purple-100 text-purple-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      'düşük': 'bg-green-100 text-green-800',
      'orta': 'bg-yellow-100 text-yellow-800',
      'yüksek': 'bg-orange-100 text-orange-800',
      'acil': 'bg-red-100 text-red-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Olay Kaydı
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Toplam Olay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Bu Ay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.thisMonth || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Bekleyen
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
              <DollarSign className="h-5 w-5 text-purple-600" />
              Bekleyen Cezalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₺{stats?.pendingFines?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Fines Alert */}
      {pendingFines && pendingFines.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Ödenmemiş Cezalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingFines.slice(0, 3).map((fine) => (
                <div key={fine.id} className="flex justify-between items-center text-sm">
                  <span>{fine.vehicles?.plate_number} - {fine.description}</span>
                  <span className="text-red-700 font-bold">
                    ₺{fine.fine_amount?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Olay açıklaması ara..."
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
          value={selectedIncidentType}
          onChange={(e) => setSelectedIncidentType(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Olay Türleri</option>
          <option value="kaza">Kaza</option>
          <option value="trafik_cezası">Trafik Cezası</option>
          <option value="park_cezası">Park Cezası</option>
          <option value="hasar">Hasar</option>
          <option value="hırsızlık">Hırsızlık</option>
          <option value="arıza">Arıza</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="beklemede">Beklemede</option>
          <option value="çözüldü">Çözüldü</option>
          <option value="ödendi">Ödendi</option>
          <option value="inceleniyor">İnceleniyor</option>
        </select>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Olay & Ceza Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Araç</TableHead>
                <TableHead>Olay Türü</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Konum</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Maliyet/Ceza</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents?.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <div className="font-medium">
                      {incident.vehicles?.plate_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {incident.vehicles?.brand} {incident.vehicles?.model}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getIncidentTypeBadge(incident.incident_type)}>
                      {incident.incident_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.description}</TableCell>
                  <TableCell>
                    {new Date(incident.incident_date).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>{incident.location || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(incident.status)}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityBadge(incident.priority)}>
                      {incident.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {incident.cost && incident.cost > 0 && (
                        <div>₺{incident.cost.toLocaleString()}</div>
                      )}
                      {incident.fine_amount && incident.fine_amount > 0 && (
                        <div className="text-red-600 font-bold">
                          Ceza: ₺{incident.fine_amount.toLocaleString()}
                        </div>
                      )}
                      {!incident.cost && !incident.fine_amount && '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredIncidents?.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Olay kaydı bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
