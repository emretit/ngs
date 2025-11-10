import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package, Warehouse } from 'lucide-react';
import ProductSelector from '@/components/proposals/form/ProductSelector';
import CompactProductForm from '@/components/einvoice/CompactProductForm';
import { Product } from '@/types/product';

interface ParsedProduct {
  name: string;
  sku: string | null;
  quantity: number;
  unit_price: number;
  unit: string;
  tax_rate: number;
  line_total: number;
  tax_amount?: number;
  discount_amount?: number;
}

interface ProductMappingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parsedProduct: ParsedProduct;
  onSave: (data: { productId: string | null; warehouseId: string | null; action: 'create' | 'update' | 'skip' }) => void;
  existingProductId?: string | null;
  existingWarehouseId?: string | null;
  existingAction?: 'create' | 'update' | 'skip';
}

export default function ProductMappingDialog({
  isOpen,
  onClose,
  parsedProduct,
  onSave,
  existingProductId,
  existingWarehouseId,
  existingAction
}: ProductMappingDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(existingProductId || null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(existingWarehouseId || null);
  const [action, setAction] = useState<'create' | 'update' | 'skip'>(existingAction || 'update');
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);

  // Seçili ürünü getir
  const { data: selectedProduct } = useQuery({
    queryKey: ['product', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price')
        .eq('id', selectedProductId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProductId && isOpen,
  });

  // Depoları getir
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['available_warehouses'],
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
    enabled: isOpen,
  });

  // Dialog açıldığında varsayılan depoyu seç (ana depo) - sadece mevcut depo yoksa
  useEffect(() => {
    if (isOpen && warehouses.length > 0 && !selectedWarehouseId && !existingWarehouseId) {
      const mainWarehouse = warehouses.find((w: any) => w.warehouse_type === 'main') || warehouses[0];
      if (mainWarehouse) {
        setSelectedWarehouseId(mainWarehouse.id);
      }
    }
  }, [isOpen, warehouses, selectedWarehouseId, existingWarehouseId]);

  // Dialog açıldığında mevcut değerleri yükle
  useEffect(() => {
    if (isOpen) {
      setSelectedProductId(existingProductId || null);
      setSelectedWarehouseId(existingWarehouseId || null);
      setAction(existingAction || 'update');
    }
  }, [isOpen, existingProductId, existingWarehouseId, existingAction]);

  // Dialog kapandığında state'i temizle
  useEffect(() => {
    if (!isOpen) {
      setIsNewProductDialogOpen(false);
    }
  }, [isOpen]);

  const handleProductSelect = (product: Product) => {
    setSelectedProductId(product.id);
    setAction('update');
  };

  const handleNewProductClick = () => {
    setIsNewProductDialogOpen(true);
  };

  const handleNewProductCreated = (product: Product) => {
    setSelectedProductId(product.id);
    setAction('create');
    setIsNewProductDialogOpen(false);
  };

  const handleSave = () => {
    if (action === 'update' && !selectedProductId) {
      return; // Ürün seçilmemiş
    }
    if (action === 'create' && !selectedProductId) {
      return; // Yeni ürün oluşturulmamış
    }
    onSave({
      productId: selectedProductId,
      warehouseId: selectedWarehouseId,
      action: action
    });
    onClose();
  };

  const handleSkip = () => {
    onSave({
      productId: null,
      warehouseId: null,
      action: 'skip'
    });
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ürün İşleme
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Fatura Ürün Bilgileri */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">Fatura Ürün Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Ürün Adı</Label>
                  <p className="font-medium">{parsedProduct.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">SKU</Label>
                  <p className="font-medium">{parsedProduct.sku || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Miktar</Label>
                  <p className="font-medium">{parsedProduct.quantity} {parsedProduct.unit}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Birim Fiyat</Label>
                  <p className="font-medium">
                    {parsedProduct.unit_price.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} TRY
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">KDV Oranı</Label>
                  <p className="font-medium">%{parsedProduct.tax_rate}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Toplam Tutar</Label>
                  <p className="font-medium">
                    {parsedProduct.line_total.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} TRY
                  </p>
                </div>
              </div>
            </div>

            {/* Ürün Seçimi veya Yeni Ürün */}
            <div className="space-y-2">
              <Label>Ürün Seçin veya Yeni Ürün Oluşturun</Label>
              {selectedProductId ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-green-900 text-sm">
                        {selectedProduct?.name || 'Yükleniyor...'}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {selectedProduct?.sku && `SKU: ${selectedProduct.sku} • `}
                        {selectedProduct?.price && `${selectedProduct.price.toLocaleString('tr-TR')} TRY • `}
                        {action === 'create' ? 'Yeni ürün oluşturulacak' : 'Mevcut ürün güncellenecek'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProductId(null);
                        setAction('update');
                      }}
                    >
                      Değiştir
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <ProductSelector
                    value=""
                    onChange={() => {}}
                    onProductSelect={handleProductSelect}
                    onNewProduct={handleNewProductClick}
                    placeholder="Ürün seçin veya ara..."
                  />
                </div>
              )}
            </div>

            {/* Depo Seçimi */}
            <div className="space-y-2">
              <Label htmlFor="warehouse" className="flex items-center gap-2">
                <Warehouse className="h-4 w-4" />
                Depo Seçin *
              </Label>
              {warehousesLoading ? (
                <div className="flex items-center gap-2 p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Depolar yükleniyor...</span>
                </div>
              ) : (
                <Select
                  value={selectedWarehouseId || ''}
                  onValueChange={setSelectedWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Depo seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                        {warehouse.code && ` (${warehouse.code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {warehouses.length === 0 && !warehousesLoading && (
                <p className="text-xs text-red-500">Henüz depo tanımlanmamış</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleSkip}
            >
              Atla
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!selectedWarehouseId || (!selectedProductId && action !== 'skip')}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yeni Ürün Oluşturma Dialog */}
      <CompactProductForm
        isOpen={isNewProductDialogOpen}
        onClose={() => setIsNewProductDialogOpen(false)}
        onProductCreated={handleNewProductCreated}
        initialData={{
          name: parsedProduct.name,
          unit: parsedProduct.unit,
          price: parsedProduct.unit_price,
          tax_rate: parsedProduct.tax_rate,
          code: parsedProduct.sku || undefined
        }}
      />
    </>
  );
}

