import React, { useEffect, useState } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Product } from "@/types/product";
import { EInvoiceItem } from "@/types/einvoice";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapUnitToDropdownValue, UNIT_OPTIONS } from "@/utils/unitConstants";
import ProductSelector from '@/components/proposals/form/ProductSelector';
import CompactProductForm from '@/components/einvoice/CompactProductForm';
import { formatCurrency } from '@/utils/formatters';
import { Label } from "@/components/ui/label";
import PriceAndDiscountSection from '@/components/proposals/form/items/product-dialog/components/PriceAndDiscountSection';
import QuantityDepoSection from '@/components/proposals/form/items/product-dialog/components/QuantityDepoSection';
import TotalPriceSection from '@/components/proposals/form/items/product-dialog/components/TotalPriceSection';
import NotesSection from '@/components/proposals/form/items/product-dialog/components/NotesSection';
import ProductInfoSection from '@/components/proposals/form/items/product-dialog/components/ProductInfoSection';

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

interface EInvoiceProductDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct?: Product | null; // Opsiyonel - ürün seçimi yapılabilir
  invoiceItem?: EInvoiceItem;
  invoiceQuantity?: number;
  invoicePrice?: number;
  invoiceUnit?: string;
  parsedProduct?: ParsedProduct; // ProductMapping için
  onConfirm: (data: { productId?: string | null; warehouseId: string; quantity?: number; price?: number; unit?: string; action?: 'create' | 'update' | 'skip'; discountRate?: number; taxRate?: number; description?: string }) => void;
  allowProductSelection?: boolean; // Ürün seçimi yapılabilir mi?
  existingProductId?: string | null; // Mevcut ürün ID'si
  existingWarehouseId?: string | null; // Mevcut depo ID'si
  existingAction?: 'create' | 'update' | 'skip'; // Mevcut aksiyon
}

