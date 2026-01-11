import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  CheckCircle,
  PackageCheck,
  Users,
  ShoppingCart,
  Package,
  MessageSquare,
  ClipboardCheck,
  Receipt,
  DollarSign,
  ArrowRight,
  Plus,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "@/components/common/StatusBadge";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { formatCurrency } from "@/utils/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const MONTHS = [
  { value: "all", label: "Tüm Aylar" },
  { value: "1", label: "Ocak" },
  { value: "2", label: "Şubat" },
  { value: "3", label: "Mart" },
  { value: "4", label: "Nisan" },
  { value: "5", label: "Mayıs" },
  { value: "6", label: "Haziran" },
  { value: "7", label: "Temmuz" },
  { value: "8", label: "Ağustos" },
  { value: "9", label: "Eylül" },
  { value: "10", label: "Ekim" },
  { value: "11", label: "Kasım" },
  { value: "12", label: "Aralık" }
];

const PurchasingDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useCurrentUser();
  const currentYear = new Date().getFullYear();
  const currentMonthNum = new Date().getMonth() + 1;
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthNum.toString());

  // Generate years (5 years back, current year, 2 years forward)
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  const selectedMonthName = selectedMonth === "all"
    ? "Tüm Aylar"
    : MONTHS.find(m => m.value === selectedMonth)?.label || "";

  const dateLabel = `${selectedYear} - ${selectedMonthName}`;

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

      // Parallel queries for better performance - only fetch necessary fields
      const [prResult, poResult, rfqResult, invoiceResult] = await Promise.all([
        // Purchase Requests - only status field
        supabase
          .from('purchase_requests')
          .select('status', { count: 'exact', head: false })
          .eq('company_id', userData.company_id),
        
        // Purchase Orders - only status and total_amount
        supabase
          .from('purchase_orders')
          .select('status, total_amount', { count: 'exact', head: false })
          .eq('company_id', userData.company_id),
        
        // RFQs - only status field
        supabase
          .from('rfqs')
          .select('status', { count: 'exact', head: false })
          .eq('company_id', userData.company_id),
        
        // Vendor Invoices - only payment_status and total_amount
        supabase
          .from('supplier_invoices')
          .select('payment_status, total_amount', { count: 'exact', head: false })
          .eq('company_id', userData.company_id),
      ]);

      // Calculate PR stats
      const prs = prResult.data || [];
      const prStats = {
        draft: prs.filter((r: any) => r.status === "draft").length,
        pending: prs.filter((r: any) => r.status === "submitted").length,
        approved: prs.filter((r: any) => r.status === "approved").length,
        rejected: prs.filter((r: any) => r.status === "rejected").length,
        total: prResult.count || 0,
      };

      // Calculate PO stats
      const pos = poResult.data || [];
      const poStats = {
        draft: pos.filter((o: any) => o.status === "draft").length,
        pending: pos.filter((o: any) => o.status === "submitted").length,
        confirmed: pos.filter((o: any) => o.status === "confirmed").length,
        received: pos.filter((o: any) => o.status === "received").length,
        total: poResult.count || 0,
        totalValue: pos.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0),
      };

      // Calculate RFQ stats
      const rfqs = rfqResult.data || [];
      const rfqStats = {
        active: rfqs.filter((r: any) => r.status === "open" || r.status === "sent").length,
        pending: rfqs.filter((r: any) => r.status === "open").length,
        completed: rfqs.filter((r: any) => r.status === "closed" || r.status === "awarded").length,
        total: rfqResult.count || 0,
      };

      // Calculate Invoice stats
      const invoices = invoiceResult.data || [];
      const invoiceStats = {
        total: invoiceResult.count || 0,
        unpaid: invoices.filter((inv: any) => inv.payment_status === "unpaid" || inv.payment_status === "partial").length,
        totalAmount: invoices.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0),
      };

      return { prStats, poStats, rfqStats, invoiceStats };
    },
    enabled: !!userData?.company_id,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch recent items separately (lazy loading - only when needed)
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ['purchasing-dashboard-recent', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return { recentRequests: [], recentOrders: [] };
      }

      // Fetch only recent items with minimal fields
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
    enabled: !!userData?.company_id && !statsLoading, // Only fetch after stats are loaded
    staleTime: 60000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Use stats directly
  const stats = dashboardStats || {
    prStats: { draft: 0, pending: 0, approved: 0, rejected: 0, total: 0 },
    poStats: { draft: 0, pending: 0, confirmed: 0, received: 0, total: 0, totalValue: 0 },
    rfqStats: { active: 0, pending: 0, completed: 0, total: 0 },
    invoiceStats: { total: 0, unpaid: 0, totalAmount: 0 },
  };

  const recentRequests = recentData?.recentRequests || [];
  const recentOrders = recentData?.recentOrders || [];

  if (statsLoading) {
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
    <>
      {/* Clean Header Section - Fatura yönetimi gibi */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg text-white shadow-lg">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Satın Alma Yönetimi
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Tüm satın alma işlemlerinizi takip edin ve yönetin
              </p>
            </div>
          </div>

          {/* Year and Month Selectors */}
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ay Seçin" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Ana Satın Alma Kartları - Fatura yönetimi gibi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Satın Alma Talepleri Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-200 cursor-pointer"
            onClick={() => navigate("/purchasing/requests")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Satın Alma Talepleri</h2>
                    <p className="text-xs text-gray-500">İç talep süreçleri</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/purchasing/requests/new");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Toplam Talep</span>
                  <span className="text-sm font-bold text-gray-900">{stats.prStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Bekleyen Onay</span>
                  <span className="text-sm font-bold text-orange-600">{stats.prStats.pending}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Onaylanan</span>
                    <span className="text-sm font-bold text-green-600">{stats.prStats.approved}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Teklif İstekleri (RFQ) Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-purple-200 cursor-pointer"
            onClick={() => navigate("/purchasing/rfqs")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Teklif İstekleri</h2>
                    <p className="text-xs text-gray-500">RFQ süreçleri</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/purchasing/rfqs/new");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-purple-600 bg-purple-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Aktif RFQ</span>
                  <span className="text-sm font-bold text-gray-900">{stats.rfqStats.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Bekleyen Teklif</span>
                  <span className="text-sm font-bold text-orange-600">{stats.rfqStats.pending}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Tamamlanan</span>
                    <span className="text-sm font-bold text-green-600">{stats.rfqStats.completed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Satın Alma Siparişleri Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-green-200 cursor-pointer"
            onClick={() => navigate("/purchasing/orders")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Satın Alma Siparişleri</h2>
                    <p className="text-xs text-gray-500">PO süreçleri</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/purchasing/orders/new");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Toplam Sipariş</span>
                  <span className="text-sm font-bold text-gray-900">{stats.poStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Onayda</span>
                  <span className="text-sm font-bold text-orange-600">{stats.poStats.pending}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam Tutar</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(stats.poStats.totalValue, 'TRY')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tedarikçi Faturaları Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-orange-200 cursor-pointer"
            onClick={() => navigate("/purchasing/invoices")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Tedarikçi Faturaları</h2>
                    <p className="text-xs text-gray-500">Gelen faturalar</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/purchasing/invoices/new");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-orange-600 bg-orange-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Toplam Fatura</span>
                  <span className="text-sm font-bold text-gray-900">{stats.invoiceStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Ödenmemiş</span>
                  <span className="text-sm font-bold text-orange-600">{stats.invoiceStats.unpaid}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Toplam Tutar</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(stats.invoiceStats.totalAmount, 'TRY')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları - Modernize edilmiş */}
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
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{stats.prStats.approved} onaylı</span>
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
                <Clock className="h-3 w-3 text-yellow-500" />
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
          {/* Recent Requests */}
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
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
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

          {/* Recent Orders */}
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
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
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
    </>
  );
};

export default React.memo(PurchasingDashboard);
