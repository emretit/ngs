import React, { useEffect, useState } from "react";
import { 
  Dialog, 
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/product";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Package, Warehouse, CheckCircle2, AlertTriangle } from "lucide-react";

interface EInvoiceProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct: Product | null;
  invoiceQuantity?: number;
  invoicePrice?: number;
  onConfirm: (data: { warehouseId: string; quantity?: number; price?: number }) => void;
}

const EInvoiceProductDetailsDialog: React.FC<EInvoiceProductDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedProduct,
  invoiceQuantity,
  invoicePrice,
  onConfirm
}) => {
  const [quantity, setQuantity] = useState(invoiceQuantity || 1);
  const [price, setPrice] = useState<number | undefined>(invoicePrice);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [warehouseStocks, setWarehouseStocks] = useState<Map<string, number>>(new Map());

  // Depoları getir
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses-for-einvoice-details'],
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
    enabled: open,
  });

  // Seçili ürünün depo bazında stok bilgilerini getir
  const { data: stockData = [] } = useQuery({
    queryKey: ['warehouse-stocks-details', selectedProduct?.id],
    queryFn: async () => {
      if (!selectedProduct?.id) return [];

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
        .eq('product_id', selectedProduct.id)
        .eq('company_id', profile.company_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProduct?.id && open,
  });

  // Stok verilerini Map'e dönüştür
  useEffect(() => {
    const stockMap = new Map<string, number>();
    stockData.forEach((stock: any) => {
      stockMap.set(stock.warehouse_id, Number(stock.quantity || 0));
    });
    setWarehouseStocks(stockMap);
  }, [stockData]);

  // Dialog açıldığında varsayılan değerleri ayarla
  useEffect(() => {
    if (open && selectedProduct) {
      setQuantity(invoiceQuantity || 1);
      setPrice(invoicePrice || selectedProduct.price);
      
      // Ana depoyu varsayılan olarak seç
      if (warehouses.length > 0 && !selectedWarehouseId) {
        const mainWarehouse = warehouses.find((w: any) => w.warehouse_type === 'main') || warehouses[0];
        if (mainWarehouse) {
          setSelectedWarehouseId(mainWarehouse.id);
        }
      }
    }
  }, [open, selectedProduct, invoiceQuantity, invoicePrice, warehouses, selectedWarehouseId]);

  // Dialog kapandığında state'i temizle
  useEffect(() => {
    if (!open) {
      setSelectedWarehouseId("");
      setQuantity(1);
      setPrice(undefined);
    }
  }, [open]);

  const handleConfirm = () => {
    if (selectedWarehouseId && selectedProduct) {
      onConfirm({
        warehouseId: selectedWarehouseId,
        quantity: quantity,
        price: price
      });
      onOpenChange(false);
    }
  };

  const getStockForWarehouse = (warehouseId: string) => {
    return warehouseStocks.get(warehouseId) || 0;
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'out_of_stock', icon: AlertCircle, color: 'destructive' };
    if (stock < (selectedProduct?.stock_threshold || 5)) {
      return { status: 'low_stock', icon: AlertTriangle, color: 'warning' };
    }
    return { status: 'in_stock', icon: CheckCircle2, color: 'success' };
  };

  if (!selectedProduct) return null;

  const totalStock = Array.from(warehouseStocks.values()).reduce((sum, qty) => sum + qty, 0);
  const stockStatus = getStockStatus(totalStock);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ürün Detayları
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Ürün Bilgileri */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">{selectedProduct.name}</h3>
              <Badge variant="outline" className={
                stockStatus.status === 'in_stock' ? 'bg-green-50 text-green-700 border-green-200' :
                stockStatus.status === 'low_stock' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-red-50 text-red-700 border-red-200'
              }>
                <span className="flex items-center space-x-1">
                  <stockStatus.icon className="h-3 w-3" />
                  <span>
                    {stockStatus.status === 'in_stock' ? 'Stokta Var' :
                     stockStatus.status === 'low_stock' ? 'Düşük Stok' :
                     'Stokta Yok'}
                  </span>
                </span>
              </Badge>
            </div>
            {selectedProduct.description && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedProduct.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm mt-2">
              <span>SKU: {selectedProduct.sku || "-"}</span>
              <span>Toplam Stok: {totalStock} {selectedProduct.unit}</span>
            </div>
            {stockStatus.status === 'low_stock' && (
              <div className="text-amber-500 text-xs mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                <span>Stok miktarı düşük, satın alma planlanabilir</span>
              </div>
            )}
          </div>

          {/* Miktar, Fiyat ve Depo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Miktar */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Miktar *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
                {invoiceQuantity && (
                  <p className="text-xs text-gray-500">
                    Faturadan gelen miktar: {invoiceQuantity} {selectedProduct.unit}
                  </p>
                )}
              </div>

              {/* Fiyat */}
              <div className="space-y-2">
                <Label htmlFor="price">Birim Fiyat ({selectedProduct.currency || 'TRY'}) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price || ''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || undefined)}
                />
                {invoicePrice && (
                  <p className="text-xs text-gray-500">
                    Faturadan gelen fiyat: {new Intl.NumberFormat('tr-TR', { 
                      style: 'currency', 
                      currency: selectedProduct.currency || 'TRY',
                      minimumFractionDigits: 2
                    }).format(invoicePrice)}
                  </p>
                )}
              </div>
            </div>

            {/* Depo Seçimi */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse" className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  Depo Seçin *
                </Label>
                {warehousesLoading ? (
                  <div className="flex items-center gap-2 p-3">
                    <span className="text-sm text-gray-500">Depolar yükleniyor...</span>
                  </div>
                ) : (
                  <Select
                    value={selectedWarehouseId}
                    onValueChange={setSelectedWarehouseId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Depo seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse: any) => {
                        const stock = getStockForWarehouse(warehouse.id);
                        const status = getStockStatus(stock);
                        return (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>
                                {warehouse.name}
                                {warehouse.code && ` (${warehouse.code})`}
                              </span>
                              <span className={`ml-2 text-xs ${
                                status.status === 'in_stock' ? 'text-green-600' :
                                status.status === 'low_stock' ? 'text-amber-600' :
                                'text-red-600'
                              }`}>
                                Stok: {stock} {selectedProduct.unit}
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
                {warehouses.length === 0 && !warehousesLoading && (
                  <p className="text-xs text-red-500">Henüz depo tanımlanmamış</p>
                )}
              </div>

              {/* Seçili Depo Stok Bilgisi */}
              {selectedWarehouseId && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">
                    {warehouses.find((w: any) => w.id === selectedWarehouseId)?.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Mevcut Stok: {getStockForWarehouse(selectedWarehouseId)} {selectedProduct.unit}
                  </p>
                  {quantity > getStockForWarehouse(selectedWarehouseId) && (
                    <div className="flex items-center text-xs text-red-500 mt-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      <span>Miktar stok miktarını aşıyor</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Toplam Hesaplama */}
          {price && quantity && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">Toplam Tutar:</span>
                <span className="text-lg font-bold text-blue-700">
                  {new Intl.NumberFormat('tr-TR', { 
                    style: 'currency', 
                    currency: selectedProduct.currency || 'TRY',
                    minimumFractionDigits: 2
                  }).format(price * quantity)}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {quantity} {selectedProduct.unit} × {new Intl.NumberFormat('tr-TR', { 
                  style: 'currency', 
                  currency: selectedProduct.currency || 'TRY',
                  minimumFractionDigits: 2
                }).format(price)} = {new Intl.NumberFormat('tr-TR', { 
                  style: 'currency', 
                  currency: selectedProduct.currency || 'TRY',
                  minimumFractionDigits: 2
                }).format(price * quantity)}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          
          <Button 
            onClick={handleConfirm}
            disabled={!selectedWarehouseId || !price || quantity < 1 || warehousesLoading}
          >
            Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EInvoiceProductDetailsDialog;

