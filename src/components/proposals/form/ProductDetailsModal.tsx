import React, { useState, useEffect } from "react";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus } from "lucide-react";
import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatters";
import { useCurrencyManagement } from "@/components/proposals/form/items/hooks/useCurrencyManagement";
import CurrencySelector from "@/components/proposals/form/items/product-dialog/components/price-section/CurrencySelector";

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
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("adet");
  const [isManualPriceEdit, setIsManualPriceEdit] = useState(false);

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

  // Initialize form data when product or existingData changes
  useEffect(() => {
    if (product) {
      // We're adding a new product
      setQuantity(1);
      setUnitPrice(product.price || 0);
      setVatRate(product.tax_rate || 20);
      setDiscountRate(0);
      setDescription(product.description || "");
      setUnit(product.unit || "adet");
      setIsManualPriceEdit(false);
    } else if (existingData) {
      // We're editing an existing line item
      setQuantity(existingData.quantity);
      setUnitPrice(existingData.unit_price);
      setVatRate(existingData.vat_rate);
      setDiscountRate(existingData.discount_rate);
      setDescription(existingData.description);
      setUnit(existingData.unit);
      setIsManualPriceEdit(true);
    }
  }, [product, existingData]);

  // Handle currency conversion when currency changes
  useEffect(() => {
    if (selectedCurrency !== originalCurrency && unitPrice > 0 && exchangeRates) {
      const convertedPrice = convertAmount(unitPrice, originalCurrency, selectedCurrency);
      setUnitPrice(convertedPrice);
      console.log(`Price converted from ${unitPrice} ${originalCurrency} to ${convertedPrice.toFixed(2)} ${selectedCurrency}`);
    }
  }, [selectedCurrency]);

  const calculateTotals = () => {
    const subtotal = quantity * (unitPrice || 0);
    const discountAmount = (subtotal * (discountRate || 0)) / 100;
    const netAmount = subtotal - discountAmount;
    const vatAmount = (netAmount * (vatRate || 20)) / 100;
    const total = netAmount + vatAmount;

    return {
      subtotal,
      discountAmount,
      netAmount,
      vatAmount,
      total
    };
  };

  const { subtotal, discountAmount, netAmount, vatAmount, total } = calculateTotals();

  const handleAddToProposal = () => {
    const productName = product ? product.name : (existingData ? existingData.name : "");
    
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
      original_currency: originalCurrency
    });

    onOpenChange(false);
  };

  const showStockWarning = product && quantity > product.stock_quantity;
  const showCurrencyWarning = product && product.currency !== selectedCurrency;

  // Don't render if neither product nor existingData is provided
  if (!product && !existingData) return null;

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={product ? product.name : (existingData ? existingData.name : "Ürün Detayları")}
      maxWidth="lg"
      headerColor="blue"
      className="max-h-[90vh] overflow-y-auto"
    >
      {product?.sku && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-blue-700">Ürün Kodu: {product.sku}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Warnings Section */}
        {(product && showStockWarning) || (product && showCurrencyWarning) ? (
          <div className="space-y-2">
            {product && showStockWarning && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-xs">
                  <strong>Stok Uyarısı!</strong> Seçilen miktar ({quantity}) mevcut stoktan ({product.stock_quantity}) fazla.
                </AlertDescription>
              </Alert>
            )}

            {product && showCurrencyWarning && (
              <Alert className="py-2">
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
          {/* Miktar + Birim ve Birim Fiyat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quantity" className="text-xs font-medium text-gray-600">
                Miktar
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="quantity"
                  type="number"
                  value={quantity || 1}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                  className="flex-1 h-7 text-xs"
                  placeholder="Miktar"
                />
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="w-20 h-7 text-xs">
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

            <div>
              <Label htmlFor="unit_price" className="text-xs font-medium text-gray-600">
                Birim Fiyat
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="unit_price"
                  type="number"
                  value={unitPrice || 0}
                  onChange={(e) => {
                    const value = e.target.value;
                    setUnitPrice(value === "" ? 0 : Number(value));
                    setIsManualPriceEdit(true);
                  }}
                  step="0.01"
                  placeholder="0.00"
                  className="flex-1 h-7 text-xs"
                  disabled={isLoadingRates}
                />
                <Select 
                  value={selectedCurrency} 
                  onValueChange={handleCurrencyChange}
                  disabled={isLoadingRates}
                >
                  <SelectTrigger className="w-16 h-7 text-xs">
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
          </div>

          {/* İndirim ve KDV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="discount" className="text-xs font-medium text-gray-600">
                İndirim
              </Label>
              <div className="flex mt-1">
                <Input
                  id="discount"
                  type="number"
                  value={discountRate || 0}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
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
              <Label htmlFor="vat_rate" className="text-xs font-medium text-gray-600">
                KDV Oranı
              </Label>
              <Select value={(vatRate || 20).toString()} onValueChange={(value) => setVatRate(Number(value))}>
                <SelectTrigger className="mt-1 h-7 text-xs">
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
            <Label htmlFor="description" className="text-xs font-medium text-gray-600">
              Açıklama
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Açıklama"
              rows={2}
              className="mt-1 resize-none text-xs"
            />
          </div>

          {/* Hesaplama Özeti */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center text-sm font-bold mb-2">
              <span className="text-gray-700">TOPLAM</span>
              <span className="text-blue-600">
                {formatCurrency(total, selectedCurrency)}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Ara Toplam:</span>
                <span>{formatCurrency(subtotal, selectedCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span>İndirim:</span>
                <span className="text-red-600">-{formatCurrency(discountAmount, selectedCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span>KDV:</span>
                <span className="text-green-600">+{formatCurrency(vatAmount, selectedCurrency)}</span>
              </div>
            </div>
          </div>

          {/* Uyarı Mesajları */}
          {originalCurrency !== selectedCurrency && (
            <p className="text-xs text-muted-foreground">
              Orijinal: {formatCurrency(originalPrice, originalCurrency)}
            </p>
          )}
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
            <Plus className="h-4 w-4" />
            Ekle
          </UnifiedDialogActionButton>
        </UnifiedDialogFooter>
      </div>
    </UnifiedDialog>
  );
};

export default ProductDetailsModal;