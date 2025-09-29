import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FileText, Calendar, AlertTriangle, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
// Schema mapping: Using employee_documents table for vehicle documents
// - employee_id: maps to vehicle_id (equipment.id)
// - document_type: registration, insurance, inspection, emission, etc.
// - file_name: document file name
// - file_url: document URL in storage
// - upload_date: document date
// - company_id: company filter
interface VehicleDocument {
  id: string;
  employee_id: string; // vehicle_id in context
  document_type: string;
  file_name: string;
  file_url: string;
  upload_date: string;
  company_id: string;
}
interface Vehicle {
  id: string;
  name: string; // plate
  model: string;
  manufacturer: string;
}
export default function VehicleDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-for-docs'],
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
  const { data: documents, isLoading } = useQuery({
    queryKey: ['vehicle-documents', selectedVehicle],
    queryFn: async () => {
      let query = supabase
        .from('employee_documents')
        .select('*')
        .order('upload_date', { ascending: false });
      if (selectedVehicle !== 'all') {
        query = query.eq('employee_id', selectedVehicle);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as VehicleDocument[];
    },
  });
  const documentTypes = [
    'registration', 'insurance', 'inspection', 'emission', 
    'license', 'hgs', 'ogs', 'warranty', 'lease_contract'
  ];
  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      'registration': 'Ruhsat',
      'insurance': 'Sigorta',
      'inspection': 'Muayene',
      'emission': 'Egzoz',
      'license': 'Ehliyet',
      'hgs': 'HGS',
      'ogs': 'OGS', 
      'warranty': 'Garanti',
      'lease_contract': 'Kiralama Sözleşmesi'
    };
    return labels[type] || type;
  };
  const isDocumentExpiring = (uploadDate: string, type: string) => {
    if (!uploadDate) return false;
    // Estimate expiry based on document type
    const expiryMonths = {
      'registration': 12,
      'insurance': 12,
      'inspection': 12,
      'emission': 24,
      'license': 60,
      'warranty': 36
    };
    const months = expiryMonths[type] || 12;
    const expiryDate = new Date(uploadDate);
    expiryDate.setMonth(expiryDate.getMonth() + months);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesType;
  });
  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.name} - ${vehicle.manufacturer} ${vehicle.model}` : 'Bilinmeyen Araç';
  };
  if (isLoading) {
    return <div className="flex justify-center p-8">Yükleniyor...</div>;
  }
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Araç Belgeleri</h1>
          <p className="text-muted-foreground">Araç belgelerini yönetin ve takip edin</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Belge Ekle
        </Button>
      </div>
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Belge ara..."
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
          <option value="all">Tüm Belgeler</option>
          {documentTypes.map(type => (
            <option key={type} value={type}>
              {getDocumentTypeLabel(type)}
            </option>
          ))}
        </select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Belge Listesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Araç</TableHead>
                <TableHead>Belge Türü</TableHead>
                <TableHead>Dosya Adı</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments?.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">
                    {getVehicleName(document.employee_id)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDocumentTypeLabel(document.document_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{document.file_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(document.upload_date).toLocaleDateString('tr-TR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isDocumentExpiring(document.upload_date, document.document_type) ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Süresi Yakında Dolacak
                      </Badge>
                    ) : (
                      <Badge variant="default">Geçerli</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="h-3 w-3" />
                      İndir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredDocuments?.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belge bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}