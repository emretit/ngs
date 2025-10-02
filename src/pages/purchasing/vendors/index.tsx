import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Download, Star, MoreVertical, Pencil, Eye, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVendors, useToggleVendorStatus, type Vendor } from '@/hooks/useVendors';
import { VendorFormDrawer } from '@/components/purchasing/VendorFormDrawer';
import { format } from 'date-fns';

const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP'];

export default function VendorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters from query params
  const search = searchParams.get('search') || '';
  const activeFilter = searchParams.get('active');
  const currency = searchParams.get('currency') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';

  const { data: vendors = [], isLoading } = useVendors({
    search,
    is_active: activeFilter ? activeFilter === 'true' : undefined,
    currency: currency || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const toggleStatus = useToggleVendorStatus();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const handleOpenDrawer = (vendor?: Vendor) => {
    setSelectedVendor(vendor);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedVendor(undefined);
  };

  const handleToggleStatus = async (vendor: Vendor) => {
    await toggleStatus.mutateAsync({
      id: vendor.id,
      is_active: !vendor.is_active,
    });
  };

  const handleExportCSV = () => {
    if (vendors.length === 0) return;

    const headers = [
      'Kod',
      'İsim',
      'Değerlendirme',
      'Şehir',
      'Ülke',
      'Para Birimi',
      'Ödeme Şartları',
      'Etiketler',
      'Aktif',
      'Güncellenme',
    ];

    const rows = vendors.map(v => [
      v.code || '',
      v.name,
      v.rating?.toString() || '0',
      v.city || '',
      v.country || '',
      v.currency,
      v.payment_terms || '',
      v.tags?.join('; ') || '',
      v.is_active ? 'Evet' : 'Hayır',
      format(new Date(v.updated_at), 'dd.MM.yyyy'),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tedarikciler_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tedarikçiler</h1>
          <p className="text-muted-foreground">
            Tedarikçi bilgilerini yönetin
          </p>
        </div>
        <Button onClick={() => handleOpenDrawer()}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Tedarikçi
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Kod veya isimde ara..."
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
            />
          </div>

          <Select
            value={activeFilter || 'all'}
            onValueChange={(value) =>
              updateParam('active', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="true">Aktif</SelectItem>
              <SelectItem value="false">Pasif</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currency}
            onValueChange={(value) =>
              updateParam('currency', value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Para Birimi" />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">Tümü</SelectItem>
              {CURRENCIES.map(curr => (
                <SelectItem key={curr} value={curr}>
                  {curr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV İndir
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm text-muted-foreground">Başlangıç</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => updateParam('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Bitiş</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => updateParam('endDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border">
        {isLoading ? (
          <div className="text-center py-12">Yükleniyor...</div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Tedarikçi bulunamadı
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead>Değerlendirme</TableHead>
                <TableHead>Şehir/Ülke</TableHead>
                <TableHead>Para Birimi</TableHead>
                <TableHead>Ödeme Şartları</TableHead>
                <TableHead>Etiketler</TableHead>
                <TableHead>Aktif</TableHead>
                <TableHead>Güncellenme</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.code || '-'}</TableCell>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{renderStars(vendor.rating)}</TableCell>
                  <TableCell>
                    {vendor.city || '-'} / {vendor.country || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{vendor.currency}</Badge>
                  </TableCell>
                  <TableCell>
                    {vendor.payment_terms_days
                      ? `${vendor.payment_terms_days} gün`
                      : vendor.payment_terms || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {vendor.tags?.slice(0, 2).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {vendor.tags && vendor.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{vendor.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                      {vendor.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(vendor.updated_at), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background z-50">
                        <DropdownMenuItem onClick={() => handleOpenDrawer(vendor)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Görüntüle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(vendor)}>
                          <Power className="h-4 w-4 mr-2" />
                          {vendor.is_active ? 'Devre Dışı Bırak' : 'Aktif Et'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <VendorFormDrawer
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        vendor={selectedVendor}
      />
    </div>
  );
}
