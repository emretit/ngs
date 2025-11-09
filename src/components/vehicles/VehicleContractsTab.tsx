import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Edit,
  Trash2
} from "lucide-react";
import { useVehicleContracts, useContractStats, useContractAlerts } from "@/hooks/useVehicleContracts";
import { VehicleContract, ContractType, ContractStatus } from "@/types/vehicle-contract";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const contractTypeLabels: Record<ContractType, string> = {
  kiralama: "Kiralama",
  sigorta: "Sigorta",
  bakım: "Bakım",
  garanti: "Garanti",
  hizmet: "Hizmet"
};

const contractStatusLabels: Record<ContractStatus, string> = {
  aktif: "Aktif",
  süresi_doldu: "Süresi Doldu",
  iptal: "İptal",
  askıda: "Askıda"
};

const statusColors: Record<ContractStatus, string> = {
  aktif: "bg-green-100 text-green-800",
  süresi_doldu: "bg-red-100 text-red-800",
  iptal: "bg-gray-100 text-gray-800",
  askıda: "bg-yellow-100 text-yellow-800"
};

export default function VehicleContractsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ContractType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<ContractStatus | "all">("all");

  const { data: contracts, isLoading } = useVehicleContracts();
  const { data: stats } = useContractStats();
  const { data: alerts } = useContractAlerts();

  const filteredContracts = contracts?.filter(contract => {
    const matchesSearch = 
      contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.vehicles.plate_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || contract.contract_type === filterType;
    const matchesStatus = filterStatus === "all" || contract.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sözleşmeler</h2>
          <p className="text-gray-600">Araç sözleşmelerini yönetin ve takip edin</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Sözleşme
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Sözleşme</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_contracts}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Sözleşme</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_contracts}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Yakında Dolacak</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.expiring_soon}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aylık Toplam Maliyet</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_monthly_cost.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Sözleşme Uyarıları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium">{alert.contract_name}</p>
                    <p className="text-sm text-gray-600">
                      {alert.vehicle_plate} - {alert.message}
                    </p>
                  </div>
                  <Badge 
                    variant={alert.priority === 'urgent' ? 'destructive' : 'secondary'}
                  >
                    {alert.days_remaining < 0 ? 'Süresi Doldu' : `${alert.days_remaining} gün`}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Sözleşme ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ContractType | "all")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Türler</option>
              {Object.entries(contractTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ContractStatus | "all")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              {Object.entries(contractStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sözleşme Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sözleşme</TableHead>
                <TableHead>Araç</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>Sağlayıcı</TableHead>
                <TableHead>Başlangıç</TableHead>
                <TableHead>Bitiş</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Maliyet</TableHead>
                <TableHead className="text-center">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts?.map((contract) => {
                const daysRemaining = getDaysRemaining(contract.end_date);
                return (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.contract_name}</p>
                        <p className="text-sm text-gray-500">{contract.contract_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.vehicles.plate_number}</p>
                        <p className="text-sm text-gray-500">
                          {contract.vehicles.brand} {contract.vehicles.model}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contractTypeLabels[contract.contract_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contract.provider_name}</p>
                        {contract.provider_contact && (
                          <p className="text-sm text-gray-500">{contract.provider_contact}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(contract.start_date), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {format(new Date(contract.end_date), 'dd MMM yyyy', { locale: tr })}
                        {daysRemaining <= 30 && daysRemaining > 0 && (
                          <Badge variant="secondary" className="text-orange-600">
                            {daysRemaining} gün
                          </Badge>
                        )}
                        {daysRemaining < 0 && (
                          <Badge variant="destructive">
                            Süresi Doldu
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[contract.status]}>
                        {contractStatusLabels[contract.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {contract.monthly_cost.toLocaleString('tr-TR')} ₺
                        </p>
                        <p className="text-sm text-gray-500">
                          {contract.payment_frequency}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Düzenle">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" title="Sil">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredContracts?.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Sözleşme bulunamadı</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
