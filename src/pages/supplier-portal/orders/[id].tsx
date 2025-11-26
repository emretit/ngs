import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Calendar, 
  CreditCard, 
  MapPin,
  Package,
  Truck,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SupplierPortalLayout from '@/components/supplier-portal/SupplierPortalLayout';
import OrderTimeline from '@/components/supplier-portal/OrderTimeline';
import { usePortalOrder } from '@/hooks/useSupplierPortal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function SupplierPortalOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = usePortalOrder(id || '');

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: 'Gönderildi',
      confirmed: 'Onaylandı',
      shipped: 'Sevk Edildi',
      received: 'Teslim Alındı',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <SupplierPortalLayout>
        <div className="py-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Yükleniyor...
        </div>
      </SupplierPortalLayout>
    );
  }

  if (!order) {
    return (
      <SupplierPortalLayout>
        <div className="py-12 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-lg">Sipariş bulunamadı</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/supplier-portal/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Listeye Dön
          </Button>
        </div>
      </SupplierPortalLayout>
    );
  }

  return (
    <SupplierPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/supplier-portal/orders')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">{order.order_number}</h1>
                <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <p className="text-slate-500">Sipariş Detayı</p>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Sipariş Durumu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline currentStatus={order.status} />
          </CardContent>
        </Card>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                Sipariş Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Sipariş No:</span>
                <span className="font-medium">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sipariş Tarihi:</span>
                <span className="font-medium">
                  {order.order_date 
                    ? format(new Date(order.order_date), 'dd MMM yyyy', { locale: tr })
                    : '-'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beklenen Teslimat:</span>
                <span className="font-medium">
                  {order.expected_delivery_date 
                    ? format(new Date(order.expected_delivery_date), 'dd MMM yyyy', { locale: tr })
                    : 'Belirtilmemiş'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Para Birimi:</span>
                <span className="font-medium">{order.currency}</span>
              </div>
              {order.incoterm && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Incoterm:</span>
                  <span className="font-medium">{order.incoterm}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-600" />
                Ödeme Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Ara Toplam:</span>
                <span className="font-medium">
                  {(order.subtotal || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">KDV:</span>
                <span className="font-medium">
                  {(order.tax_total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Toplam:</span>
                <span className="font-bold text-blue-600">
                  {(order.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {order.currency}
                </span>
              </div>
              {order.payment_terms && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ödeme Koşulları:</span>
                    <span className="font-medium">{order.payment_terms}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Sipariş Kalemleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead className="text-center">Miktar</TableHead>
                    <TableHead>Birim</TableHead>
                    <TableHead className="text-right">Birim Fiyat</TableHead>
                    <TableHead className="text-center">KDV %</TableHead>
                    <TableHead className="text-center">İskonto %</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-center">Teslim Alınan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item, index) => {
                    const receivedPercentage = item.quantity > 0 
                      ? ((item.received_quantity || 0) / item.quantity) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell>{item.uom}</TableCell>
                        <TableCell className="text-right">
                          {(item.unit_price || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">{item.tax_rate || 0}%</TableCell>
                        <TableCell className="text-center">{item.discount_rate || 0}%</TableCell>
                        <TableCell className="text-right font-medium">
                          {(item.line_total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className={receivedPercentage === 100 ? 'text-emerald-600 font-medium' : ''}>
                              {item.received_quantity || 0} / {item.quantity}
                            </span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1">
                              <div 
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.min(receivedPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 whitespace-pre-wrap">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </SupplierPortalLayout>
  );
}

