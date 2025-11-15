
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface QuantityDepoSectionProps {
  quantity: number;
  setQuantity: (value: number) => void;
  selectedDepo: string;
  setSelectedDepo: (value: string) => void;
  availableStock?: number;
  stockStatus?: string;
  productId?: string;
  showQuantity?: boolean; // Miktar input'unu göster/gizle
}

const QuantityDepoSection: React.FC<QuantityDepoSectionProps> = ({
  quantity,
  setQuantity,
  selectedDepo,
  setSelectedDepo,
  availableStock,
  stockStatus,
  productId,
  showQuantity = true
}) => {
  // Depoları getir
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses-for-proposal'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, code, warehouse_type')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Seçili ürünün depo bazında stok bilgilerini getir
  const { data: warehouseStocks = [], isLoading: stocksLoading } = useQuery({
    queryKey: ['warehouse-stocks-proposal', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from('warehouse_stock')
        .select('warehouse_id, quantity')
        .eq('product_id', productId)
        .eq('company_id', profile.company_id);

      if (error) {
        console.error('Error fetching warehouse stocks:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!productId,
  });

  // İlk açılışta ana depoyu seç
  React.useEffect(() => {
    if (warehouses.length > 0 && !selectedDepo) {
      const mainWarehouse = warehouses.find((w: any) => w.warehouse_type === 'main') || warehouses[0];
      if (mainWarehouse) {
        setSelectedDepo(mainWarehouse.id);
      }
    }
  }, [warehouses, selectedDepo, setSelectedDepo]);

  // Stok bilgisini al
  const getStockForWarehouse = (warehouseId: string) => {
    const stock = warehouseStocks.find((s: any) => s.warehouse_id === warehouseId);
    if (!stock) return 0;
    // quantity string olarak gelebilir, number'a dönüştür
    const quantity = typeof stock.quantity === 'string' 
      ? parseFloat(stock.quantity) 
      : stock.quantity;
    return isNaN(quantity) ? 0 : Math.floor(quantity);
  };

  // Seçili depodaki stok miktarını kontrol et
  const selectedWarehouseStock = selectedDepo ? getStockForWarehouse(selectedDepo) : availableStock || 0;
  const isOverStock = selectedWarehouseStock !== undefined && quantity > selectedWarehouseStock;
  
  return (
    <div className="space-y-4">
      {showQuantity ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Miktar</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className={isOverStock ? "border-red-300 focus-visible:ring-red-400" : ""}
            />
            {isOverStock && (
              <div className="flex items-center text-xs text-red-500 mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Stok miktarını aşıyor ({selectedWarehouseStock} adet mevcut)</span>
              </div>
            )}
          </div>
          
          <div>
            <Label htmlFor="depo" className="text-sm font-medium">
              Depo
            </Label>
            <div className="mt-1">
              {warehousesLoading ? (
                <Select disabled>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Yükleniyor..." />
                  </SelectTrigger>
                </Select>
              ) : (
                <Select value={selectedDepo} onValueChange={setSelectedDepo}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Depo seçin" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[300px]">
                    {warehouses.map((warehouse: any) => {
                      const stock = productId ? getStockForWarehouse(warehouse.id) : 0;
                      const warehouseText = `${warehouse.name}${warehouse.code ? ` (${warehouse.code})` : ''}`;
                      return (
                        <SelectItem key={warehouse.id} value={warehouse.id} className="pr-3">
                          <div className="flex items-center justify-between w-full gap-2 min-w-0">
                            <span className="flex-1 truncate text-sm">
                              {warehouseText}
                            </span>
                            <span className="text-sm font-semibold text-blue-600 whitespace-nowrap flex-shrink-0 ml-2">
                              {stock} adet
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <Label htmlFor="depo" className="text-sm font-medium">
            Depo
          </Label>
          <div className="mt-1">
            {warehousesLoading ? (
              <Select disabled>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Yükleniyor..." />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={selectedDepo} onValueChange={setSelectedDepo}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Depo seçin" />
                </SelectTrigger>
              <SelectContent className="min-w-[300px]">
                {warehouses.map((warehouse: any) => {
                  const stock = productId ? getStockForWarehouse(warehouse.id) : 0;
                  const warehouseText = `${warehouse.name}${warehouse.code ? ` (${warehouse.code})` : ''}`;
                  return (
                    <SelectItem key={warehouse.id} value={warehouse.id} className="pr-3">
                      <div className="flex items-center justify-between w-full gap-2 min-w-0">
                        <span className="flex-1 truncate text-sm">
                          {warehouseText}
                        </span>
                        <span className="text-sm font-semibold text-blue-600 whitespace-nowrap flex-shrink-0 ml-2">
                          {stock} adet
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            )}
          </div>
        </div>
      )}
      
      
      {stockStatus === 'low_stock' && (
        <div className="text-amber-500 text-xs">
          <AlertCircle className="h-3 w-3 inline-block mr-1" />
          <span>Stok miktarı düşük, satın alma planlanabilir</span>
        </div>
      )}
    </div>
  );
};

export default QuantityDepoSection;

