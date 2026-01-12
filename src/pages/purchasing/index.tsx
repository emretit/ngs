import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Clock,
  CheckCircle,
  PackageCheck,
  ShoppingCart,
  Package,
  MessageSquare,
  Receipt,
  DollarSign,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "@/components/common/StatusBadge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { formatCurrency } from "@/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ModuleDashboard, ModuleDashboardConfig, QuickLinkCardConfig } from "@/components/module-dashboard";

const PurchasingDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useCurrentUser();

  // Optimized single query for dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['purchasing-dashboard-stats', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return {
          prStats: { draft: 0, pending: 0, approved: 0, rejected: 0, total: 0 },
          poStats: { draft: 0, pending: 0, confirmed: 0, received: 0, total: 0, totalValue: 0 },
          rfqStats: { active: 0, pending: 0, completed: 0, total: 0 },
          invoiceStats: { total: 0, unpaid: 0, totalAmount: 0 },
        };
      }

      const [prResult, poResult, rfqResult, invoiceResult] = await Promise.all([
        supabase
          .from('purchase_requests')
          .select('status', { count: 'exact', head: false }),
        supabase
          .from('purchase_orders')
          .select('status, total_amount', { count: 'exact', head: false })
          .eq('company_id', userData.company_id),
        supabase
          .from('rfqs')
          .select('status', { count: 'exact', head: false }),
        supabase
          .from('supplier_invoices')
          .select('payment_status, total_amount', { count: 'exact', head: false }),
      ]);

      const prs = prResult.data || [];
      const prStats = {
        draft: prs.filter((r: any) => r.status === "draft").length,
        pending: prs.filter((r: any) => r.status === "submitted").length,
        approved: prs.filter((r: any) => r.status === "approved").length,
        rejected: prs.filter((r: any) => r.status === "rejected").length,
        total: prResult.count || 0,
      };

      const pos = poResult.data || [];
      const poStats = {
        draft: pos.filter((o: any) => o.status === "draft").length,
        pending: pos.filter((o: any) => o.status === "submitted").length,
        confirmed: pos.filter((o: any) => o.status === "confirmed").length,
        received: pos.filter((o: any) => o.status === "received").length,
        total: poResult.count || 0,
        totalValue: pos.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
      };

      const rfqs = rfqResult.data || [];
      const rfqStats = {
        active: rfqs.filter((r: any) => r.status === "open" || r.status === "sent").length,
        pending: rfqs.filter((r: any) => r.status === "open").length,
        completed: rfqs.filter((r: any) => r.status === "closed" || r.status === "awarded").length,
        total: rfqResult.count || 0,
      };

      const invoices = invoiceResult.data || [];
      const invoiceStats = {
        total: invoiceResult.count || 0,
        unpaid: invoices.filter((inv: any) => inv.payment_status === "unpaid" || inv.payment_status === "partial").length,
        totalAmount: invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0),
      };

      return { prStats, poStats, rfqStats, invoiceStats };
    },
    enabled: !!userData?.company_id,
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch recent items separately
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['purchasing-dashboard-recent', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return { recentRequests: [], recentOrders: [] };
      }

      const [recentRequestsResult, recentOrdersResult] = await Promise.all([
        supabase
          .from('purchase_requests')
          .select('id, request_number, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('purchase_orders')
          .select('id, order_number, status, total_amount, supplier_id, suppliers!purchase_orders_supplier_id_fkey(name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      return {
        recentRequests: recentRequestsResult.data || [],
        recentOrders: (recentOrdersResult.data || []).map((order: any) => ({
          ...order,
          supplier: order.suppliers ? { name: order.suppliers.name } : null,
        })),
      };
    },
    enabled: !!userData?.company_id && !statsLoading,
    staleTime: 60000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const stats = dashboardStats || {
    prStats: { draft: 0, pending: 0, approved: 0, rejected: 0, total: 0 },
    poStats: { draft: 0, pending: 0, confirmed: 0, received: 0, total: 0, totalValue: 0 },
    rfqStats: { active: 0, pending: 0, completed: 0, total: 0 },
    invoiceStats: { total: 0, unpaid: 0, totalAmount: 0 },
  };

  const recentRequests = recentData?.recentRequests || [];
  const recentOrders = recentData?.recentOrders || [];

  const cards: QuickLinkCardConfig[] = [
    {
      id: "purchase-requests",
      title: "Satın Alma Talepleri",
      subtitle: "İç talep süreçleri",
      icon: FileText,
      color: "blue",
      href: "/purchasing/requests",
      newButton: { href: "/purchasing/requests/new" },
      stats: [
        { label: "Toplam Talep", value: stats.prStats.total },
        { label: "Bekleyen Onay", value: stats.prStats.pending, color: "warning" },
      ],
      footerStat: {
        label: "Onaylanan",
        value: stats.prStats.approved,
        color: "success",
      },
    },
    {
      id: "rfqs",
      title: "Teklif İstekleri",
      subtitle: "RFQ süreçleri",
      icon: MessageSquare,
      color: "purple",
      href: "/purchasing/rfqs",
      newButton: { href: "/purchasing/rfqs/new" },
      stats: [
        { label: "Aktif RFQ", value: stats.rfqStats.active },
        { label: "Bekleyen Teklif", value: stats.rfqStats.pending, color: "warning" },
      ],
      footerStat: {
        label: "Tamamlanan",
        value: stats.rfqStats.completed,
        color: "success",
      },
    },
    {
      id: "purchase-orders",
      title: "Satın Alma Siparişleri",
      subtitle: "PO süreçleri",
      icon: ShoppingCart,
      color: "green",
      href: "/purchasing/orders",
      newButton: { href: "/purchasing/orders/new" },
      stats: [
        { label: "Toplam Sipariş", value: stats.poStats.total },
        { label: "Onayda", value: stats.poStats.pending, color: "warning" },
      ],
      footerStat: {
        label: "Toplam Tutar",
        value: formatCurrency(stats.poStats.totalValue, 'TRY'),
        color: "success",
      },
    },
    {
      id: "supplier-invoices",
      title: "Tedarikçi Faturaları",
      subtitle: "Gelen faturalar",
      icon: Receipt,
      color: "orange",
      href: "/purchasing/invoices",
      newButton: { href: "/purchasing/invoices/new" },
      stats: [
        { label: "Toplam Fatura", value: stats.invoiceStats.total },
        { label: "Ödenmemiş", value: stats.invoiceStats.unpaid, color: "warning" },
      ],
      footerStat: {
        label: "Toplam Tutar",
        value: formatCurrency(stats.invoiceStats.totalAmount, 'TRY'),
        color: "success",
      },
    },
  ];

  const config: ModuleDashboardConfig = {
    header: {
      title: "Satın Alma Yönetimi",
      subtitle: "Tüm satın alma işlemlerinizi takip edin ve yönetin",
      icon: PackageCheck,
    },
    cards,
    additionalContent: (
      <div className="space-y-6">
        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Toplam Talepler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.prStats.total}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{stats.prStats.approved} onaylı</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Bekleyen Onaylar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.prStats.pending}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span>İnceleme gerekiyor</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-indigo-500" />
                Toplam Siparişler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{stats.poStats.total}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Package className="h-3 w-3 text-indigo-500" />
                <span>{stats.poStats.confirmed} onaylı</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Toplam Değer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.poStats.totalValue, 'TRY')}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3 text-green-500" />
                <span>Bu ay</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-500" />
                Son Talepler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Yükleniyor...</p>
                </div>
              ) : recentRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz talep bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/purchasing/requests/${request.id}`)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{request.request_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {request.created_at &&
                            format(new Date(request.created_at), "dd MMM yyyy", { locale: tr })}
                        </div>
                      </div>
                      <StatusBadge status={request.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5 text-green-500" />
                Son Siparişler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Yükleniyor...</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Henüz sipariş bulunmuyor</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/purchasing/orders/${order.id}`)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{order.order_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.supplier?.name} •{" "}
                          {formatCurrency(order.total_amount, 'TRY')}
                        </div>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  };

  return <ModuleDashboard config={config} isLoading={statsLoading} gridCols={4} />;
};

export default React.memo(PurchasingDashboard);
