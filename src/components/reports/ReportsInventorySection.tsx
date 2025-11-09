import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Package, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportsInventorySectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  searchParams: URLSearchParams;
}

export default function ReportsInventorySection({ isExpanded, onToggle, searchParams }: ReportsInventorySectionProps) {
  // Önce kullanıcının company_id'sini al
  const { data: stockValue } = useQuery({
    queryKey: ['stockValue'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) {
        return { totalValue: 0, totalCost: 0, profit: 0 };
      }

      // Ürünleri çek
      const { data: products } = await supabase
        .from('products')
        .select('id, price, purchase_price')
        .eq('company_id', profile.company_id);
      
      if (!products || products.length === 0) {
        return { totalValue: 0, totalCost: 0, profit: 0 };
      }

      // Ürün ID'lerini al
      const productIds = products.map(p => p.id);

      // Warehouse_stock tablosundan toplam stok miktarlarını çek
      const { data: stockData } = await supabase
        .from('warehouse_stock')
        .select('product_id, quantity')
        .in('product_id', productIds)
        .eq('company_id', profile.company_id);

      // Stok verilerini product_id'ye göre grupla ve topla
      const stockMap = new Map<string, number>();
      if (stockData) {
        stockData.forEach((stock: { product_id: string; quantity: number }) => {
          const current = stockMap.get(stock.product_id) || 0;
          stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
        });
      }

      // Toplam değer ve maliyet hesapla
      const totalValue = products.reduce((sum, product) => {
        const stock = stockMap.get(product.id) || 0;
        return sum + ((product.price || 0) * stock);
      }, 0);
      
      const totalCost = products.reduce((sum, product) => {
        const stock = stockMap.get(product.id) || 0;
        return sum + ((product.purchase_price || 0) * stock);
      }, 0);
      
      return { totalValue, totalCost, profit: totalValue - totalCost };
    },
    enabled: isExpanded
  });

  const { data: fastMovers } = useQuery({
    queryKey: ['fastMovers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      // Ürünleri çek
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('company_id', profile.company_id);
      
      if (!products || products.length === 0) return [];

      const productIds = products.map(p => p.id);

      // Warehouse_stock tablosundan toplam stok miktarlarını çek
      const { data: stockData } = await supabase
        .from('warehouse_stock')
        .select('product_id, quantity')
        .in('product_id', productIds)
        .eq('company_id', profile.company_id);

      // Stok verilerini product_id'ye göre grupla ve topla
      const stockMap = new Map<string, number>();
      if (stockData) {
        stockData.forEach((stock: { product_id: string; quantity: number }) => {
          const current = stockMap.get(stock.product_id) || 0;
          stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
        });
      }

      // Ürünleri stok miktarına göre sırala ve en yüksek 5'ini al
      return products
        .map(product => ({
          name: product.name,
          quantity: stockMap.get(product.id) || 0,
          price: product.price
        }))
        .filter(p => p.quantity > 0)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    },
    enabled: isExpanded
  });

  const { data: slowMovers } = useQuery({
    queryKey: ['slowMovers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      // Ürünleri çek
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('company_id', profile.company_id);
      
      if (!products || products.length === 0) return [];

      const productIds = products.map(p => p.id);

      // Warehouse_stock tablosundan toplam stok miktarlarını çek
      const { data: stockData } = await supabase
        .from('warehouse_stock')
        .select('product_id, quantity')
        .in('product_id', productIds)
        .eq('company_id', profile.company_id);

      // Stok verilerini product_id'ye göre grupla ve topla
      const stockMap = new Map<string, number>();
      if (stockData) {
        stockData.forEach((stock: { product_id: string; quantity: number }) => {
          const current = stockMap.get(stock.product_id) || 0;
          stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
        });
      }

      // Ürünleri stok miktarına göre sırala ve düşük stoklu 5'ini al
      return products
        .map(product => ({
          name: product.name,
          quantity: stockMap.get(product.id) || 0,
          price: product.price
        }))
        .filter(p => p.quantity <= 10)
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);
    },
    enabled: isExpanded
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      // Ürünleri çek
      const { data: products } = await supabase
        .from('products')
        .select('id, name, min_stock_level')
        .eq('company_id', profile.company_id);
      
      if (!products || products.length === 0) return [];

      const productIds = products.map(p => p.id);

      // Warehouse_stock tablosundan toplam stok miktarlarını çek
      const { data: stockData } = await supabase
        .from('warehouse_stock')
        .select('product_id, quantity')
        .in('product_id', productIds)
        .eq('company_id', profile.company_id);

      // Stok verilerini product_id'ye göre grupla ve topla
      const stockMap = new Map<string, number>();
      if (stockData) {
        stockData.forEach((stock: { product_id: string; quantity: number }) => {
          const current = stockMap.get(stock.product_id) || 0;
          stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
        });
      }

      // Ürünleri stok miktarına göre filtrele ve sırala
      return products
        .map(product => ({
          name: product.name,
          quantity: stockMap.get(product.id) || 0,
          min_stock_level: product.min_stock_level || 0
        }))
        .filter(p => p.quantity <= p.min_stock_level)
        .sort((a, b) => a.quantity - b.quantity);
    },
    enabled: isExpanded
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Envanter Raporları
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stock Value Summary */}
            <div>
              <h4 className="font-semibold mb-3">Stok Değeri</h4>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded">
                  <div className="text-sm text-green-700">Toplam Değer</div>
                  <div className="text-lg font-bold text-green-800">
                    ₺{(stockValue?.totalValue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-red-50 rounded">
                  <div className="text-sm text-red-700">Toplam Maliyet</div>
                  <div className="text-lg font-bold text-red-800">
                    ₺{(stockValue?.totalCost || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded">
                  <div className="text-sm text-blue-700">Potansiyel Kar</div>
                  <div className="text-lg font-bold text-blue-800">
                    ₺{(stockValue?.profit || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Fast Movers */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Hızlı Hareket Eden
              </h4>
              <div className="space-y-2">
                {fastMovers?.map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm">{product.name}</span>
                    <span className="text-sm font-medium">{product.quantity}</span>
                  </div>
                ))}
                {!fastMovers?.length && (
                  <p className="text-sm text-muted-foreground">Veri bulunamadı</p>
                )}
              </div>
            </div>

            {/* Slow Movers */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Yavaş Hareket Eden
              </h4>
              <div className="space-y-2">
                {slowMovers?.map((product, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="text-sm">{product.name}</span>
                    <span className="text-sm font-medium">{product.quantity}</span>
                  </div>
                ))}
                {!slowMovers?.length && (
                  <p className="text-sm text-muted-foreground">Veri bulunamadı</p>
                )}
              </div>
            </div>

            {/* Low Stock Alert */}
            <div>
              <h4 className="font-semibold mb-3 text-orange-600">Düşük Stok Uyarısı</h4>
              <div className="space-y-2">
                {lowStockItems?.slice(0, 5).map((product, index) => (
                  <div key={index} className="p-2 bg-orange-50 border border-orange-200 rounded">
                    <div className="text-sm font-medium">{product.name}</div>
                    <div className="text-xs text-orange-700">
                      Mevcut: {product.quantity} / Min: {product.min_stock_level || 'Tanımsız'}
                    </div>
                  </div>
                ))}
                {!lowStockItems?.length && (
                  <p className="text-sm text-green-600">Tüm ürünler yeterli stokta</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}