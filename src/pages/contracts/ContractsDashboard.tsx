import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSignature, 
  Wrench, 
  Car, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Calendar,
  Plus,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVehicleContracts } from '@/hooks/useVehicleContracts';

export default function ContractsDashboard() {
  const navigate = useNavigate();
  const { data: vehicleContracts = [], isLoading } = useVehicleContracts();

  // Toplam istatistikler
  const stats = useMemo(() => {
    const totalContracts = vehicleContracts.length;
    const activeContracts = vehicleContracts.filter(c => c.status === 'aktif').length;
    const expiringContracts = vehicleContracts.filter(c => {
      if (!c.end_date) return false;
      const endDate = new Date(c.end_date);
      const now = new Date();
      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays > 0;
    }).length;
    const expiredContracts = vehicleContracts.filter(c => c.status === 'süresi_doldu').length;

    return {
      total: totalContracts,
      active: activeContracts,
      expiring: expiringContracts,
      expired: expiredContracts,
    };
  }, [vehicleContracts]);

  // Son eklenen sözleşmeler
  const recentContracts = useMemo(() => {
    return vehicleContracts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [vehicleContracts]);

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

  const contractTypeLabels: Record<string, string> = {
    kiralama: 'Kiralama',
    sigorta: 'Sigorta',
    bakım: 'Bakım',
    garanti: 'Garanti',
    hizmet: 'Hizmet',
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
              <FileSignature className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Sözleşme Yönetimi
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Tüm sözleşmelerinizi tek yerden yönetin
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/contracts/service')}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Sözleşme
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Ana Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Servis Sözleşmeleri */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-200 cursor-pointer"
            onClick={() => navigate("/contracts/service")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Wrench className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Servis Sözleşmeleri</h2>
                    <p className="text-xs text-gray-500">Bakım ve servis</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/contracts/service");
                  }}
                >
                  Görüntüle
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Toplam</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Aktif</span>
                  <span className="font-semibold text-green-600">0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Araç Sözleşmeleri */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-purple-200 cursor-pointer"
            onClick={() => navigate("/contracts/vehicle")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Araç Sözleşmeleri</h2>
                    <p className="text-xs text-gray-500">Kiralama, sigorta, bakım</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/contracts/vehicle");
                  }}
                >
                  Görüntüle
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Toplam</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Aktif</span>
                  <span className="font-semibold text-green-600">{stats.active}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Müşteri Sözleşmeleri */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-orange-200 cursor-pointer"
            onClick={() => navigate("/contracts/customer")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Müşteri Sözleşmeleri</h2>
                    <p className="text-xs text-gray-500">Satış ve hizmet</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/contracts/customer");
                  }}
                >
                  Görüntüle
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Toplam</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Aktif</span>
                  <span className="font-semibold text-green-600">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Toplam Sözleşme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{stats.active} aktif</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Aktif Sözleşmeler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>Devam eden</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Yenilenecek
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.expiring}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 text-yellow-500" />
                <span>30 gün içinde</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-red-500" />
                Süresi Dolan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span>Yenileme gerekli</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Son Sözleşmeler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSignature className="h-5 w-5 text-indigo-500" />
                Son Eklenen Sözleşmeler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentContracts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSignature className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz sözleşme bulunmuyor</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate('/contracts/vehicle')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Sözleşmeyi Ekle
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/contracts/vehicle`)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{contract.contract_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {contractTypeLabels[contract.contract_type] || contract.contract_type} • {contract.provider_name}
                        </div>
                      </div>
                      {getStatusBadge(contract.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Yakında Sona Erecekler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.expiring === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-30 text-green-500" />
                  <p className="text-sm">Yakında sona erecek sözleşme yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vehicleContracts
                    .filter(c => {
                      if (!c.end_date) return false;
                      const endDate = new Date(c.end_date);
                      const now = new Date();
                      const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return diffDays <= 30 && diffDays > 0;
                    })
                    .slice(0, 5)
                    .map((contract) => {
                      const daysLeft = Math.ceil(
                        (new Date(contract.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <div
                          key={contract.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 cursor-pointer transition-colors"
                          onClick={() => navigate(`/contracts/vehicle`)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{contract.contract_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {contract.provider_name}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                            {daysLeft} gün kaldı
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

