import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Package, TrendingUp, TrendingDown, AlertTriangle, Boxes, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Treemap
} from "recharts";

interface ReportsInventorySectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ReportsInventorySection({ isExpanded, onToggle, searchParams }: ReportsInventorySectionProps) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const { data: stockValue } = useQuery({
    queryKey: ['stockValue'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single();
      if (!profile?.company_id) return { totalValue: 0, totalCost: 0, profit: 0, productCount: 0 };

      const { data: products } = await supabase.from('products').select('id, price, purchase_price');
      if (!products?.length) return { totalValue: 0, totalCost: 0, profit: 0, productCount: 0 };

      const { data: stockData } = await supabase.from('warehouse_stock').select('product_id, quantity').in('product_id', products.map(p => p.id));

      const stockMap = new Map<string, number>();
      stockData?.forEach((s: any) => stockMap.set(s.product_id, (stockMap.get(s.product_id) || 0) + Number(s.quantity || 0)));

      const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (stockMap.get(p.id) || 0)), 0);
      const totalCost = products.reduce((sum, p) => sum + ((p.purchase_price || 0) * (stockMap.get(p.id) || 0)), 0);

      return { totalValue, totalCost, profit: totalValue - totalCost, productCount: products.length };
    },
    enabled: isExpanded
  });

  const { data: categoryDistribution } = useQuery({
    queryKey: ['categoryDistribution'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single();
      if (!profile?.company_id) return [];

      const { data: products } = await supabase.from('products').select('category_id, price, product_categories(name)');

      const catData = (products || []).reduce((acc: Record<string, { name: string; value: number }>, p) => {
        const catName = (p.product_categories as any)?.name || 'Diğer';
        if (!acc[catName]) acc[catName] = { name: catName, value: 0 };
        acc[catName].value += p.price || 0;
        return acc;
      }, {});

      return (Object.values(catData) as Array<{ name: string; value: number }>).sort((a, b) => b.value - a.value).slice(0, 5);
    },
    enabled: isExpanded
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single();
      if (!profile?.company_id) return [];

      const { data: products } = await supabase.from('products').select('id, name, min_stock_level');
      if (!products?.length) return [];

      const { data: stockData } = await supabase.from('warehouse_stock').select('product_id, quantity').in('product_id', products.map(p => p.id));

      const stockMap = new Map<string, number>();
      stockData?.forEach((s: any) => stockMap.set(s.product_id, (stockMap.get(s.product_id) || 0) + Number(s.quantity || 0)));

      return products
        .map(p => ({ name: p.name, current: stockMap.get(p.id) || 0, min: p.min_stock_level || 0 }))
        .filter(p => p.current <= p.min && p.min > 0)
        .sort((a, b) => a.current - b.current)
        .slice(0, 6);
    },
    enabled: isExpanded
  });

  const { data: warehouseData } = useQuery({
    queryKey: ['warehouseDistribution'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single();
      if (!profile?.company_id) return [];

      const { data } = await supabase.from('warehouse_stock').select('quantity, warehouses(name)');

      const whData = (data || []).reduce((acc: Record<string, number>, s) => {
        const name = (s.warehouses as any)?.name || 'Ana Depo';
        acc[name] = (acc[name] || 0) + Number(s.quantity || 0);
        return acc;
      }, {});

      return Object.entries(whData).map(([name, value], i) => ({ name, value, fill: COLORS[i % 5] }));
    },
    enabled: isExpanded
  });

  // ABC Analysis
  const { data: abcAnalysis } = useQuery({
    queryKey: ['abcAnalysis'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single();
      if (!profile?.company_id) return { a: [], b: [], c: [] };

      const { data: products } = await supabase.from('products').select('id, name, price');
      if (!products?.length) return { a: [], b: [], c: [] };

      const { data: stockData } = await supabase.from('warehouse_stock').select('product_id, quantity').in('product_id', products.map(p => p.id));
      const stockMap = new Map<string, number>();
      stockData?.forEach((s: any) => stockMap.set(s.product_id, (stockMap.get(s.product_id) || 0) + Number(s.quantity || 0)));

      const productValues = products.map(p => ({
        id: p.id,
        name: p.name,
        value: (p.price || 0) * (stockMap.get(p.id) || 0),
      })).sort((a, b) => b.value - a.value);

      const totalValue = productValues.reduce((sum, p) => sum + p.value, 0);
      let cumulative = 0;
      
      const a: typeof productValues = [];
      const b: typeof productValues = [];
      const c: typeof productValues = [];

      productValues.forEach((p) => {
        cumulative += p.value;
        const percentage = (cumulative / totalValue) * 100;
        if (percentage <= 80) {
          a.push(p);
        } else if (percentage <= 95) {
          b.push(p);
        } else {
          c.push(p);
        }
      });

      return {
        a: a.slice(0, 10),
        b: b.slice(0, 10),
        c: c.slice(0, 10),
        chartData: [
          { category: 'A', value: a.reduce((sum, p) => sum + p.value, 0), fill: '#ef4444' },
          { category: 'B', value: b.reduce((sum, p) => sum + p.value, 0), fill: '#f59e0b' },
          { category: 'C', value: c.reduce((sum, p) => sum + p.value, 0), fill: '#22c55e' },
        ],
      };
    },
    enabled: isExpanded
  });

  // Inventory Turnover Rate
  const { data: turnoverRate } = useQuery({
    queryKey: ['turnoverRate', startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single();
      if (!profile?.company_id) return null;

      // Get average inventory value
      const { data: products } = await supabase.from('products').select('id, price, purchase_price');
      if (!products?.length) return null;

      const { data: stockData } = await supabase.from('warehouse_stock').select('product_id, quantity').in('product_id', products.map(p => p.id));
      const stockMap = new Map<string, number>();
      stockData?.forEach((s: any) => stockMap.set(s.product_id, (stockMap.get(s.product_id) || 0) + Number(s.quantity || 0)));

      const avgInventory = products.reduce((sum, p) => sum + ((p.purchase_price || p.price || 0) * (stockMap.get(p.id) || 0)), 0) / 2;

      // Get COGS (Cost of Goods Sold) from sales
      let salesQuery = supabase.from('proposals').select('total_amount').eq('status', 'accepted');
      salesQuery = salesQuery.gte('created_at', startDate);
      salesQuery = salesQuery.lte('created_at', endDate);
      const { data: sales } = await salesQuery;
      const cogs = (sales || []).reduce((sum, s) => sum + (s.total_amount || 0) * 0.6, 0); // Assume 60% COGS

      const turnover = avgInventory > 0 ? cogs / avgInventory : 0;
      const days = avgInventory > 0 ? 365 / turnover : 0;

      return { turnover, days, cogs, avgInventory };
    },
    enabled: isExpanded && !!startDate && !!endDate,
  });

  // Critical Stock Alerts (enhanced)
  const { data: criticalStock } = useQuery({
    queryKey: ['criticalStock'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single();
      if (!profile?.company_id) return [];

      const { data: products } = await supabase.from('products').select('id, name, min_stock_level, max_stock_level');
      if (!products?.length) return [];

      const { data: stockData } = await supabase.from('warehouse_stock').select('product_id, quantity').in('product_id', products.map(p => p.id));
      const stockMap = new Map<string, number>();
      stockData?.forEach((s: any) => stockMap.set(s.product_id, (stockMap.get(s.product_id) || 0) + Number(s.quantity || 0)));

      return products
        .map(p => ({
          name: p.name,
          current: stockMap.get(p.id) || 0,
          min: p.min_stock_level || 0,
          max: p.max_stock_level || 0,
          status: (stockMap.get(p.id) || 0) <= (p.min_stock_level || 0) ? 'critical' as const :
                 (stockMap.get(p.id) || 0) <= ((p.min_stock_level || 0) * 1.5) ? 'low' as const : 'normal' as const,
        }))
        .filter(p => p.status === 'critical' || p.status === 'low')
        .sort((a, b) => {
          if (a.status === 'critical' && b.status !== 'critical') return -1;
          if (a.status !== 'critical' && b.status === 'critical') return 1;
          return a.current - b.current;
        })
        .slice(0, 10);
    },
    enabled: isExpanded
  });

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-base font-semibold">Envanter</span>
              {isExpanded && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">Değer: ₺{(stockValue?.totalValue || 0).toLocaleString('tr-TR')}</Badge>
                  {(lowStockItems?.length || 0) > 0 && (
                    <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-600 border-rose-500/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />{lowStockItems?.length} Düşük Stok
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stock Value Summary */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <Boxes className="h-4 w-4" />
                Stok Özeti
              </h4>
              <div className="space-y-3">
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="text-xs text-emerald-700">Toplam Değer</div>
                  <div className="text-xl font-bold text-emerald-700">₺{(stockValue?.totalValue || 0).toLocaleString('tr-TR')}</div>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  <div className="text-xs text-rose-700">Maliyet</div>
                  <div className="text-xl font-bold text-rose-700">₺{(stockValue?.totalCost || 0).toLocaleString('tr-TR')}</div>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-xs text-blue-700">Potansiyel Kar</div>
                  <div className="text-xl font-bold text-blue-700">₺{(stockValue?.profit || 0).toLocaleString('tr-TR')}</div>
                </div>
              </div>
            </div>

            {/* Category Distribution Pie */}
            <div>
              <h4 className="font-medium text-sm mb-3 text-muted-foreground">Kategori Dağılımı</h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryDistribution} cx="50%" cy="50%" outerRadius={70} paddingAngle={2} dataKey="value" label={({ name }) => name?.substring(0, 8)}>
                      {categoryDistribution?.map((_, i) => <Cell key={i} fill={COLORS[i % 5]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Değer']} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Warehouse Distribution */}
            <div>
              <h4 className="font-medium text-sm mb-3 text-muted-foreground">Depo Dağılımı</h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={warehouseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={70} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {warehouseData?.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
                Düşük Stok Uyarıları
              </h4>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {lowStockItems?.map((item, i) => (
                  <div key={i} className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-rose-700">Mevcut: {item.current}</span>
                      <span className="text-xs text-muted-foreground">Min: {item.min}</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-rose-200 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (item.current / item.min) * 100)}%` }} />
                    </div>
                  </div>
                ))}
                {!lowStockItems?.length && (
                  <div className="text-center py-8 text-emerald-600">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Tüm stoklar yeterli</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ABC Analysis, Turnover Rate & Critical Stock */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* ABC Analysis */}
            <Card className="p-4 border-border/50">
              <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                ABC Analizi
              </h4>
              {abcAnalysis ? (
                <div className="space-y-3">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={abcAnalysis.chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          formatter={(v: number) => [`₺${v.toLocaleString('tr-TR')}`, 'Değer']}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {abcAnalysis.chartData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-rose-50 rounded">
                      <div className="font-bold text-rose-700">A</div>
                      <div className="text-rose-600">{abcAnalysis.a.length} ürün</div>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded">
                      <div className="font-bold text-amber-700">B</div>
                      <div className="text-amber-600">{abcAnalysis.b.length} ürün</div>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 rounded">
                      <div className="font-bold text-emerald-700">C</div>
                      <div className="text-emerald-600">{abcAnalysis.c.length} ürün</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">Yükleniyor...</div>
              )}
            </Card>

            {/* Turnover Rate */}
            <Card className="p-4 border-border/50">
              <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Stok Devir Hızı
              </h4>
              {turnoverRate ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Devir Hızı</div>
                    <div className="text-2xl font-bold text-primary">
                      {turnoverRate.turnover.toFixed(2)}x
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {turnoverRate.days.toFixed(0)} günde bir devir
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ortalama Stok:</span>
                      <span className="font-medium">₺{turnoverRate.avgInventory.toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Satılan Maliyet:</span>
                      <span className="font-medium">₺{turnoverRate.cogs.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Tarih aralığı seçin
                </div>
              )}
            </Card>

            {/* Critical Stock Alerts */}
            <Card className="p-4 border-border/50">
              <h4 className="font-medium text-sm mb-4 flex items-center gap-2 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
                Kritik Stok Uyarıları
              </h4>
              {criticalStock && criticalStock.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {criticalStock.map((item, i) => (
                    <div key={i} className={cn(
                      "p-3 rounded-lg border",
                      item.status === 'critical' ? "bg-rose-500/10 border-rose-500/20" : "bg-amber-500/10 border-amber-500/20"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate flex-1">{item.name}</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] shrink-0",
                          item.status === 'critical' ? "bg-rose-500/20 text-rose-700" : "bg-amber-500/20 text-amber-700"
                        )}>
                          {item.status === 'critical' ? 'Kritik' : 'Düşük'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-muted-foreground">Mevcut: {item.current}</span>
                        <span className="text-muted-foreground">Min: {item.min}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            item.status === 'critical' ? "bg-rose-500" : "bg-amber-500"
                          )} 
                          style={{ width: `${Math.min(100, (item.current / item.min) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Kritik stok bulunamadı
                </div>
              )}
            </Card>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
