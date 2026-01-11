import React, { useState, useEffect } from "react";
import { logger } from '@/utils/logger';
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency, normalizeCurrency } from "@/utils/formatters";
import { useCurrencyManagement } from "@/components/proposals/form/items/hooks/useCurrencyManagement";
import CurrencySelector from "@/components/proposals/form/items/product-dialog/components/price-section/CurrencySelector";
import QuantityDepoSection from "@/components/proposals/form/items/product-dialog/components/QuantityDepoSection";
import ProductPriceHistoryDialog from "./ProductPriceHistoryDialog";

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onAddToProposal: (productData: {
    id: string; // Required: product_id for fetching image from products table
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
    discount_rate: number;
    total_price: number;
    currency: string;
    original_price?: number;
    original_currency?: string;
    // image_url removed: Always fetch from products table using product_id
  }) => void;
  currency: string;
  existingData?: {
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    vat_rate: number;
    discount_rate: number;
    currency: string;
  } | null;
}

const ProductDetailsModal = ({ 
  open, 
  onOpenChange, 
  product, 
  onAddToProposal,
  currency,
  existingData = null
}: ProductDetailsModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [vatRate, setVatRate] = useState(20);
  const [discountRate, setDiscountRate] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("adet");
  const [isManualPriceEdit, setIsManualPriceEdit] = useState(false);
  const [selectedDepo, setSelectedDepo] = useState("");
  const [manualExchangeRate, setManualExchangeRate] = useState<number | null>(null);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);

  // Determine initial currency: existingData currency > product currency > proposal currency
  const initialCurrency = React.useMemo(() => {
    if (existingData?.currency) return existingData.currency;
    if (product?.currency) return product.currency;
    return currency;
  }, [existingData?.currency, product?.currency, currency]);

  // Currency management
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
  } = useCurrencyManagement(initialCurrency, product, isManualPriceEdit);

  // Track previous currency to handle bidirectional conversion
  const prevCurrencyRef = React.useRef<string>(originalCurrency);
  // Track previous product/existingData to detect changes
  const prevProductRef = React.useRef<Product | null>(product);
  const prevExistingDataRef = React.useRef<any>(existingData);
  // Flag to prevent currency conversion when initializing from existingData
  const isInitializingFromExistingDataRef = React.useRef<boolean>(false);
  
  // Initialize form data when dialog opens with product or existingData
  useEffect(() => {
    if (!open) {
      // Dialog kapalıysa state'leri resetle
      setQuantity(1);
      setUnitPrice(0);
      setVatRate(20);
      setDiscountRate(0);
      setDescription("");
      setUnit("adet");
      setIsManualPriceEdit(false);
      setManualExchangeRate(null);
      setSelectedDepo("");
      // Reset refs
      prevProductRef.current = null;
      prevExistingDataRef.current = null;
      prevCurrencyRef.current = originalCurrency;
      return;
    }
    
    // Check if product or existingData changed - if so, reset everything first
    const productChanged = prevProductRef.current?.id !== product?.id;
    const existingDataChanged = prevExistingDataRef.current !== existingData;
    
    if (productChanged || existingDataChanged) {
      // Reset all states first when switching to a different product/item
      setQuantity(1);
      setUnitPrice(0);
      setVatRate(20);
      setDiscountRate(0);
      setDescription("");
      setUnit("adet");
      setIsManualPriceEdit(false);
      setManualExchangeRate(null);
      setSelectedDepo("");
    }
    
    // Edit modu öncelikli - existingData varsa onu kullan
    if (existingData) {
      // We're editing an existing line item
      logger.debug('ProductDetailsModal - Edit mode, existingData:', existingData);
      logger.debug('ProductDetailsModal - quantity:', existingData.quantity, 'unit_price:', existingData.unit_price, 'vat_rate:', existingData.vat_rate, 'discount_rate:', existingData.discount_rate, 'currency:', existingData.currency);
      
      // Set flag to prevent currency conversion during initialization
      isInitializingFromExistingDataRef.current = true;
      
      // Reset currency to existingData currency FIRST, before setting price
      // This prevents unwanted currency conversion
      const existingCurrency = existingData.currency || originalCurrency;
      
      // Set prevCurrencyRef to existingCurrency BEFORE setting selectedCurrency
      // This ensures that currency conversion useEffect won't trigger incorrectly
      prevCurrencyRef.current = existingCurrency;
      setSelectedCurrency(existingCurrency);
      
      // Tüm değerleri mevcut existingData'dan al
      // unit_price is already in the correct currency (existingData.currency)
      setQuantity(existingData.quantity ?? 1);
      setUnitPrice(existingData.unit_price ?? 0);
      setVatRate(existingData.vat_rate ?? 20);
      setDiscountRate(existingData.discount_rate ?? 0);
      setDescription(existingData.description || "");
      setUnit(existingData.unit || "adet");
      setIsManualPriceEdit(true);
      
      // Update refs
      prevExistingDataRef.current = existingData;
      prevProductRef.current = product;
      
      // Reset flag after a short delay to allow state updates to complete
      setTimeout(() => {
        isInitializingFromExistingDataRef.current = false;
      }, 100);
    } else if (product) {
      // We're adding a new product
      logger.debug('ProductDetailsModal - New mode, product:', product);
      setQuantity(1);
      setUnitPrice(product.price || 0);
      setVatRate(product.tax_rate || 20);
      setDiscountRate(0);
      setDescription(product.description || "");
      setUnit(product.unit || "adet");
      setIsManualPriceEdit(false);
      
      // Reset currency to product's original currency or proposal currency
      const productCurrency = product.currency || currency || originalCurrency;
      setSelectedCurrency(productCurrency);
      prevCurrencyRef.current = productCurrency;
      
      // Update refs
      prevProductRef.current = product;
      prevExistingDataRef.current = null;
    }
  }, [open, product, existingData, originalCurrency, currency, setSelectedCurrency]);
  
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
    
    // Skip conversion if we're initializing from existingData
    if (isInitializingFromExistingDataRef.current) {
      prevCurrencyRef.current = selectedCurrency;
      return;
    }
    
    // Skip if no price or exchange rates
    if (unitPrice <= 0 || !exchangeRates) {
      prevCurrencyRef.current = selectedCurrency;
      return;
    }
    
    // Convert from previous currency to new currency
    const previousCurrency = prevCurrencyRef.current;
    const convertedPrice = convertAmount(unitPrice, previousCurrency, selectedCurrency);
    setUnitPrice(convertedPrice);
    logger.debug(`Price converted from ${unitPrice} ${previousCurrency} to ${convertedPrice.toFixed(4)} ${selectedCurrency}`);
    
    // Update previous currency reference
    prevCurrencyRef.current = selectedCurrency;
  }, [selectedCurrency, exchangeRates, convertAmount, unitPrice]);

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

  const calculateTotals = () => {
    // Ensure all values are valid numbers
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    const discount = Number(discountRate) || 0;
    const vat = Number(vatRate) || 20;

    const subtotal = qty * price;
    
    // Calculate discount based on type
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      // amount: direct discount amount
      discountAmount = discount;
    }
    
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

  const handleAddToProposal = () => {
    const productName = product ? product.name : (existingData ? existingData.name : "");
    
    onAddToProposal({
      id: product?.id || (existingData as any)?.product_id || (existingData as any)?.id, // Required: product_id for fetching image from products table
      name: productName,
      description,
      quantity,
      unit,
      unit_price: unitPrice,
      vat_rate: vatRate || 20,
      discount_rate: discountRate || 0,
      total_price: total,
      currency: selectedCurrency,
      original_price: originalPrice,
      original_currency: originalCurrency,
      // image_url removed: Always fetch from products table using product_id
    });

    onOpenChange(false);
  };


  // Don't render if neither product nor existingData is provided
  if (!product && !existingData) return null;

  // Determine if we're in edit mode
  const isEditMode = !!existingData;
  const displayName = product ? product.name : (existingData ? existingData.name : "Ürün Detayları");
  
  const dialogTitle = (
    <div className="flex items-center justify-between w-full gap-3">
      <span className="truncate">{displayName}</span>
      {product?.sku && (
        <span className="text-sm font-normal text-gray-500 whitespace-nowrap flex-shrink-0">
          {product.sku}
        </span>
      )}
    </div>
  );

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={dialogTitle}
      maxWidth="lg"
      headerColor="blue"
      className="max-h-[90vh] overflow-y-auto [&>div>div]:p-1.5"
    >

      <div className="space-y-1.5">
        {/* Main Form Section */}
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
                  value={quantity || 1}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuantity(value === "" ? 1 : Number(value) || 1);
                  }}
                  min="1"
                  className="flex-1 h-7 text-sm"
                  placeholder="Miktar"
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-24 h-7 text-sm">
                    <SelectValue placeholder="Birim" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adet">Adet</SelectItem>
                    <SelectItem value="kg">Kilogram</SelectItem>
                    <SelectItem value="m">Metre</SelectItem>
                    <SelectItem value="m2">Metrekare</SelectItem>
                    <SelectItem value="m3">Metreküp</SelectItem>
                    <SelectItem value="lt">Litre</SelectItem>
                    <SelectItem value="paket">Paket</SelectItem>
                    <SelectItem value="kutu">Kutu</SelectItem>
                    <SelectItem value="saat">Saat</SelectItem>
                    <SelectItem value="gün">Gün</SelectItem>
                    <SelectItem value="hafta">Hafta</SelectItem>
                    <SelectItem value="ay">Ay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Depo Seçimi */}
            <div className="space-y-0.5">
              <QuantityDepoSection
                quantity={quantity}
                setQuantity={setQuantity}
                selectedDepo={selectedDepo}
                setSelectedDepo={setSelectedDepo}
                availableStock={product?.stock_quantity}
                stockStatus={product?.stock_quantity
                  ? product.stock_quantity > (product.stock_threshold || 5)
                    ? 'in_stock'
                    : 'low_stock'
                  : 'out_of_stock'}
                productId={product?.id || (existingData as any)?.product_id || (existingData as any)?.id}
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
                  value={unitPrice || 0}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUnitPrice(value === "" ? 0 : Number(value));
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

          {/* İndirim + KDV */}
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
                <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'percentage' | 'amount')}>
                  <SelectTrigger className="w-24 h-7 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="amount">{selectedCurrency}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-0.5">
              <Label htmlFor="vat_rate" className="text-xs font-medium text-gray-700">
                KDV Oranı
              </Label>
              <Select value={(vatRate || 20).toString()} onValueChange={(value) => setVatRate(Number(value))}>
                <SelectTrigger className="h-7 text-sm">
                  <SelectValue />
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
              {product?.id && (
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

          {/* Uyarı Mesajları */}
          {isLoadingRates && (
            <p className="text-[10px] text-center text-muted-foreground py-1">Kurlar yükleniyor...</p>
          )}
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={() => onOpenChange(false)} />
          <UnifiedDialogActionButton
            onClick={handleAddToProposal}
            variant="primary"
          >
            {existingData ? "Güncelle" : "Ekle"}
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </div>

      {/* Fiyat Geçmişi Dialog */}
      {product?.id && (
        <ProductPriceHistoryDialog
          open={priceHistoryOpen}
          onOpenChange={setPriceHistoryOpen}
          productId={product.id}
          productName={product.name}
        />
      )}
    </UnifiedDialog>
  );
};

export default ProductDetailsModal;