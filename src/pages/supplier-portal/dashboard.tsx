import { memo, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ShoppingCart, 
  TrendingUp, 
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SupplierPortalLayout from '@/components/supplier-portal/SupplierPortalLayout';
import { usePortalDashboardStats, usePortalRFQs, usePortalOrders } from '@/hooks/useSupplierPortal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// Status Badge Component - Memoized
const StatusBadge = memo(({ status }: { status: string }) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = useMemo(() => ({
    invited: { label: 'Yanıt Bekliyor', variant: 'default' },
    quoted: { label: 'Teklif Verildi', variant: 'secondary' },
    sent: { label: 'Gönderildi', variant: 'default' },
    received: { label: 'Alındı', variant: 'secondary' },
    closed: { label: 'Kapatıldı', variant: 'outline' },
  }), []);
  
  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
});

StatusBadge.displayName = 'StatusBadge';

// Order Status Badge Component - Memoized
const OrderStatusBadge = memo(({ status }: { status: string }) => {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = useMemo(() => ({
    submitted: { label: 'Gönderildi', variant: 'default' },
    confirmed: { label: 'Onaylandı', variant: 'secondary' },
    shipped: { label: 'Sevk Edildi', variant: 'default' },
    received: { label: 'Teslim Alındı', variant: 'secondary' },
    completed: { label: 'Tamamlandı', variant: 'outline' },
  }), []);
  
  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
});

OrderStatusBadge.displayName = 'OrderStatusBadge';

const SupplierPortalDashboard = () => {
  const { data: stats, isLoading: statsLoading } = usePortalDashboardStats();
  const { data: rfqs, isLoading: rfqsLoading } = usePortalRFQs();
  const { data: orders, isLoading: ordersLoading } = usePortalOrders();

  // Memoized filtered data
  const pendingRFQs = useMemo(() => 
    rfqs?.filter(r => r.vendor_status === 'invited') || [], 
    [rfqs]
  );
  
  const recentOrders = useMemo(() => 
    orders?.slice(0, 5) || [], 
    [orders]
  );

  const getStatusBadge = useCallback((status: string) => {
    return <StatusBadge status={status} />;
  }, []);

  const getOrderStatusBadge = useCallback((status: string) => {
    return <OrderStatusBadge status={status} />;
  }, []);

  return (
    <SupplierPortalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500">Teklif taleplerinizi ve siparişlerinizi takip edin</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Bekleyen Talepler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {statsLoading ? '...' : stats?.pendingQuotes || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Yanıt bekliyor</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Aktif RFQ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">
                {statsLoading ? '...' : stats?.activeRFQs || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Toplam teklif talebi</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-500" />
                Kazanılan Siparişler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {statsLoading ? '...' : stats?.wonOrders || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Toplam sipariş</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                Toplam Değer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {statsLoading ? '...' : (stats?.totalOrderValue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
              </div>
              <p className="text-xs text-slate-500 mt-1">Sipariş tutarı</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending RFQs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Yanıt Bekleyen Talepler
              </CardTitle>
              <Link to="/supplier-portal/rfqs">
                <Button variant="ghost" size="sm" className="gap-1">
                  Tümü <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {rfqsLoading ? (
                <div className="py-8 text-center text-slate-500">Yükleniyor...</div>
              ) : pendingRFQs.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-300 mx-auto mb-2" />
                  <p className="text-slate-500">Bekleyen talep yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRFQs.slice(0, 5).map((rfq) => (
                    <Link
                      key={rfq.id}
                      to={`/supplier-portal/rfqs/${rfq.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{rfq.rfq_number}</p>
                        <p className="text-sm text-slate-500">
                          {rfq.lines?.length || 0} kalem • 
                          {rfq.due_date && ` Son: ${format(new Date(rfq.due_date), 'dd MMM', { locale: tr })}`}
                        </p>
                      </div>
                      {getStatusBadge(rfq.vendor_status || 'invited')}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                Son Siparişler
              </CardTitle>
              <Link to="/supplier-portal/orders">
                <Button variant="ghost" size="sm" className="gap-1">
                  Tümü <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="py-8 text-center text-slate-500">Yükleniyor...</div>
              ) : recentOrders.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">Henüz sipariş yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/supplier-portal/orders/${order.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{order.order_number}</p>
                        <p className="text-sm text-slate-500">
                          {order.total_amount?.toLocaleString('tr-TR')} {order.currency} • 
                          {order.order_date && ` ${format(new Date(order.order_date), 'dd MMM yyyy', { locale: tr })}`}
                        </p>
                      </div>
                      {getOrderStatusBadge(order.status)}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SupplierPortalLayout>
  );
};

export default memo(SupplierPortalDashboard);

