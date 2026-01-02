import React, { useState, useMemo } from 'react';
import { Plus, Search, Package, AlertTriangle, CheckCircle, Calendar, XCircle, TrendingUp, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { useQuery } from '@tanstack/react-query';
import { ServicePartsInventoryService } from '@/services/servicePartsInventoryService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useServiceEquipment, ServiceEquipment } from '@/hooks/useServiceEquipment';
import { useServiceWarranties, ServiceWarranty } from '@/hooks/useServiceWarranties';
import { formatDate } from '@/utils/dateUtils';
import { EquipmentDialog } from '@/components/service/dialogs/EquipmentDialog';
import { WarrantyDialog } from '@/components/service/dialogs/WarrantyDialog';
import { ConfirmationDialogComponent } from '@/components/ui/confirmation-dialog';

export default function ServiceAssetManagement() {
  const { userData } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('assets');
  const [assetSubTab, setAssetSubTab] = useState('all');
  const [warrantySubTab, setWarrantySubTab] = useState('all');

  // Dialog states
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [warrantyDialogOpen, setWarrantyDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<ServiceEquipment | null>(null);
  const [selectedWarranty, setSelectedWarranty] = useState<ServiceWarranty | null>(null);
  const [isDeleteEquipmentDialogOpen, setIsDeleteEquipmentDialogOpen] = useState(false);
  const [isDeleteWarrantyDialogOpen, setIsDeleteWarrantyDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<ServiceEquipment | null>(null);
  const [warrantyToDelete, setWarrantyToDelete] = useState<ServiceWarranty | null>(null);

  // Parts kullanım raporu için tarih filtreleri
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // Fetch data
  const { equipment, isLoading: equipmentLoading, deleteEquipment } = useServiceEquipment();
  const { warranties, isLoading: warrantiesLoading, deleteWarranty } = useServiceWarranties();

  // Parts kullanım raporu
  const { data: usageReport, isLoading: partsLoading } = useQuery({
    queryKey: ['parts-usage-report', userData?.company_id, startDate, endDate],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      return ServicePartsInventoryService.getPartsUsageReport(
        userData.company_id,
        startDate,
        endDate
      );
    },
    enabled: !!userData?.company_id && activeTab === 'parts',
  });

  // Filter equipment
  const filteredEquipment = useMemo(() => {
    let filtered = equipment;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(eq =>
        eq.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.customers?.company?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (assetSubTab !== 'all') {
      if (assetSubTab === 'active') {
        filtered = filtered.filter(eq => eq.status === 'active');
      } else if (assetSubTab === 'maintenance') {
        filtered = filtered.filter(eq => eq.status === 'in_repair');
      } else if (assetSubTab === 'warranty') {
        // Equipment with active warranty
        const equipmentWithWarranty = warranties
          .filter(w => w.status === 'active')
          .map(w => w.equipment_id);
        filtered = filtered.filter(eq => equipmentWithWarranty.includes(eq.id));
      }
    }

    return filtered;
  }, [equipment, searchQuery, assetSubTab, warranties]);

  // Filter warranties
  const filteredWarranties = useMemo(() => {
    let filtered = warranties;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(w =>
        w.service_equipment?.equipment_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.warranty_provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.warranty_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (warrantySubTab !== 'all') {
      filtered = filtered.filter(w => w.status === warrantySubTab);
    }

    return filtered;
  }, [warranties, searchQuery, warrantySubTab]);

  // Statistics
  const stats = useMemo(() => {
    const totalEquipment = equipment.length;
    const activeWarranties = warranties.filter(w => w.status === 'active').length;
    const expiringWarranties = warranties.filter(w => w.status === 'expiring_soon').length;
    const partsUsed = usageReport?.length || 0;

    return {
      totalEquipment,
      activeWarranties,
      expiringWarranties,
      partsUsed,
    };
  }, [equipment, warranties, usageReport]);

  // Handlers
  const handleAddEquipment = () => {
    setSelectedEquipment(null);
    setEquipmentDialogOpen(true);
  };

  const handleEditEquipment = (eq: ServiceEquipment) => {
    setSelectedEquipment(eq);
    setEquipmentDialogOpen(true);
  };

  const handleDeleteEquipment = (eq: ServiceEquipment) => {
    setEquipmentToDelete(eq);
    setIsDeleteEquipmentDialogOpen(true);
  };

  const handleDeleteEquipmentConfirm = async () => {
    if (equipmentToDelete) {
      deleteEquipment.mutate(equipmentToDelete.id);
      setIsDeleteEquipmentDialogOpen(false);
      setEquipmentToDelete(null);
    }
  };

  const handleDeleteEquipmentCancel = () => {
    setIsDeleteEquipmentDialogOpen(false);
    setEquipmentToDelete(null);
  };

  const handleAddWarranty = () => {
    setSelectedWarranty(null);
    setWarrantyDialogOpen(true);
  };

  const handleEditWarranty = (warranty: ServiceWarranty) => {
    setSelectedWarranty(warranty);
    setWarrantyDialogOpen(true);
  };

  const handleDeleteWarranty = (warranty: ServiceWarranty) => {
    setWarrantyToDelete(warranty);
    setIsDeleteWarrantyDialogOpen(true);
  };

  const handleDeleteWarrantyConfirm = async () => {
    if (warrantyToDelete) {
      deleteWarranty.mutate(warrantyToDelete.id);
      setIsDeleteWarrantyDialogOpen(false);
      setWarrantyToDelete(null);
    }
  };

  const handleDeleteWarrantyCancel = () => {
    setIsDeleteWarrantyDialogOpen(false);
    setWarrantyToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: 'Aktif', className: 'bg-green-100 text-green-800 border-green-200' },
      in_repair: { label: 'Bakımda', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      retired: { label: 'Kullanım Dışı', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      disposed: { label: 'İmha Edildi', className: 'bg-red-100 text-red-800 border-red-200' },
      expiring_soon: { label: 'Bitecek', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      expired: { label: 'Süresi Bitti', className: 'bg-red-100 text-red-800 border-red-200' },
    };
    const variant = variants[status] || variants.active;
    return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Varlık Yönetimi</h1>
          <p className="text-muted-foreground">Cihaz, garanti ve parça yönetimi</p>
        </div>
        <Button onClick={activeTab === 'assets' ? handleAddEquipment : activeTab === 'warranties' ? handleAddWarranty : undefined}>
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'assets' ? 'Yeni Cihaz' : activeTab === 'warranties' ? 'Yeni Garanti' : 'Yeni Parça'}
        </Button>
      </div>

      {/* Birleşik İstatistikler */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Cihaz</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEquipment}</div>
            <p className="text-xs text-muted-foreground">Kayıtlı cihaz</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Garantiler</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWarranties}</div>
            <p className="text-xs text-muted-foreground">Geçerli garanti</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bitecek Garantiler</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiringWarranties}</div>
            <p className="text-xs text-muted-foreground">30 gün içinde</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parça Çeşidi</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partsUsed}</div>
            <p className="text-xs text-muted-foreground">Bu ay kullanılan</p>
          </CardContent>
        </Card>
      </div>

      {/* Ana Tab Yapısı */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Cihazlar
          </TabsTrigger>
          <TabsTrigger value="warranties" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Garantiler
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Parça Kullanımı
          </TabsTrigger>
        </TabsList>

        {/* Cihazlar Tab */}
        <TabsContent value="assets" className="space-y-4 mt-6">
          {/* Arama */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cihaz ara (model, seri no, müşteri)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cihaz Alt Tabları */}
          <Tabs value={assetSubTab} onValueChange={setAssetSubTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">Tümü ({equipment.length})</TabsTrigger>
              <TabsTrigger value="active">Aktif ({equipment.filter(e => e.status === 'active').length})</TabsTrigger>
              <TabsTrigger value="maintenance">Bakımda ({equipment.filter(e => e.status === 'in_repair').length})</TabsTrigger>
              <TabsTrigger value="warranty">Garantili</TabsTrigger>
            </TabsList>

            <TabsContent value={assetSubTab} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cihazlar</CardTitle>
                  <CardDescription>{filteredEquipment.length} cihaz bulundu</CardDescription>
                </CardHeader>
                <CardContent>
                  {equipmentLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredEquipment.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Henüz cihaz eklenmemiş</h3>
                      <p className="text-muted-foreground mb-4">
                        Müşteri cihazlarını takip etmek için yeni bir cihaz ekleyin.
                      </p>
                      <Button onClick={handleAddEquipment}>
                        <Plus className="h-4 w-4 mr-2" />
                        İlk Cihazı Ekle
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cihaz Adı</TableHead>
                          <TableHead>Marka/Model</TableHead>
                          <TableHead>Seri No</TableHead>
                          <TableHead>Müşteri</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Konum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEquipment.map((eq) => (
                          <TableRow key={eq.id}>
                            <TableCell className="font-medium">{eq.equipment_name}</TableCell>
                            <TableCell>{eq.brand} {eq.model}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {eq.serial_number || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>{eq.customers?.company || eq.customers?.name || '-'}</TableCell>
                            <TableCell>{getStatusBadge(eq.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{eq.location || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditEquipment(eq)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteEquipment(eq)} className="text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Garantiler Tab */}
        <TabsContent value="warranties" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Garanti ara (müşteri, cihaz, seri no)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs value={warrantySubTab} onValueChange={setWarrantySubTab} className="w-full">
            <TabsList>
              <TabsTrigger value="all">Tümü ({warranties.length})</TabsTrigger>
              <TabsTrigger value="active">Aktif ({warranties.filter(w => w.status === 'active').length})</TabsTrigger>
              <TabsTrigger value="expiring_soon">Bitecek ({warranties.filter(w => w.status === 'expiring_soon').length})</TabsTrigger>
              <TabsTrigger value="expired">Süresi Biten ({warranties.filter(w => w.status === 'expired').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={warrantySubTab} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Garantiler</CardTitle>
                  <CardDescription>{filteredWarranties.length} garanti bulundu</CardDescription>
                </CardHeader>
                <CardContent>
                  {warrantiesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredWarranties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Henüz garanti kaydı eklenmemiş</h3>
                      <p className="text-muted-foreground mb-4">
                        Cihaz garantilerini takip etmek için yeni bir garanti kaydı ekleyin.
                      </p>
                      <Button onClick={handleAddWarranty}>
                        <Plus className="h-4 w-4 mr-2" />
                        İlk Garanti Kaydını Ekle
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cihaz</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead>Sağlayıcı</TableHead>
                          <TableHead>Başlangıç</TableHead>
                          <TableHead>Bitiş</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWarranties.map((warranty) => (
                          <TableRow key={warranty.id}>
                            <TableCell className="font-medium">
                              {warranty.service_equipment?.equipment_name}
                              <div className="text-xs text-muted-foreground">
                                {warranty.service_equipment?.brand} {warranty.service_equipment?.model}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {warranty.warranty_type === 'manufacturer' ? 'Üretici' :
                                 warranty.warranty_type === 'extended' ? 'Uzatılmış' : 'Servis Sözleşmesi'}
                              </Badge>
                            </TableCell>
                            <TableCell>{warranty.warranty_provider || '-'}</TableCell>
                            <TableCell className="text-sm">{formatDate(warranty.start_date)}</TableCell>
                            <TableCell className="text-sm">{formatDate(warranty.end_date)}</TableCell>
                            <TableCell>{getStatusBadge(warranty.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditWarranty(warranty)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteWarranty(warranty)} className="text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Parça Kullanımı Tab - Aynı Kalıyor */}
        <TabsContent value="parts" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1.5 block">Başlangıç Tarihi</label>
                  <DatePicker date={startDate} onSelect={setStartDate} className="w-full" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1.5 block">Bitiş Tarihi</label>
                  <DatePicker date={endDate} onSelect={setEndDate} className="w-full" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                    setEndDate(new Date());
                  }}
                >
                  Bu Ay
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <span>Parça Kullanım Raporu</span>
                <Badge variant="outline">{usageReport?.length || 0} ürün</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : usageReport && usageReport.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün Adı</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Toplam Kullanım</TableHead>
                      <TableHead className="text-center">Kullanım Sayısı</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageReport.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{item.sku || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{item.totalQuantity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{item.usageCount} servis</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Bu dönemde parça kullanımı bulunamadı</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EquipmentDialog
        open={equipmentDialogOpen}
        onOpenChange={setEquipmentDialogOpen}
        equipment={selectedEquipment}
      />
      <WarrantyDialog
        open={warrantyDialogOpen}
        onOpenChange={setWarrantyDialogOpen}
        warranty={selectedWarranty}
        equipment={equipment}
      />

      {/* Delete Equipment Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteEquipmentDialogOpen}
        onOpenChange={setIsDeleteEquipmentDialogOpen}
        title="Cihazı Sil"
        description={
          equipmentToDelete
            ? `"${equipmentToDelete.equipment_name}" cihazını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu cihazı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteEquipmentConfirm}
        onCancel={handleDeleteEquipmentCancel}
        isLoading={deleteEquipment.isPending}
      />

      {/* Delete Warranty Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteWarrantyDialogOpen}
        onOpenChange={setIsDeleteWarrantyDialogOpen}
        title="Garanti Kaydını Sil"
        description={
          warrantyToDelete
            ? `"${warrantyToDelete.service_equipment?.equipment_name}" cihazının garanti kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu garanti kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteWarrantyConfirm}
        onCancel={handleDeleteWarrantyCancel}
        isLoading={deleteWarranty.isPending}
      />
    </div>
  );
}
