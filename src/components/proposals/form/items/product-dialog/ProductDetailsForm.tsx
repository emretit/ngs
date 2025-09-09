
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/types/product";

interface ProductDetailsFormProps {
  selectedProduct: Product;
  quantity: number;
  setQuantity: (quantity: number) => void;
  customPrice: number | undefined;
  setCustomPrice: (price: number) => void;
  selectedDepo: string;
  setSelectedDepo: (depo: string) => void;
  discountRate: number;
  setDiscountRate: (rate: number) => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

const ProductDetailsForm: React.FC<ProductDetailsFormProps> = ({
  selectedProduct,
  quantity,
  setQuantity,
  customPrice,
  setCustomPrice,
  selectedDepo,
  setSelectedDepo,
  discountRate,
  setDiscountRate,
  formatCurrency,
}) => {
  // Simple depo options - in a real app would be fetched from backend
  const depoOptions = [
    { value: "Ana Depo", label: "Ana Depo" },
    { value: "Yedek Depo", label: "Yedek Depo" },
    { value: "Satış Depo", label: "Satış Depo" },
  ];

  // Calculate final price with discount
  const calculateFinalPrice = () => {
    if (customPrice === undefined) return 0;
    const discountAmount = customPrice * (discountRate / 100);
    return customPrice - discountAmount;
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    return calculateFinalPrice() * quantity;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="product-depo">Depo Seçimi</Label>
          <Select value={selectedDepo} onValueChange={setSelectedDepo}>
            <SelectTrigger id="product-depo">
              <SelectValue placeholder="Depo seçin" />
            </SelectTrigger>
            <SelectContent>
              {depoOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="product-quantity">Adet</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="product-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full"
            />
          </div>
          {selectedProduct.stock_quantity !== undefined && selectedProduct.stock_quantity < quantity && (
            <p className="text-sm text-destructive mt-1">
              Uyarı: Stokta sadece {selectedProduct.stock_quantity} adet bulunmaktadır.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="product-price">Birim Fiyat ({selectedProduct.currency})</Label>
          <Input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={customPrice}
            onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
            className="w-full"
          />
          {customPrice !== selectedProduct.price && (
            <p className="text-xs text-muted-foreground mt-1">
              Standart fiyat: {formatCurrency(selectedProduct.price, selectedProduct.currency)}
            </p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="discount-rate">İndirim Oranı (%{discountRate})</Label>
            <span className="text-sm text-muted-foreground">
              {formatCurrency(calculateFinalPrice(), selectedProduct.currency)}
            </span>
          </div>
          <Slider
            id="discount-rate"
            value={[discountRate]}
            min={0}
            max={100}
            step={1}
            onValueChange={(values) => setDiscountRate(values[0])}
            className="my-2"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-4 bg-muted/40">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ürün:</span>
              <span className="font-medium">{selectedProduct.name}</span>
            </div>
            
            {selectedProduct.sku && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">SKU:</span>
                <span>{selectedProduct.sku}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Stok:</span>
              <span>{selectedProduct.stock_quantity || 0} {selectedProduct.unit}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Birim Fiyat:</span>
              <span>{formatCurrency(calculateFinalPrice(), selectedProduct.currency)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Miktar:</span>
              <span>{quantity} {selectedProduct.unit}</span>
            </div>
            
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Toplam:</span>
              <span className="font-bold">
                {formatCurrency(calculateTotalPrice(), selectedProduct.currency)}
              </span>
            </div>
          </div>
        </Card>

        {selectedProduct.description && (
          <div>
            <Label className="block mb-2">Ürün Açıklaması</Label>
            <div className="p-3 bg-muted/30 rounded text-sm">
              {selectedProduct.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsForm;
