import React, { useEffect, useState, useRef } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { Product } from "@/types/product";
import { EInvoiceItem } from "@/types/einvoice";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapUnitToDropdownValue, UNIT_OPTIONS } from "@/utils/unitConstants";
import ProductSelector from '@/components/proposals/form/ProductSelector';
import CompactProductForm from '@/components/einvoice/CompactProductForm';
import { formatCurrency, normalizeCurrency } from '@/utils/formatters';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import QuantityDepoSection from '@/components/proposals/form/items/product-dialog/components/QuantityDepoSection';
import ProductPriceHistoryDialog from '@/components/proposals/form/ProductPriceHistoryDialog';
import { useCurrencyManagement } from "@/components/proposals/form/items/hooks/useCurrencyManagement";

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
  invoiceCurrency?: string; // Faturadan gelen para birimi
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
  invoiceCurrency,
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
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
  const [isManualPriceEdit, setIsManualPriceEdit] = useState(false);
  const [manualExchangeRate, setManualExchangeRate] = useState<number | null>(null);

  // Currency management
  // Öncelik: invoiceCurrency > selectedProduct?.currency > 'TRY'
  const normalizedInvoiceCurrency = invoiceCurrency === 'TL' ? 'TRY' : (invoiceCurrency || null);
  const defaultCurrency = normalizedInvoiceCurrency || selectedProduct?.currency || 'TRY';
  const {
    selectedCurrency,
    setSelectedCurrency,
    originalCurrency,
    originalPrice,
    exchangeRates,
    isLoadingRates,
    currencyOptions,
    convertAmount,
    handleCurrencyChange
  } = useCurrencyManagement(defaultCurrency, selectedProduct || null, isManualPriceEdit);

  // Track previous currency to handle bidirectional conversion
  const prevCurrencyRef = useRef<string>(originalCurrency);

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
        ;

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

  // Dialog açıldığında varsayılan değerleri ayarla (sadece ilk açılışta)
  const openRef = useRef(false);
  useEffect(() => {
    if (open && !openRef.current) {
      openRef.current = true;
      
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
      setIsManualPriceEdit(false);
      // Reset currency ref to original currency
      prevCurrencyRef.current = originalCurrency;
      
      // Ana depoyu varsayılan olarak seç (sadece mevcut depo yoksa)
      if (warehouses.length > 0 && !selectedWarehouseId && !existingWarehouseId) {
        const mainWarehouse = warehouses.find((w: any) => w.warehouse_type === 'main') || warehouses[0];
        if (mainWarehouse) {
          setSelectedWarehouseId(mainWarehouse.id);
        }
      }
    } else if (!open && openRef.current) {
      // Dialog kapandığında ref'i sıfırla
      openRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  // Reset manual exchange rate when currency changes
  useEffect(() => {
    if (prevCurrencyRef.current !== selectedCurrency) {
      setManualExchangeRate(null);
    }
  }, [selectedCurrency]);

  // Handle currency conversion when currency changes
  useEffect(() => {
    // Skip if currency hasn't actually changed
    if (prevCurrencyRef.current === selectedCurrency) return;
    
    // Skip if no price or exchange rates
    if (!price || price <= 0 || !exchangeRates) {
      prevCurrencyRef.current = selectedCurrency;
      return;
    }
    
    // Convert from previous currency to new currency
    const previousCurrency = prevCurrencyRef.current;
    const convertedPrice = convertAmount(price, previousCurrency, selectedCurrency);
    setPrice(convertedPrice);
    
    // Update previous currency reference
    prevCurrencyRef.current = selectedCurrency;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency, exchangeRates]);

  // Get current exchange rate (manual or from rates)
  const currentExchangeRate = exchangeRates
    ? (manualExchangeRate !== null ? manualExchangeRate : (exchangeRates[selectedCurrency] || 1))
    : 1;

  // Convert amount with manual exchange rate support
  const convertAmountWithManualRate = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Use manual rate if available and converting from selectedCurrency
    const normalizedSelected = normalizeCurrency(selectedCurrency);
    if (manualExchangeRate !== null && fromCurrency === selectedCurrency && normalizedSelected !== "TRY") {
      const amountInTRY = amount * manualExchangeRate;
      return toCurrency === "TRY" ? amountInTRY : amountInTRY / (exchangeRates?.[toCurrency] || 1);
    }

    // Use manual rate if available and converting to selectedCurrency
    if (manualExchangeRate !== null && toCurrency === selectedCurrency && normalizedSelected !== "TRY") {
      const amountInTRY = fromCurrency === "TRY" ? amount : amount * (exchangeRates?.[fromCurrency] || 1);
      return amountInTRY / manualExchangeRate;
    }
    
    // Fallback to normal conversion
    return convertAmount(amount, fromCurrency, toCurrency);
  };

  // Hesaplama fonksiyonu
  const calculateTotals = () => {
    const qty = Number(quantity) || 0;
    const unitPrice = Number(price || selectedProduct?.price || 0);
    const discount = Number(discountRate) || 0;
    const vat = Number(taxRate) || 20;

    const subtotal = qty * unitPrice;
    const discountAmount = (subtotal * discount) / 100;
    const netAmount = subtotal - discountAmount;
    const vatAmount = (netAmount * vat) / 100;
    const total = netAmount + vatAmount;

    return {
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      discountAmount: isNaN(discountAmount) ? 0 : discountAmount,
      netAmount: isNaN(netAmount) ? 0 : netAmount,
      vatAmount: isNaN(vatAmount) ? 0 : vatAmount,
      total: isNaN(total) ? 0 : total
    };
  };

  const { subtotal, discountAmount, netAmount, vatAmount, total } = calculateTotals();

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
      className="max-h-[90vh] overflow-y-auto [&>div>div]:p-1.5"
    >
      <div className="space-y-1.5">
        
        <div className="space-y-1.5">
          {/* Ürün Seçimi - Sadece allowProductSelection true ise ve ürün seçilmemişse göster */}
          {allowProductSelection && !selectedProductId && action !== 'create' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Ürün Seçin veya Yeni Ürün Oluşturun</label>
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
            <div className="flex items-center justify-between p-1.5 bg-blue-50 border border-blue-200 rounded">
              <span className="text-blue-600 font-medium text-xs">Yeni Ürün Oluşturulacak</span>
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
                <div className="space-y-1.5">
            {/* Miktar + Depo Seçimi */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <Label htmlFor="quantity" className="text-xs font-medium text-gray-700">
                  Miktar
                </Label>
                <div className="flex gap-1">
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    className="flex-1 h-7 text-sm"
                    placeholder="Miktar"
                  />
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-24 h-7 text-sm">
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
              <div className="space-y-0.5">
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
            </div>

            {/* Birim Fiyat + Kur */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <Label htmlFor="unit_price" className="text-xs font-medium text-gray-700">
                  Birim Fiyat
                </Label>
                <div className="flex gap-1">
                  <Input
                    id="unit_price"
                    type="number"
                    value={price || 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPrice(value === "" ? undefined : Number(value));
                      setIsManualPriceEdit(true);
                    }}
                    step="0.0001"
                    placeholder="0.0000"
                    className="flex-1 h-7 text-sm"
                    disabled={isLoadingRates}
                  />
                  <Select
                    value={selectedCurrency}
                    onValueChange={handleCurrencyChange}
                    disabled={isLoadingRates}
                  >
                    <SelectTrigger className="w-24 h-7 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="bg-background border z-[100]">
                      {currencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="exchange_rate" className="text-xs font-medium text-gray-700">
                  1 {selectedCurrency} = ₺
                </Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  value={currentExchangeRate.toFixed(4)}
                  onChange={(e) => {
                    const value = e.target.value;
                    const rate = value === "" ? null : Number(value);
                    setManualExchangeRate(rate);
                  }}
                  step="0.0001"
                  className="h-7 text-sm"
                  placeholder="0.0000"
                />
              </div>
            </div>
              
            {/* İndirim ve KDV */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="space-y-0.5">
                <Label htmlFor="discount" className="text-xs font-medium text-gray-700">
                  İndirim
                </Label>
                <div className="flex gap-1">
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
                    className="flex-1 h-7 text-sm"
                  />
                  <Select value="percentage" onValueChange={() => {}}>
                    <SelectTrigger className="w-24 h-7 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="amount">₺</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="tax-rate" className="text-xs font-medium text-gray-700">
                  KDV Oranı
                </Label>
                <Select 
                  value={`${taxRate}`}
                  onValueChange={(value) => setTaxRate(Number(value))}
                >
                  <SelectTrigger id="tax-rate" className="h-7 text-sm">
                    <SelectValue placeholder="KDV Oranı" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">KDV %20</SelectItem>
                    <SelectItem value="18">KDV %18</SelectItem>
                    <SelectItem value="8">KDV %8</SelectItem>
                    <SelectItem value="1">KDV %1</SelectItem>
                    <SelectItem value="0">KDV %0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Açıklama */}
            <div className="space-y-0.5">
              <Label htmlFor="description" className="text-xs font-medium text-gray-700">
                Açıklama
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Açıklama giriniz..."
                rows={1}
                className="resize-none text-sm py-1 min-h-[28px]"
              />
            </div>

            {/* Hesaplama Özeti */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-1.5 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-800">Hesaplama Özeti</span>
                {selectedProduct?.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPriceHistoryOpen(true)}
                    className="h-6 px-1.5 text-[10px] hover:bg-white/80"
                  >
                    <History className="h-3 w-3 mr-0.5" />
                    Fiyat Geçmişi
                  </Button>
                )}
              </div>

              {normalizeCurrency(selectedCurrency) !== "TRY" && (
                <div className="text-[10px] text-gray-600 bg-white/60 py-0.5 px-1.5 rounded mb-1 text-center font-medium">
                  1 {selectedCurrency} = {currentExchangeRate.toFixed(4)} ₺
                </div>
              )}

              <div className="space-y-1 text-xs text-gray-700">
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-medium">Ara Toplam:</span>
                  <div className="flex items-center gap-2">
                    <span className="min-w-[85px] text-right font-semibold">{formatCurrency(subtotal, selectedCurrency)}</span>
                    {normalizeCurrency(selectedCurrency) !== "TRY" && (
                      <>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span className="min-w-[75px] text-right text-[10px] text-gray-500">
                          {formatCurrency(convertAmountWithManualRate(subtotal, selectedCurrency, "TRY"), "TRY")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="font-medium">İndirim:</span>
                  <div className="flex items-center gap-2">
                    <span className="min-w-[85px] text-right font-semibold text-red-600">-{formatCurrency(discountAmount, selectedCurrency)}</span>
                    {normalizeCurrency(selectedCurrency) !== "TRY" && (
                      <>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span className="min-w-[75px] text-right text-[10px] text-gray-500">
                          -{formatCurrency(convertAmountWithManualRate(discountAmount, selectedCurrency, "TRY"), "TRY")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="font-medium">Net Toplam:</span>
                  <div className="flex items-center gap-2">
                    <span className="min-w-[85px] text-right font-semibold">{formatCurrency(netAmount, selectedCurrency)}</span>
                    {normalizeCurrency(selectedCurrency) !== "TRY" && (
                      <>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span className="min-w-[75px] text-right text-[10px] text-gray-500">
                          {formatCurrency(convertAmountWithManualRate(netAmount, selectedCurrency, "TRY"), "TRY")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="font-medium">KDV:</span>
                  <div className="flex items-center gap-2">
                    <span className="min-w-[85px] text-right font-semibold text-green-600">+{formatCurrency(vatAmount, selectedCurrency)}</span>
                    {normalizeCurrency(selectedCurrency) !== "TRY" && (
                      <>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span className="min-w-[75px] text-right text-[10px] text-gray-500">
                          +{formatCurrency(convertAmountWithManualRate(vatAmount, selectedCurrency, "TRY"), "TRY")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t-2 border-gray-300">
                <span className="text-xs font-bold text-gray-800">TOPLAM</span>
                <div className="flex items-center gap-2">
                  <div className="min-w-[85px] text-right">
                    <div className="text-sm font-bold text-blue-600">
                      {formatCurrency(total, selectedCurrency)}
                    </div>
                    <div className="text-[10px] text-blue-600/70 font-medium mt-0.5">
                      {selectedCurrency}
                    </div>
                  </div>
                  {normalizeCurrency(selectedCurrency) !== "TRY" && (
                    <>
                      <span className="w-px h-6 bg-gray-300"></span>
                      <div className="min-w-[75px] text-right">
                        <div className="text-xs font-semibold text-gray-600">
                          {formatCurrency(convertAmountWithManualRate(total, selectedCurrency, "TRY"), "TRY")}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                          TRY
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
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
              total <= 0
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

    {/* Fiyat Geçmişi Dialog */}
    {selectedProduct?.id && (
      <ProductPriceHistoryDialog
        open={priceHistoryOpen}
        onOpenChange={setPriceHistoryOpen}
        productId={selectedProduct.id}
        productName={selectedProduct.name}
      />
    )}
    </>
  );
};

export default EInvoiceProductDetailsDialog;