const EInvoiceProductDetailsDialog: React.FC<EInvoiceProductDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedProduct: initialSelectedProduct,
  invoiceItem,
  invoiceQuantity,
  invoicePrice,
  invoiceUnit,
  parsedProduct,
  onConfirm,
  allowProductSelection = false,
  existingProductId,
  existingWarehouseId,
  existingAction
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(existingProductId || initialSelectedProduct?.id || null);
  const [action, setAction] = useState<'create' | 'update' | 'skip'>(existingAction || 'update');
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  // Seçili ürünü getir (eğer selectedProductId varsa)
  const { data: selectedProduct } = useQuery({
    queryKey: ['product', selectedProductId],
    queryFn: async () => {
      if (!selectedProductId) return initialSelectedProduct || null;
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price, unit, currency, tax_rate, stock_threshold')
        .eq('id', selectedProductId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProductId && open,
    initialData: initialSelectedProduct || undefined
  });

  // Faturadan gelen birim bilgisini öncelikle invoiceItem'dan, sonra prop'lardan, en son parsedProduct'tan al
  const fetchedInvoiceUnit = invoiceItem?.unit || invoiceUnit || parsedProduct?.unit;
  const fetchedInvoiceQuantity = invoiceItem?.quantity || invoiceQuantity || parsedProduct?.quantity;
  const fetchedInvoicePrice = invoiceItem?.unit_price || invoicePrice || parsedProduct?.unit_price;

  // Initial state'te birimi faturadan gelen birimle başlat (dropdown değerine çevirerek)
  const initialUnit = fetchedInvoiceUnit 
    ? mapUnitToDropdownValue(fetchedInvoiceUnit)
    : (selectedProduct?.unit ? mapUnitToDropdownValue(selectedProduct.unit) : 'adet');

  const [quantity, setQuantity] = useState(fetchedInvoiceQuantity || 1);
  const [price, setPrice] = useState<number | undefined>(fetchedInvoicePrice);
  const [unit, setUnit] = useState<string>(initialUnit);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(existingWarehouseId || "");
  const [warehouseStocks, setWarehouseStocks] = useState<Map<string, number>>(new Map());
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(parsedProduct?.tax_rate || selectedProduct?.tax_rate || 20);
  const [description, setDescription] = useState<string>("");
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);

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
    if (open) {
      // Mevcut değerleri yükle
      if (existingProductId) {
        setSelectedProductId(existingProductId);
      } else if (initialSelectedProduct) {
        setSelectedProductId(initialSelectedProduct.id);
      }
      if (existingWarehouseId) {
        setSelectedWarehouseId(existingWarehouseId);
      }
      if (existingAction) {
        setAction(existingAction);
      }

      // Öncelikle invoiceItem'dan, sonra prop'lardan, en son parsedProduct'tan al
      const invoiceUnitValue = invoiceItem?.unit || invoiceUnit || parsedProduct?.unit;
      const invoiceQuantityValue = invoiceItem?.quantity || invoiceQuantity || parsedProduct?.quantity;
      const invoicePriceValue = invoiceItem?.unit_price || invoicePrice || parsedProduct?.unit_price;
      
      const defaultQuantity = invoiceQuantityValue || 1;
      const defaultPrice = invoicePriceValue || selectedProduct?.price;
      // Birim bilgisini dropdown değerine çevir (GRM -> g, C62 -> adet gibi)
      const rawUnit = invoiceUnitValue || selectedProduct?.unit || 'adet';
      const defaultUnit = mapUnitToDropdownValue(rawUnit);
      
      setQuantity(defaultQuantity);
      setPrice(defaultPrice);
      setUnit(defaultUnit);
      setTaxRate(parsedProduct?.tax_rate || selectedProduct?.tax_rate || 20);
      setDescription(parsedProduct?.name || selectedProduct?.description || "");
      
      // Ana depoyu varsayılan olarak seç (sadece mevcut depo yoksa)
      if (warehouses.length > 0 && !selectedWarehouseId && !existingWarehouseId) {
        const mainWarehouse = warehouses.find((w: any) => w.warehouse_type === 'main') || warehouses[0];
        if (mainWarehouse) {
          setSelectedWarehouseId(mainWarehouse.id);
        }
      }
    }
  }, [open, initialSelectedProduct, invoiceItem, invoiceQuantity, invoicePrice, invoiceUnit, parsedProduct, warehouses, selectedWarehouseId, existingProductId, existingWarehouseId, existingAction, selectedProduct]);

  // Dialog kapandığında state'i temizle
  useEffect(() => {
    if (!open) {
      if (!allowProductSelection) {
        setSelectedWarehouseId("");
        setQuantity(1);
        setPrice(undefined);
        setUnit('adet');
      }
      setIsNewProductDialogOpen(false);
    }
  }, [open, allowProductSelection]);

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

  const handleConfirm = () => {
    if (allowProductSelection) {
      // ProductMapping modu - productId gerekli
      if (!selectedWarehouseId) return;
      onConfirm({
        productId: selectedProductId,
        warehouseId: selectedWarehouseId,
        quantity: quantity,
        price: price,
        unit: unit,
        action: action,
        discountRate: discountRate,
        taxRate: taxRate,
        description: description
      });
    } else {
      // EInvoiceProcess modu - selectedProduct zaten var
      if (selectedWarehouseId && selectedProduct) {
        onConfirm({
          warehouseId: selectedWarehouseId,
          quantity: quantity,
          price: price,
          unit: unit,
          discountRate: discountRate,
          taxRate: taxRate,
          description: description
        });
      }
    }
    onOpenChange(false);
  };


  const getStockForWarehouse = (warehouseId: string) => {
    return warehouseStocks.get(warehouseId) || 0;
  };

  const getStockStatus = (stock: number): string => {
    if (stock === 0) return 'out_of_stock';
    if (stock < (selectedProduct?.stock_threshold || 5)) {
      return 'low_stock';
    }
    return 'in_stock';
  };

  const totalStock = selectedProductId ? Array.from(warehouseStocks.values()).reduce((sum, qty) => sum + qty, 0) : 0;
  const stockStatusString = selectedProductId ? getStockStatus(totalStock) : 'in_stock';
  
  // Stok uyarısı kontrolü
  const selectedWarehouseStock = selectedWarehouseId ? getStockForWarehouse(selectedWarehouseId) : totalStock;
  const showStockWarning = selectedProduct && quantity > selectedWarehouseStock;

  // Dialog başlığı
  const dialogTitle = selectedProduct ? (
    <div className="flex items-center justify-between w-full gap-3">
      <span className="truncate">{selectedProduct.name}</span>
      {selectedProduct.sku && (
        <span className="text-sm font-normal text-gray-500 whitespace-nowrap flex-shrink-0">
          {selectedProduct.sku}
        </span>
      )}
    </div>
  ) : "Ürün Detayları";

  return (
    <>
    <UnifiedDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={dialogTitle}
      maxWidth="lg"
      headerColor="blue"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-2">
          {/* Uyarılar */}
          {showStockWarning && (
            <Alert variant="destructive" className="py-1">
              <AlertDescription className="text-xs">
                <strong>Stok Uyarısı!</strong> Seçilen miktar ({quantity}) mevcut stoktan ({selectedWarehouseStock}) fazla.
              </AlertDescription>
            </Alert>
          )}
        
        <div className="grid gap-4 py-4">
          {/* Ürün Seçimi - Sadece allowProductSelection true ise ve ürün seçilmemişse göster */}
          {allowProductSelection && !selectedProductId && action !== 'create' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Ürün Seçin veya Yeni Ürün Oluşturun</label>
              <ProductSelector
                value=""
                onChange={() => {}}
                onProductSelect={handleProductSelect}
                onNewProduct={handleNewProductClick}
                placeholder="Ürün seçin veya ara..."
              />
            </div>
          )}
          
          {/* Ürün Seçimi için değiştir butonu */}
          {allowProductSelection && selectedProductId && selectedProduct && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedProductId(null);
                  setAction('update');
                }}
                className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded"
              >
                Ürünü Değiştir
              </button>
            </div>
          )}

          {/* Yeni Ürün Oluşturulacak */}
          {allowProductSelection && action === 'create' && !selectedProductId && (
            <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded">
              <span className="text-blue-600 font-medium text-sm">Yeni Ürün Oluşturulacak</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProductId(null);
                    setAction('update');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded"
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          {/* Miktar, Fiyat ve Depo - Sadece ürün seçildiğinde veya allowProductSelection false ise göster */}
          {(selectedProductId && selectedProduct) || (!allowProductSelection && initialSelectedProduct) ? (
                <div className="space-y-2">
            {/* Miktar + Depo Seçimi */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="quantity" className="text-xs font-medium text-gray-600">
                  Miktar
                </Label>
                <div className="flex gap-1.5 mt-0.5">
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="flex-1 h-7 text-xs"
                    placeholder="Miktar"
                  />
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-20 h-7 text-xs">
                      <SelectValue placeholder="Birim" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Depo */}
              <QuantityDepoSection 
                quantity={quantity}
                setQuantity={setQuantity}
                selectedDepo={selectedWarehouseId}
                setSelectedDepo={setSelectedWarehouseId}
                availableStock={totalStock}
                stockStatus={stockStatusString}
                productId={selectedProductId || undefined}
                showQuantity={false}
              />
            </div>

            {/* Birim Fiyat */}
              <PriceAndDiscountSection 
                customPrice={price}
                setCustomPrice={setPrice}
                discountRate={discountRate}
                setDiscountRate={setDiscountRate}
                selectedCurrency={selectedProduct?.currency || 'TL'}
                handleCurrencyChange={() => {}}
                convertedPrice={price || selectedProduct?.price || 0}
                originalCurrency={selectedProduct?.currency || 'TL'}
                formatCurrency={formatCurrency}
              />
              
            {/* İndirim ve KDV */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="discount" className="text-xs font-medium text-gray-600">
                  İndirim
                </Label>
                <div className="flex mt-0.5">
                  <Input
                    id="discount"
                    type="number"
                    value={discountRate || 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDiscountRate(value === "" ? 0 : Number(value) || 0);
                    }}
                    step="0.01"
                    max="100"
                    placeholder="0"
                    className="rounded-r-none h-7 text-xs"
                  />
                  <Select value="percentage" onValueChange={() => {}}>
                    <SelectTrigger className="w-16 h-7 text-xs rounded-none border-l-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="amount">₺</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="tax-rate" className="text-xs font-medium text-gray-600">
                  KDV Oranı
                </Label>
                <Select 
                  value={`${taxRate}`}
                  onValueChange={(value) => setTaxRate(Number(value))}
                >
                  <SelectTrigger id="tax-rate" className="mt-0.5 h-7 text-xs">
                    <SelectValue placeholder="KDV Oranı" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">KDV %20</SelectItem>
                    <SelectItem value="10">KDV %10</SelectItem>
                    <SelectItem value="1">KDV %1</SelectItem>
                    <SelectItem value="0">KDV %0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Açıklama */}
            <NotesSection 
              notes={description} 
              setNotes={setDescription} 
            />

            {/* Hesaplama Özeti */}
              <TotalPriceSection 
                unitPrice={price || selectedProduct?.price || 0}
                quantity={quantity}
                discountRate={discountRate}
                taxRate={taxRate}
                calculatedTotal={calculatedTotal}
                setCalculatedTotal={setCalculatedTotal}
                originalCurrency={selectedProduct?.currency || 'TL'}
                currentCurrency={selectedProduct?.currency || 'TL'}
                formatCurrency={formatCurrency}
              />
          </div>
          ) : null}
        </div>
        </div>
        
      <UnifiedDialogFooter>
        <UnifiedDialogCancelButton onClick={() => onOpenChange(false)} />
        <UnifiedDialogActionButton
            onClick={handleConfirm}
            disabled={
              !selectedWarehouseId || 
              !price || 
              quantity < 1 || 
              warehousesLoading ||
              (allowProductSelection && !selectedProductId && action !== 'skip') ||
              calculatedTotal <= 0
            }
          >
            {allowProductSelection ? 'Ekle' : 'Onayla'}
        </UnifiedDialogActionButton>
      </UnifiedDialogFooter>
    </UnifiedDialog>

    {/* Yeni Ürün Oluşturma Dialog */}
    {allowProductSelection && parsedProduct && (
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
    )}
    </>
  );
};

export default EInvoiceProductDetailsDialog;

