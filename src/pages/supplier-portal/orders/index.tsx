import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package,
  Eye 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SupplierPortalLayout from '@/components/supplier-portal/SupplierPortalLayout';
import { usePortalOrders } from '@/hooks/useSupplierPortal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function SupplierPortalOrders() {
  const { data: orders, isLoading } = usePortalOrders();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { 
      label: string; 
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      icon: React.ReactNode;
    }> = {
      submitted: { 
        label: 'Gönderildi', 
        variant: 'default',
        icon: <Clock className="w-3 h-3 mr-1" />
      },
      confirmed: { 
        label: 'Onaylandı', 
        variant: 'secondary',
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      },
      shipped: { 
        label: 'Sevk Edildi', 
        variant: 'default',
        icon: <Truck className="w-3 h-3 mr-1" />
      },
      received: { 
        label: 'Teslim Alındı', 
        variant: 'secondary',
        icon: <Package className="w-3 h-3 mr-1" />
      },
      completed: { 
        label: 'Tamamlandı', 
        variant: 'outline',
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      },
      cancelled: { 
        label: 'İptal', 
        variant: 'destructive',
        icon: null
      },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline', icon: null };
    
    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Group orders by status
  const activeOrders = orders?.filter(o => ['submitted', 'confirmed', 'shipped'].includes(o.status)) || [];
  const completedOrders = orders?.filter(o => ['received', 'completed'].includes(o.status)) || [];

  return (
    <SupplierPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Siparişler
          </h1>
          <p className="text-slate-500">Size verilen siparişleri takip edin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Aktif Siparişler</p>
                  <p className="text-2xl font-bold text-slate-800">{activeOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tamamlanan</p>
                  <p className="text-2xl font-bold text-slate-800">{completedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Toplam Sipariş</p>
                  <p className="text-2xl font-bold text-slate-800">{orders?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tüm Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Yükleniyor...
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-lg">Henüz sipariş yok</p>
                <p className="text-slate-400 text-sm">Teklifleriniz kabul edildiğinde siparişler burada görünecek.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sipariş No</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Kalem Sayısı</TableHead>
                      <TableHead>Beklenen Teslimat</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          {order.order_date 
                            ? format(new Date(order.order_date), 'dd MMM yyyy', { locale: tr })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{order.items?.length || 0} kalem</TableCell>
                        <TableCell>
                          {order.expected_delivery_date 
                            ? format(new Date(order.expected_delivery_date), 'dd MMM yyyy', { locale: tr })
                            : <span className="text-slate-400">Belirtilmemiş</span>
                          }
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(order.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/supplier-portal/orders/${order.id}`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              <Eye className="w-4 h-4" />
                              Detay
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SupplierPortalLayout>
  );
}

