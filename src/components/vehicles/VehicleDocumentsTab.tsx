import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, FileText, Calendar, AlertTriangle, Download } from "lucide-react";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleDocuments, useExpiringDocuments } from "@/hooks/useVehicleDocuments";
import VehicleDocumentsTabSkeleton from "./VehicleDocumentsTabSkeleton";

export default function VehicleDocumentsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all");
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>("all");

  const { data: vehicles } = useVehicles();
  const { data: documents, isLoading } = useVehicleDocuments();
  const { data: expiringDocuments } = useExpiringDocuments();

  const filteredDocuments = documents?.filter(document => {
    const matchesSearch = document.document_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.issuer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = selectedVehicle === 'all' || document.vehicle_id === selectedVehicle;
    const matchesType = selectedDocumentType === 'all' || document.document_type === selectedDocumentType;
    return matchesSearch && matchesVehicle && matchesType;
  });

  const getDocumentTypeBadge = (type: string) => {
    const typeColors = {
      'ruhsat': 'bg-blue-100 text-blue-800',
      'sigorta': 'bg-green-100 text-green-800',
      'muayene': 'bg-yellow-100 text-yellow-800',
      'trafik_sigortası': 'bg-purple-100 text-purple-800',
      'kasko': 'bg-indigo-100 text-indigo-800',
      'diğer': 'bg-gray-100 text-gray-800'
    };
    return typeColors[type] || 'bg-gray-100 text-gray-800';
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  if (isLoading && (!documents || (documents as any[]).length === 0)) {
    return <VehicleDocumentsTabSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Belge Yükle
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Toplam Belge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents?.length || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Süresi Yakında Dolan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expiringDocuments?.length || 0} <span className="text-sm font-normal text-muted-foreground">adet</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Ruhsat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents?.filter(d => d.document_type === 'ruhsat').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Sigorta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents?.filter(d => ['sigorta', 'trafik_sigortası', 'kasko'].includes(d.document_type)).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Documents Alert */}
      {expiringDocuments && expiringDocuments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Süresi Yakında Dolan Belgeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringDocuments.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex justify-between items-center text-sm">
                  <span>{doc.vehicles?.plate_number} - {doc.document_name}</span>
                  <span className="text-orange-700">
                    {doc.expiry_date && new Date(doc.expiry_date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Belge adı ara..."
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
          value={selectedDocumentType}
          onChange={(e) => setSelectedDocumentType(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">Tüm Belge Türleri</option>
          <option value="ruhsat">Ruhsat</option>
          <option value="sigorta">Sigorta</option>
          <option value="muayene">Muayene</option>
          <option value="trafik_sigortası">Trafik Sigortası</option>
          <option value="kasko">Kasko</option>
          <option value="hgs">HGS</option>
          <option value="ogs">OGS</option>
          <option value="diğer">Diğer</option>
        </select>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Belge Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Araç</TableHead>
                <TableHead>Belge Adı</TableHead>
                <TableHead>Türü</TableHead>
                <TableHead>Veren Kurum</TableHead>
                <TableHead>Veriliş Tarihi</TableHead>
                <TableHead>Son Geçerlilik</TableHead>
                <TableHead className="text-center">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments?.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="font-medium">
                      {document.vehicles?.plate_number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {document.vehicles?.brand} {document.vehicles?.model}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{document.document_name}</div>
                    {document.notes && (
                      <div className="text-sm text-muted-foreground">{document.notes}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getDocumentTypeBadge(document.document_type)}>
                      {document.document_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{document.issuer || '-'}</TableCell>
                  <TableCell>
                    {document.issue_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(document.issue_date).toLocaleDateString('tr-TR')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {document.expiry_date && (
                      <div className={`flex items-center gap-1 ${isExpiringSoon(document.expiry_date) ? 'text-orange-600' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        {new Date(document.expiry_date).toLocaleDateString('tr-TR')}
                        {isExpiringSoon(document.expiry_date) && (
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-3 w-3" />
                        İndir
                      </Button>
                    </div>
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
