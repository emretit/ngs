import React, { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Plus, History, Check } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency, areCurrenciesEqual, normalizeCurrency } from "@/utils/formatters";
import { useCurrencyManagement } from "@/components/proposals/form/items/hooks/useCurrencyManagement";
import CurrencySelector from "@/components/proposals/form/items/product-dialog/components/price-section/CurrencySelector";
import QuantityDepoSection from "@/components/proposals/form/items/product-dialog/components/QuantityDepoSection";
import ProductPriceHistoryDialog from "./ProductPriceHistoryDialog";

interface ProductDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onAddToProposal: (productData: {
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
    image_url?: string;
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
  } = useCurrencyManagement(currency, product, isManualPriceEdit);

  // Track previous currency to handle bidirectional conversion
  const prevCurrencyRef = React.useRef<string>(originalCurrency);
  
  // Initialize form data when dialog opens with product or existingData
  useEffect(() => {
    if (!open) return; // Dialog kapalıysa state'leri değiştirme
    
    // Edit modu öncelikli - existingData varsa onu kullan
    if (existingData) {
      // We're editing an existing line item
      console.log('ProductDetailsModal - Edit mode, existingData:', existingData);
      console.log('ProductDetailsModal - quantity:', existingData.quantity, 'unit_price:', existingData.unit_price, 'vat_rate:', existingData.vat_rate, 'discount_rate:', existingData.discount_rate);
      
      // Tüm değerleri mevcut existingData'dan al
      setQuantity(existingData.quantity ?? 1);
      setUnitPrice(existingData.unit_price ?? 0);
      setVatRate(existingData.vat_rate ?? 20);
      setDiscountRate(existingData.discount_rate ?? 0);
      setDescription(existingData.description || "");
      setUnit(existingData.unit || "adet");
      setIsManualPriceEdit(true);
      // Reset currency ref to original currency
      prevCurrencyRef.current = existingData.currency || originalCurrency;
    } else if (product) {
      // We're adding a new product
      console.log('ProductDetailsModal - New mode, product:', product);
      setQuantity(1);
      setUnitPrice(product.price || 0);
      setVatRate(product.tax_rate || 20);
      setDiscountRate(0);
      setDescription(product.description || "");
      setUnit(product.unit || "adet");
      setIsManualPriceEdit(false);
      // Reset currency ref to original currency
      prevCurrencyRef.current = originalCurrency;
    }
  }, [open, product, existingData, originalCurrency]);
  
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
    if (unitPrice <= 0 || !exchangeRates) {
      prevCurrencyRef.current = selectedCurrency;
      return;
    }
    
    // Convert from previous currency to new currency
    const previousCurrency = prevCurrencyRef.current;
    const convertedPrice = convertAmount(unitPrice, previousCurrency, selectedCurrency);
    setUnitPrice(convertedPrice);
    console.log(`Price converted from ${unitPrice} ${previousCurrency} to ${convertedPrice.toFixed(4)} ${selectedCurrency}`);
    
    // Update previous currency reference
    prevCurrencyRef.current = selectedCurrency;
  }, [selectedCurrency, exchangeRates, convertAmount]);

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
    // image_url: önce product'tan, yoksa existingData'dan al
    const imageUrl = product?.image_url || (existingData as any)?.image_url;
    
    onAddToProposal({
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
      image_url: imageUrl, // PDF export için ürün resmi
    });

    onOpenChange(false);
  };

  const showStockWarning = product && quantity > product.stock_quantity;
  // TRY currency comparison - areCurrenciesEqual kullan
  const showCurrencyWarning = product && !areCurrenciesEqual(product.currency, selectedCurrency);

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
      maxWidth="2xl"
      headerColor="blue"
      className="max-h-[90vh] overflow-y-auto"
    >

      <div className="space-y-3">
        {/* Warnings Section */}
        {(product && showStockWarning) || (product && showCurrencyWarning) ? (
          <div className="space-y-1">
            {product && showStockWarning && (
              <Alert variant="destructive" className="py-1">
                <AlertDescription className="text-xs">
                  <strong>Stok Uyarısı!</strong> Seçilen miktar ({quantity}) mevcut stoktan ({product.stock_quantity}) fazla.
                </AlertDescription>
              </Alert>
            )}

            {product && showCurrencyWarning && (
              <Alert className="py-1">
                <AlertDescription className="text-xs">
                  <strong>Para Birimi Uyarısı!</strong> Bu ürün kartındaki fiyat ({originalCurrency}) ile seçilen para birimi ({selectedCurrency}) farklı.
                  Günlük kur üzerinden otomatik olarak fiyat hesaplanmıştır. Dilerseniz hesaplanan rakamı değiştirebilirsiniz.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}

        {/* Main Form Section - Compact Layout */}
        <div className="space-y-3">
          {/* Miktar + Depo Seçimi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-600">
                Miktar
              </Label>
              <div className="flex gap-1.5 mt-1">
                <Input
                  id="quantity"
                  type="number"
                  value={quantity || 1}
                  onChange={(e) => {
                    const value = e.target.value;
                    setQuantity(value === "" ? 1 : Number(value) || 1);
                  }}
                  min="1"
                  className="flex-1"
                  placeholder="Miktar"
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-28">
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

          {/* Birim Fiyat */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="unit_price" className="text-sm font-medium text-gray-600">
                  Birim Fiyat
                </Label>
                <div className="flex gap-1.5 mt-1">
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
                    className="flex-1"
                    disabled={isLoadingRates}
                  />
                  <Select 
                    value={selectedCurrency} 
                    onValueChange={handleCurrencyChange}
                    disabled={isLoadingRates}
                  >
                    <SelectTrigger className="w-24">
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
              <div>
                <Label className="text-sm font-medium text-gray-600">
                  1 {selectedCurrency} = ₺
                </Label>
                <div className="mt-1">
                  <Input
                    type="number"
                    value={currentExchangeRate.toFixed(4)}
                    onChange={(e) => {
                      const value = e.target.value;
                      const rate = value === "" ? null : Number(value);
                      setManualExchangeRate(rate);
                    }}
                    step="0.0001"
                    className="w-full"
                    placeholder="0.0000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* İndirim ve KDV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="discount" className="text-sm font-medium text-gray-600">
                İndirim
              </Label>
              <div className="flex gap-1.5 mt-1">
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
                  className="flex-1"
                />
                <Select value={discountType} onValueChange={(value) => setDiscountType(value as 'percentage' | 'amount')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="amount">{selectedCurrency}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="vat_rate" className="text-sm font-medium text-gray-600">
                KDV Oranı
              </Label>
              <Select value={(vatRate || 20).toString()} onValueChange={(value) => setVatRate(Number(value))}>
                <SelectTrigger className="mt-1">
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
          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-600">
              Açıklama
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama"
              rows={2}
              className="mt-1 resize-none"
            />
          </div>

          {/* Hesaplama Özeti */}
          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Hesaplama Özeti</span>
              {product?.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPriceHistoryOpen(true)}
                  className="h-6 px-2 text-xs"
                >
                  <History className="h-3 w-3 mr-1" />
                  Fiyat Geçmişi
                </Button>
              )}
            </div>
            {normalizeCurrency(selectedCurrency) !== "TRY" && (
              <div className="text-xs text-muted-foreground mb-1.5 pb-1.5 border-b border-gray-300 text-center">
                1 {selectedCurrency} = {currentExchangeRate.toFixed(4)} ₺
              </div>
            )}
            <div className="text-xs text-gray-600 space-y-0.5 mb-1.5">
              <div className="flex justify-between items-center">
                <span>Ara Toplam:</span>
                <div className="flex items-center">
                  <span className="w-24 text-center">{formatCurrency(subtotal, selectedCurrency)}</span>
                  {normalizeCurrency(selectedCurrency) !== "TRY" && (
                    <>
                      <span className="w-px h-4 bg-gray-300 mx-2"></span>
                      <span className="w-24 text-center text-muted-foreground text-[10px]">
                        {formatCurrency(convertAmountWithManualRate(subtotal, selectedCurrency, "TRY"), "TRY")}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>İndirim:</span>
                <div className="flex items-center">
                  <span className="w-24 text-center text-red-600">-{formatCurrency(discountAmount, selectedCurrency)}</span>
                  {normalizeCurrency(selectedCurrency) !== "TRY" && (
                    <>
                      <span className="w-px h-4 bg-gray-300 mx-2"></span>
                      <span className="w-24 text-center text-muted-foreground text-[10px]">
                        {formatCurrency(convertAmountWithManualRate(discountAmount, selectedCurrency, "TRY"), "TRY")}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Net Toplam:</span>
                <div className="flex items-center">
                  <span className="w-24 text-center">{formatCurrency(netAmount, selectedCurrency)}</span>
                  {normalizeCurrency(selectedCurrency) !== "TRY" && (
                    <>
                      <span className="w-px h-4 bg-gray-300 mx-2"></span>
                      <span className="w-24 text-center text-muted-foreground text-[10px]">
                        {formatCurrency(convertAmountWithManualRate(netAmount, selectedCurrency, "TRY"), "TRY")}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>KDV:</span>
                <div className="flex items-center">
                  <span className="w-24 text-center text-green-600">+{formatCurrency(vatAmount, selectedCurrency)}</span>
                  {normalizeCurrency(selectedCurrency) !== "TRY" && (
                    <>
                      <span className="w-px h-4 bg-gray-300 mx-2"></span>
                      <span className="w-24 text-center text-muted-foreground text-[10px]">
                        {formatCurrency(convertAmountWithManualRate(vatAmount, selectedCurrency, "TRY"), "TRY")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-gray-300">
              <span className="text-gray-700">TOPLAM</span>
              <div className="flex items-center">
                <span className="w-24 text-center text-blue-600">
                  {formatCurrency(total, selectedCurrency)}
                </span>
                {normalizeCurrency(selectedCurrency) !== "TRY" && (
                  <>
                    <span className="w-px h-4 bg-gray-300 mx-2"></span>
                    <span className="w-24 text-center text-muted-foreground text-[10px] font-normal">
                      {formatCurrency(convertAmountWithManualRate(total, selectedCurrency, "TRY"), "TRY")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Uyarı Mesajları */}
          {isLoadingRates && (
            <p className="text-xs text-muted-foreground">Kurlar yükleniyor...</p>
          )}
        </div>

        <UnifiedDialogFooter>
          <UnifiedDialogCancelButton onClick={() => onOpenChange(false)} />
          <UnifiedDialogActionButton
            onClick={handleAddToProposal}
            variant="primary"
            className="gap-2"
          >
            {existingData ? (
              <>
                <Check className="h-4 w-4" />
                Güncelle
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Ekle
              </>
            )}
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