import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Package, TrendingUp, TrendingDown, AlertTriangle, Boxes } from "lucide-react";
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
  const { data: stockValue } = useQuery({
    queryKey: ['stockValue'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user?.id).single();
      if (!profile?.company_id) return { totalValue: 0, totalCost: 0, profit: 0, productCount: 0 };

      const { data: products } = await supabase.from('products').select('id, price, purchase_price').eq('company_id', profile.company_id);
      if (!products?.length) return { totalValue: 0, totalCost: 0, profit: 0, productCount: 0 };

      const { data: stockData } = await supabase.from('warehouse_stock').select('product_id, quantity').in('product_id', products.map(p => p.id)).eq('company_id', profile.company_id);

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

      const { data: products } = await supabase.from('products').select('category_id, price, product_categories(name)').eq('company_id', profile.company_id);

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

      const { data: products } = await supabase.from('products').select('id, name, min_stock_level').eq('company_id', profile.company_id);
      if (!products?.length) return [];

      const { data: stockData } = await supabase.from('warehouse_stock').select('product_id, quantity').in('product_id', products.map(p => p.id)).eq('company_id', profile.company_id);

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

      const { data } = await supabase.from('warehouse_stock').select('quantity, warehouses(name)').eq('company_id', profile.company_id);

      const whData = (data || []).reduce((acc: Record<string, number>, s) => {
        const name = (s.warehouses as any)?.name || 'Ana Depo';
        acc[name] = (acc[name] || 0) + Number(s.quantity || 0);
        return acc;
      }, {});

      return Object.entries(whData).map(([name, value], i) => ({ name, value, fill: COLORS[i % 5] }));
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
        </CardContent>
      )}
    </Card>
  );
}
