import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, AlertTriangle, Calendar, DollarSign, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Schema mapping: Using activities table for incidents and fines
// - title: incident type (accident, fine, damage)
// - description: incident details
// - related_item_id: vehicle_id (equipment.id)
// - related_item_type: "vehicle"
// - type: "incident"
// - status: pending, resolved, paid
// - priority: low, medium, high
// - due_date: payment due date for fines

interface Incident {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  created_at: string;
  related_item_id: string;
  related_item_type: string;
  type: string;
  company_id: string;
}

interface Vehicle {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
}

export default function VehicleIncidents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-incidents'],
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

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['vehicle-incidents', selectedVehicle],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('type', 'incident')
        .eq('related_item_type', 'vehicle')
        .order('created_at', { ascending: false });

      if (selectedVehicle !== 'all') {
        query = query.eq('related_item_id', selectedVehicle);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Incident[];
    },
  });

  const incidentTypes = [
    'accident', 'traffic_fine', 'parking_fine', 'damage', 
    'theft', 'breakdown', 'inspection_failure'
  ];

  const getIncidentTypeLabel = (type: string) => {
    const labels = {
      'accident': 'Kaza',
      'traffic_fine': 'Trafik Cezası',
      'parking_fine': 'Park Cezası',
      'damage': 'Hasar',
      'theft': 'Hırsızlık',
      'breakdown': 'Arıza',
      'inspection_failure': 'Muayene Başarısızlığı'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'paid': 'bg-blue-100 text-blue-800',
      'investigating': 'bg-orange-100 text-orange-800'
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

  const extractAmount = (description: string) => {
    // Extract amount from description like "Traffic fine - 234 TL"
    const match = description.match(/(\d+(?:[\.,]\d+)?)\s*(?:TL|₺|lira)/i);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name}` : 'Bilinmeyen Araç';
  };

  const filteredIncidents = incidents?.filter(incident => {
    const matchesSearch = incident.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    const matchesType = filterType === 'all' || incident.title.toLowerCase().includes(filterType);
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPendingAmount = incidents
    ?.filter(inc => inc.status === 'pending')
    .reduce((sum, inc) => sum + extractAmount(inc.description), 0) || 0;

  const thisMonthIncidents = incidents
    ?.filter(inc => {
      const incDate = new Date(inc.created_at);
      const now = new Date();
      return incDate.getMonth() === now.getMonth() && 
             incDate.getFullYear() === now.getFullYear();
    }).length || 0;

  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Olaylar & Cezalar</h1>
          <p className="text-muted-foreground">Araç olaylarını ve cezaları takip edin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Olay Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Bekleyen Ödemeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPendingAmount.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">₺</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Bu Ay Olaylar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {thisMonthIncidents} <span className="text-sm font-normal text-muted-foreground">adet</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Çözümlenen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {incidents?.filter(inc => inc.status === 'resolved').length || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Olay ara..."
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
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Türler</option>
          {incidentTypes.map(type => (
            <option key={type} value={type}>
              {getIncidentTypeLabel(type)}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="pending">Beklemede</option>
          <option value="resolved">Çözümlendi</option>
          <option value="paid">Ödendi</option>
          <option value="investigating">İnceleme</option>
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Olay Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Araç</TableHead>
                <TableHead>Olay Türü</TableHead>
                <TableHead>Açıklama</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Öncelik</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>Vade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents?.map((incident) => {
                const amount = extractAmount(incident.description);
                return (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">
                      {getVehicleName(incident.related_item_id)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getIncidentTypeLabel(incident.title)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {incident.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(incident.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </TableCell>
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
                      {amount > 0 && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {amount.toFixed(0)}₺
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {incident.due_date && (
                        <div className="text-sm">
                          {new Date(incident.due_date).toLocaleDateString('tr-TR')}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredIncidents?.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Olay bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}