import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  ArrowRightLeft, 
  Factory, 
  Warehouse,
  ClipboardList,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Plus,
  Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrency } from "@/utils/formatters";

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

interface InventoryDashboardProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const InventoryDashboard = ({ isCollapsed, setIsCollapsed }: InventoryDashboardProps) => {
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

  // Fetch inventory stats - optimized single query
  const { data: inventoryStats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-dashboard-stats', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return {
          totalProducts: 0,
          totalStockValue: 0,
          criticalStock: 0,
          totalWarehouses: 0,
          totalTransactions: 0,
          pendingTransactions: 0,
        };
      }

      // Parallel queries for better performance
      const [productsResult, warehousesResult, transactionsResult, criticalStockResult] = await Promise.all([
        // Products count and stock value
        supabase
          .from('products')
          .select('stock_quantity, price', { count: 'exact', head: false })
          .eq('company_id', userData.company_id)
          .eq('is_active', true),
        
        // Warehouses count
        supabase
          .from('warehouses')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', userData.company_id)
          .eq('is_active', true),
        
        // Transactions count and pending count
        supabase
          .from('inventory_transactions')
          .select('status', { count: 'exact', head: false })
          .eq('company_id', userData.company_id),
        
        // Critical stock count (products with stock <= min_stock_level)
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', userData.company_id)
          .eq('is_active', true)
          .not('min_stock_level', 'is', null)
          .gte('min_stock_level', 0),
      ]);

      // Calculate total stock value
      const products = productsResult.data || [];
      const totalStockValue = products.reduce((sum, p) => {
        const quantity = p.stock_quantity || 0;
        const price = p.price || 0;
        return sum + (quantity * price);
      }, 0);

      // Calculate critical stock (products where stock_quantity <= min_stock_level)
      // Fetch only products with min_stock_level set and check their stock
      const { data: productsWithMinLevel } = await supabase
        .from('products')
        .select('id, stock_quantity, min_stock_level')
        .eq('company_id', userData.company_id)
        .eq('is_active', true)
        .not('min_stock_level', 'is', null)
        .gte('min_stock_level', 0)
        .limit(1000); // Limit to prevent huge queries

      // Check if we need to get warehouse stock for these products
      let criticalStock = 0;
      if (productsWithMinLevel && productsWithMinLevel.length > 0) {
        const productIds = productsWithMinLevel.map(p => p.id);
        
        // Get warehouse stock totals for these products
        const { data: warehouseStock } = await supabase
          .from('warehouse_stock')
          .select('product_id, quantity')
          .in('product_id', productIds)
          .eq('company_id', userData.company_id);

        // Create stock map
        const stockMap = new Map<string, number>();
        warehouseStock?.forEach(ws => {
          const current = stockMap.get(ws.product_id) || 0;
          stockMap.set(ws.product_id, current + (ws.quantity || 0));
        });

        // Count critical products
        criticalStock = productsWithMinLevel.filter(p => {
          const totalStock = stockMap.get(p.id) || (p.stock_quantity || 0);
          const minLevel = p.min_stock_level || 0;
          return totalStock <= minLevel && minLevel > 0;
        }).length;
      }

      // Calculate pending transactions
      const transactions = transactionsResult.data || [];
      const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

      return {
        totalProducts: productsResult.count || 0,
        totalStockValue,
        criticalStock,
        totalWarehouses: warehousesResult.count || 0,
        totalTransactions: transactionsResult.count || 0,
        pendingTransactions,
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Use stats directly
  const stats = inventoryStats || {
    totalProducts: 0,
    totalStockValue: 0,
    criticalStock: 0,
    totalWarehouses: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
  };

  const loading = statsLoading;

  if (loading) {
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
      {/* Clean Header Section - Diğer dashboard'lar gibi */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-lg text-white shadow-lg">
              <Package className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Stok Yönetimi
              </h1>
              <p className="text-xs text-muted-foreground/70">
                Ürünler, stok hareketleri, üretim ve stok raporlarını yönetin
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
        {/* Ana Stok Yönetimi Kartları - Diğer dashboard'lar gibi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Ürünler Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-blue-200 cursor-pointer"
            onClick={() => navigate("/products")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Ürünler</h2>
                    <p className="text-xs text-gray-500">Ürün listesi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/products");
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
                  <span className="text-xs text-gray-600">Toplam Ürün</span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalProducts}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Aktif</span>
                    <span className="text-sm font-bold text-green-600">{stats.totalProducts}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stok Hareketleri Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-green-200 cursor-pointer"
            onClick={() => navigate("/inventory/transactions")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Stok Hareketleri</h2>
                    <p className="text-xs text-gray-500">Giriş, çıkış, transfer</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/inventory/transactions");
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
                  <span className="text-xs text-gray-600">Toplam İşlem</span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalTransactions}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Bekleyen</span>
                    <span className="text-sm font-bold text-orange-600">{stats.pendingTransactions}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stok Sayımları Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-purple-200 cursor-pointer"
            onClick={() => navigate("/inventory/counts")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Stok Sayımları</h2>
                    <p className="text-xs text-gray-500">Fiziksel sayım</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/inventory/counts");
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
                  <span className="text-xs text-gray-600">Durum</span>
                  <span className="text-sm font-bold text-gray-900">Aktif</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Yönetim</span>
                    <span className="text-sm font-bold text-green-600">Açık</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Depolar Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-orange-200 cursor-pointer"
            onClick={() => navigate("/inventory/warehouses")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Warehouse className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Depolar</h2>
                    <p className="text-xs text-gray-500">Depo yönetimi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/inventory/warehouses");
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
                  <span className="text-xs text-gray-600">Toplam Depo</span>
                  <span className="text-sm font-bold text-gray-900">{stats.totalWarehouses}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Aktif</span>
                    <span className="text-sm font-bold text-green-600">{stats.totalWarehouses}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Üretim Card */}
          <div
            className="group bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 hover:border-red-200 cursor-pointer"
            onClick={() => navigate("/production")}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <Factory className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Üretim</h2>
                    <p className="text-xs text-gray-500">İş emirleri</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/production");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </Button>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-xs font-normal text-red-600 bg-red-50 px-2 py-1 rounded">{dateLabel}</span>
              </div>

              {/* Summary Content */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Durum</span>
                  <span className="text-sm font-bold text-gray-900">Aktif</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Yönetim</span>
                    <span className="text-sm font-bold text-green-600">Açık</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* İstatistik Kartları - Modernize edilmiş */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Stock Value */}
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                Toplam Stok Değeri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalStockValue, 'TRY')}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span>Son güncelleme: Bugün</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Products */}
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-green-500" />
                Toplam Ürün
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.totalProducts}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Package className="h-3 w-3 text-green-500" />
                <span>Aktif ürünler</span>
              </div>
            </CardContent>
          </Card>

          {/* Critical Stock */}
          <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Kritik Stok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.criticalStock}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span>Düşük stoklu ürünler</span>
              </div>
            </CardContent>
          </Card>

          {/* Pending Transactions */}
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-yellow-500" />
                Bekleyen İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingTransactions}</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <ArrowRightLeft className="h-3 w-3 text-yellow-500" />
                <span>Onay bekleyen</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default InventoryDashboard;
