import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductWarehouseStockProps {
  productId: string;
  totalStock: number;
  unit: string;
}

const ProductWarehouseStock = ({ 
  productId, 
  totalStock,
  unit 
}: ProductWarehouseStockProps) => {
  // Depoları ve stok dağılımını getir
  const { data: warehouseStock, isLoading } = useQuery({
    queryKey: ["product_warehouse_stock", productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      // Depoları getir
      const { data: warehouses, error: warehousesError } = await supabase
        .from("warehouses")
        .select("id, name, code, warehouse_type")
        .eq("company_id", profile.company_id)
        .eq("is_active", true)
        .order("name");

      if (warehousesError) throw warehousesError;

      // TODO: inventory_transactions tablosu hazır olduğunda gerçek stok miktarlarını hesapla
      // Şimdilik her depoda eşit dağılım gösterelim veya toplam stokun bir kısmını gösterelim
      // Şimdilik sadece depo listesini göster, gerçek stok miktarları inventory_transactions'dan gelecek
      
      return (warehouses || []).map((warehouse) => ({
        warehouse_id: warehouse.id,
        warehouse_name: warehouse.name,
        warehouse_code: warehouse.code,
        warehouse_type: warehouse.warehouse_type,
        // TODO: Gerçek stok miktarını inventory_transactions'dan hesapla
        stock_quantity: 0, // Şimdilik 0 göster, gerçek değer inventory_transactions'dan gelecek
        estimated_stock: null as number | null
      }));
    },
  });

  if (isLoading) {
    return (
      <Card className="rounded-xl">
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
              <Warehouse className="h-4 w-4 text-indigo-600" />
            </div>
            Depo Bazlı Stok Dağılımı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const warehouses = warehouseStock || [];
  const hasStockData = warehouses.some(w => w.stock_quantity > 0);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-50/50 border border-indigo-200/50">
            <Warehouse className="h-4 w-4 text-indigo-600" />
          </div>
          Depo Bazlı Stok Dağılımı
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {warehouses.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            Aktif depo bulunamadı
          </div>
        ) : (
          <div className="space-y-3">
            {/* Toplam Stok */}
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
              <span className="text-xs font-medium text-gray-700">Toplam Stok</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {totalStock} {unit}
                </span>
                {totalStock > 0 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>

            {/* Depo Listesi */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.warehouse_id}
                  className="flex justify-between items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        {warehouse.warehouse_name}
                        {warehouse.warehouse_code && (
                          <span className="text-gray-500 ml-1">
                            ({warehouse.warehouse_code})
                          </span>
                        )}
                      </div>
                      {warehouse.warehouse_type && (
                        <Badge 
                          variant="outline" 
                          className="text-xs mt-0.5"
                        >
                          {warehouse.warehouse_type === 'main' ? 'Ana Depo' :
                           warehouse.warehouse_type === 'sub' ? 'Alt Depo' :
                           warehouse.warehouse_type === 'virtual' ? 'Sanal Depo' :
                           warehouse.warehouse_type === 'transit' ? 'Transit' : warehouse.warehouse_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {warehouse.stock_quantity > 0 ? (
                      <>
                        <span className="text-sm font-semibold text-gray-900">
                          {warehouse.stock_quantity} {unit}
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-gray-400">-</span>
                        <span className="text-xs text-gray-500">
                          {hasStockData ? 'Stok yok' : 'Hesaplanıyor...'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!hasStockData && warehouses.length > 0 && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Depo bazlı stok miktarları henüz hesaplanmıyor. 
                  Stok işlemleri aktif olduğunda burada görünecek.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductWarehouseStock;

