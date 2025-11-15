
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
  const netAmount = subtotal;
  const taxAmount = subtotal * (taxRate / 100);

  return (
    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700">Hesaplama Özeti</span>
      </div>
      <div className="text-xs text-gray-600 space-y-0.5 mb-1.5">
        <div className="flex justify-between items-center">
          <span>Ara Toplam:</span>
          <span className="w-24 text-center">{formatCurrency(subtotal, originalCurrency)}</span>
        </div>
        {discountRate > 0 && (
          <div className="flex justify-between items-center">
            <span>İndirim:</span>
            <span className="w-24 text-center text-red-600">-{formatCurrency(discountAmount, originalCurrency)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span>Net Toplam:</span>
          <span className="w-24 text-center">{formatCurrency(netAmount, originalCurrency)}</span>
          </div>
        <div className="flex justify-between items-center">
          <span>KDV:</span>
          <span className="w-24 text-center text-green-600">+{formatCurrency(taxAmount, originalCurrency)}</span>
            </div>
          </div>
      <div className="flex justify-between items-center text-sm font-bold pt-1.5 border-t border-gray-300">
        <span className="text-gray-700">TOPLAM</span>
        <span className="w-24 text-center text-blue-600">
              {formatCurrency(calculatedTotal, originalCurrency)}
            </span>
          </div>
        </div>
  );
};

export default TotalPriceSection;
