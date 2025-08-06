import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Plus } from "lucide-react";
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
}

const ProductDetailsModal = ({ 
  open, 
  onOpenChange, 
  product, 
  onAddToProposal,
  currency 
}: ProductDetailsModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [vatRate, setVatRate] = useState(20);
  const [discountRate, setDiscountRate] = useState(0);
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("adet");
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [originalCurrency, setOriginalCurrency] = useState("");

  const {
    currencyOptions,
    formatCurrency: formatCurrencyValue,
    convertAmount,
    isLoadingRates,
    exchangeRates
  } = useCurrencyManagement();

  useEffect(() => {
    if (product && open) {
      const productCurrency = product.currency || "TRY";
      setOriginalPrice(product.price);
      setOriginalCurrency(productCurrency);
      setSelectedCurrency(productCurrency);
      setUnitPrice(product.price);
      setDescription(product.description || product.name);
      setUnit(product.unit || "adet");
      setVatRate(product.tax_rate || 20);
    }
  }, [product, open]);

  // Handle currency conversion when currency changes
  useEffect(() => {
    if (originalPrice && originalCurrency && selectedCurrency !== originalCurrency && exchangeRates) {
      const convertedPrice = convertAmount(originalPrice, originalCurrency, selectedCurrency);
      setUnitPrice(Number(convertedPrice.toFixed(2)));
    } else if (selectedCurrency === originalCurrency) {
      setUnitPrice(originalPrice);
    }
  }, [selectedCurrency, originalPrice, originalCurrency, convertAmount, exchangeRates]);

  const calculateTotals = () => {
    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discountRate) / 100;
    const netAmount = subtotal - discountAmount;
    const vatAmount = (netAmount * vatRate) / 100;
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
    if (!product) return;

    onAddToProposal({
      name: product.name,
      description,
      quantity,
      unit,
      unit_price: unitPrice,
      vat_rate: vatRate,
      discount_rate: discountRate,
      total_price: total,
      currency: selectedCurrency,
      original_price: originalPrice,
      original_currency: originalCurrency
    });

    onOpenChange(false);
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);
  };

  const showStockWarning = product && quantity > product.stock_quantity;
  const showCurrencyWarning = product && product.currency !== selectedCurrency;

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-primary/10 -m-6 mb-4 p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-primary">
              {product.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {product.sku && (
            <p className="text-sm text-muted-foreground">Ürün Kodu: {product.sku}</p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {showStockWarning && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>Stok Uyarısı!</strong> Seçilen miktar ({quantity}) mevcut stoktan ({product?.stock_quantity}) fazla.
              </AlertDescription>
            </Alert>
          )}

          {showCurrencyWarning && (
            <Alert>
              <AlertDescription>
                <strong>Para Birimi Uyarısı!</strong> Bu ürün kartındaki fiyat ({originalCurrency}) ile seçilen para birimi ({selectedCurrency}) farklı.
                Günlük kur üzerinden otomatik olarak fiyat hesaplanmıştır. Dilerseniz hesaplanan rakamı değiştirebilirsiniz.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">
                Miktar (Ad)
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="unit" className="text-sm font-medium">
                Birim
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="unit_price" className="text-sm font-medium">
                  Birim Fiyat ({selectedCurrency})
                </Label>
                <Input
                  id="unit_price"
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  step="0.01"
                  className="mt-1"
                />
                {originalCurrency !== selectedCurrency && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Orijinal fiyat: {formatCurrencyValue(originalPrice, originalCurrency)}
                  </p>
                )}
              </div>

              <div>
                <CurrencySelector
                  selectedCurrency={selectedCurrency}
                  onCurrencyChange={handleCurrencyChange}
                  currencyOptions={currencyOptions}
                  isLoading={isLoadingRates}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="vat_rate" className="text-sm font-medium">
                  KDV(%)
                </Label>
                <Select value={vatRate.toString()} onValueChange={(value) => setVatRate(Number(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">%0</SelectItem>
                    <SelectItem value="1">%1</SelectItem>
                    <SelectItem value="8">%8</SelectItem>
                    <SelectItem value="18">%18</SelectItem>
                    <SelectItem value="20">%20</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="discount" className="text-sm font-medium">
                  İndirim
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="discount"
                    type="number"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                    step="0.01"
                    max="100"
                    className="rounded-r-none"
                  />
                  <div className="px-3 py-2 bg-muted border border-l-0 rounded-r-md text-sm">
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>TOPLAM</span>
              <span className="text-primary">
                {formatCurrencyValue(total, selectedCurrency)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              (Ara Toplam: {formatCurrencyValue(subtotal, selectedCurrency)} - 
              İndirim: {formatCurrencyValue(discountAmount, selectedCurrency)} + 
              KDV: {formatCurrencyValue(vatAmount, selectedCurrency)})
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Açıklama
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İsteğe bağlı açıklama girebilirsiniz"
              rows={3}
              className="mt-1 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleAddToProposal}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Ekle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;