import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  Car,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVehicleContracts } from '@/hooks/useVehicleContracts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const contractTypeLabels: Record<string, string> = {
  kiralama: 'Kiralama',
  sigorta: 'Sigorta',
  bakım: 'Bakım',
  garanti: 'Garanti',
  hizmet: 'Hizmet',
};

export default function VehicleContracts() {
  const navigate = useNavigate();
  const { contracts = [], isLoading, stats } = useVehicleContracts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtrelenmiş sözleşmeler
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = 
        contract.contract_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contract_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.provider_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || contract.contract_type === filterType;
      const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contracts, searchQuery, filterType, filterStatus]);

  // İstatistikler
  const calculatedStats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter(c => c.status === 'aktif').length;
    const expiring = contracts.filter(c => {
      if (!c.end_date) return false;
      const endDate = new Date(c.end_date);
      const now = new Date();
      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    }).length;
    const expired = contracts.filter(c => c.status === 'süresi_doldu').length;

    return { total, active, expiring, expired };
  }, [contracts]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Aktif</Badge>;
      case 'süresi_doldu':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Süresi Doldu</Badge>;
      case 'iptal':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">İptal</Badge>;
      case 'askıda':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Askıda</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/contracts')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Araç Sözleşmeleri</h1>
              <p className="text-muted-foreground text-sm">Araç kiralama, sigorta ve bakım sözleşmeleri</p>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate('/vehicles')}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sözleşme
        </Button>
      </div>

      {/* İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Sözleşme</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedStats.total}</div>
            <p className="text-xs text-muted-foreground">Aktif ve pasif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Sözleşmeler</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedStats.active}</div>
            <p className="text-xs text-muted-foreground">Devam eden</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yenilenecek</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedStats.expiring}</div>
            <p className="text-xs text-muted-foreground">30 gün içinde</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Süresi Dolan</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedStats.expired}</div>
            <p className="text-xs text-muted-foreground">Yenileme gerekli</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtreler */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sözleşme ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tür" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                {Object.entries(contractTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="süresi_doldu">Süresi Doldu</SelectItem>
                <SelectItem value="iptal">İptal</SelectItem>
                <SelectItem value="askıda">Askıda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sözleşme Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Araç Sözleşmeleri</CardTitle>
          <CardDescription>
            {filteredContracts.length} sözleşme listeleniyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Car className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz araç sözleşmesi eklenmemiş</h3>
              <p className="text-muted-foreground mb-4">
                Araçlarınız için kiralama, sigorta ve bakım sözleşmelerini takip edin.
              </p>
              <Button onClick={() => navigate('/vehicles')}>
                <Plus className="h-4 w-4 mr-2" />
                Araçlar Sayfasına Git
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sözleşme Adı</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Sağlayıcı</TableHead>
                  <TableHead>Başlangıç</TableHead>
                  <TableHead>Bitiş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{contract.contract_name}</div>
                        <div className="text-xs text-muted-foreground">{contract.contract_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {contractTypeLabels[contract.contract_type] || contract.contract_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{contract.provider_name}</TableCell>
                    <TableCell>
                      {contract.start_date && format(new Date(contract.start_date), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell>
                      {contract.end_date && format(new Date(contract.end_date), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Görüntüle
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

