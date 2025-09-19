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
  const { data: stockValue } = useQuery({
    queryKey: ['stockValue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('price, quantity, cost');
      
      const totalValue = (data || []).reduce((sum, product) => 
        sum + ((product.price || 0) * (product.quantity || 0)), 0
      );
      
      const totalCost = (data || []).reduce((sum, product) => 
        sum + ((product.cost || 0) * (product.quantity || 0)), 0
      );
      
      return { totalValue, totalCost, profit: totalValue - totalCost };
    },
    enabled: isExpanded
  });

  const { data: fastMovers } = useQuery({
    queryKey: ['fastMovers'],
    queryFn: async () => {
      // Note: This would require sales data to properly calculate movement
      // For now, showing products with high quantity as proxy for fast movers
      const { data } = await supabase
        .from('products')
        .select('name, quantity, price')
        .gt('quantity', 0)
        .order('quantity', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: isExpanded
  });

  const { data: slowMovers } = useQuery({
    queryKey: ['slowMovers'],
    queryFn: async () => {
      // Products with low quantity or zero quantity
      const { data } = await supabase
        .from('products')
        .select('name, quantity, price')
        .lte('quantity', 10)
        .order('quantity', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: isExpanded
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['lowStockItems'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('name, quantity, min_stock_level')
        .filter('quantity', 'lte', 'min_stock_level')
        .order('quantity', { ascending: true });
      return data || [];
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