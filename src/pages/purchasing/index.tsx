import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Users,
  ShoppingCart,
  Package,
  FileCheck,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { usePurchaseRequests } from "@/hooks/usePurchasing";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { useNavigate } from "react-router-dom";
import StatusBadge from "@/components/common/StatusBadge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const PurchasingDashboard = () => {
  const navigate = useNavigate();
  const { data: requests, isLoading: requestsLoading } = usePurchaseRequests();
  const { data: orders, isLoading: ordersLoading } = usePurchaseOrders();

  // Calculate stats - memoized to prevent recalculation
  const stats = useMemo(() => {
    const prStats = {
      draft: requests?.filter((r) => r.status === "draft").length || 0,
      pending: requests?.filter((r) => r.status === "submitted").length || 0,
      approved: requests?.filter((r) => r.status === "approved").length || 0,
      rejected: requests?.filter((r) => r.status === "rejected").length || 0,
      total: requests?.length || 0,
    };

    const poStats = {
      draft: orders?.filter((o) => o.status === "draft").length || 0,
      pending: orders?.filter((o) => o.status === "submitted").length || 0,
      confirmed: orders?.filter((o) => o.status === "confirmed").length || 0,
      received: orders?.filter((o) => o.status === "received").length || 0,
      total: orders?.length || 0,
      totalValue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
    };

    return { prStats, poStats };
  }, [requests, orders]);

  // Recent items
  const recentRequests = useMemo(() => {
    return requests?.slice(0, 5) || [];
  }, [requests]);

  const recentOrders = useMemo(() => {
    return orders?.slice(0, 5) || [];
  }, [orders]);

  if (requestsLoading || ordersLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Dashboard yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Satın Alma Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Talep ve sipariş süreçlerinizi tek yerden yönetin
          </p>
        </div>
        <Button onClick={() => navigate("/suppliers")} variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          Tedarikçiler
        </Button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
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
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>Aktif süreçler</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
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
              <AlertCircle className="h-3 w-3 text-yellow-500" />
              <span>İnceleme gerekiyor</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
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

        {/* Total Value */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Toplam Değer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.poStats.totalValue.toLocaleString("tr-TR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{" "}
              ₺
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span>Bu ay</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Purchase Requests Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Satın Alma Talepleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <span className="font-medium">Taslak</span>
              </div>
              <Badge variant="outline" className="bg-gray-100">
                {stats.prStats.draft}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="font-medium">Onay Bekliyor</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {stats.prStats.pending}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">Onaylanan</span>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {stats.prStats.approved}
              </Badge>
            </div>

            <Button
              onClick={() => navigate("/purchase-requests")}
              variant="outline"
              className="w-full mt-4"
            >
              Tüm Talepleri Görüntüle
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Purchase Orders Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-500" />
              Satın Alma Siparişleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <span className="font-medium">Taslak</span>
              </div>
              <Badge variant="outline" className="bg-gray-100">
                {stats.poStats.draft}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="font-medium">Onayda</span>
              </div>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                {stats.poStats.pending}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Package className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="font-medium">Teslim Alındı</span>
              </div>
              <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                {stats.poStats.received}
              </Badge>
            </div>

            <Button
              onClick={() => navigate("/purchase-orders")}
              variant="outline"
              className="w-full mt-4"
            >
              Tüm Siparişleri Görüntüle
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="h-5 w-5" />
              Son Talepler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz talep bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/purchase-requests/${request.id}`)}
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

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Son Siparişler
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Henüz sipariş bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/purchase-orders/${order.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{order.order_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.supplier?.name} •{" "}
                        {order.total_amount.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ₺
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

      {/* Quick Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <AlertCircle className="h-5 w-5" />
            Hızlı Başlangıç
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-blue-900">Yeni Talep Oluştur</div>
                <p className="text-xs text-blue-700 mt-1">
                  Satın alma sürecinizi başlatın
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileCheck className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-indigo-900">Onayları Kontrol Edin</div>
                <p className="text-xs text-indigo-700 mt-1">
                  Bekleyen onayları inceleyin
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-sm text-purple-900">Sipariş Oluştur</div>
                <p className="text-xs text-purple-700 mt-1">
                  Onaylı taleplerden sipariş oluşturun
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(PurchasingDashboard);
