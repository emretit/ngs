
import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { CurrencyRatePopover } from "@/components/currency/CurrencyRatePopover";

interface TotalPriceSectionProps {
  unitPrice: number;
  quantity: number;
  discountRate: number;
  taxRate: number;
  calculatedTotal: number;
  setCalculatedTotal: (value: number) => void;
  originalCurrency: string;
  currentCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
}

const TotalPriceSection: React.FC<TotalPriceSectionProps> = ({
  unitPrice,
  quantity,
  discountRate,
  taxRate,
  calculatedTotal,
  setCalculatedTotal,
  originalCurrency,
  currentCurrency,
  formatCurrency
}) => {
  // Re-calculate total when inputs change
  useEffect(() => {
    const baseTotal = unitPrice * quantity;
    const discountAmount = baseTotal * (discountRate / 100);
    const subtotal = baseTotal - discountAmount;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    setCalculatedTotal(total);
  }, [unitPrice, quantity, discountRate, taxRate, setCalculatedTotal]);

  // Calculate values for display
  const baseTotal = unitPrice * quantity;
  const discountAmount = baseTotal * (discountRate / 100);
  const subtotal = baseTotal - discountAmount;
  const taxAmount = subtotal * (taxRate / 100);

  return (
    <Card className="bg-muted/40">
      <CardContent className="p-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Toplam Tutarı</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Birim Fiyat:</span>
            <span>{formatCurrency(unitPrice, originalCurrency)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm">Adet:</span>
            <span>{quantity}</span>
          </div>
          
          {discountRate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span className="text-sm">İndirim ({discountRate}%):</span>
              <span>-{formatCurrency(discountAmount, originalCurrency)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-sm">Ara Toplam:</span>
            <span>{formatCurrency(subtotal, originalCurrency)}</span>
          </div>
          
          <div className="flex justify-between text-muted-foreground">
            <span className="text-sm">KDV ({taxRate}%):</span>
            <span>{formatCurrency(taxAmount, originalCurrency)}</span>
          </div>
          
          <div className="pt-2 border-t flex justify-between">
            <span className="font-medium">Toplam:</span>
            <span className="text-lg font-bold">
              {formatCurrency(calculatedTotal, originalCurrency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalPriceSection;
