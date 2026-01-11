
import React, { useState, useEffect } from "react";
import { getCurrencyOptions } from "../../utils/currencyUtils";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PriceAndDiscountSectionProps {
  customPrice: number | undefined;
  setCustomPrice: (value: number | undefined) => void;
  discountRate: number;
  setDiscountRate: (value: number) => void;
  selectedCurrency: string;
  handleCurrencyChange: (value: string) => void;
  convertedPrice: number;
  originalCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
}

const PriceAndDiscountSection: React.FC<PriceAndDiscountSectionProps> = ({
  customPrice,
  setCustomPrice,
  discountRate,
  setDiscountRate,
  selectedCurrency,
  handleCurrencyChange,
  convertedPrice,
  originalCurrency,
  formatCurrency
}) => {
  const currencyOptions = getCurrencyOptions();
  // Always use the product's original price and currency
  const [localPrice, setLocalPrice] = useState<number | string>(customPrice ?? convertedPrice);
  const [localDiscountRate, setLocalDiscountRate] = useState(discountRate);
  
  // Use centralized exchange rates hook instead of deprecated fetchTCMBExchangeRates
  const { exchangeRates: dashboardRates } = useExchangeRates();
  
  // Convert dashboard format to simple object format
  const exchangeRates = React.useMemo(() => {
    const rates: Record<string, number> = { TRY: 1 };
    dashboardRates.forEach(rate => {
      if (rate.currency_code && rate.forex_selling) {
        rates[rate.currency_code] = rate.forex_selling;
      }
    });
    // Fallback values if rates not available
    if (!rates.USD) rates.USD = 32.5;
    if (!rates.EUR) rates.EUR = 35.2;
    if (!rates.GBP) rates.GBP = 41.3;
    return rates;
  }, [dashboardRates]);

  // Sync local state with props - always sync when props change
  useEffect(() => {
    const priceToUse = customPrice !== undefined ? customPrice : convertedPrice;
    console.log('PriceAndDiscountSection sync - customPrice:', customPrice, 'convertedPrice:', convertedPrice, 'using:', priceToUse);
    setLocalPrice(priceToUse);
  }, [customPrice, convertedPrice]);

  useEffect(() => {
    setLocalDiscountRate(discountRate);
  }, [discountRate]);

  const calculateTotalPrice = () => {
    const price = Number(localPrice);
    const discount = Number(localDiscountRate);
    const calculatedTotal = price * (1 + (discount / 100));
    return calculatedTotal;
  };

  const handlePriceChange = (value: number | string) => {
    setLocalPrice(value);
    setCustomPrice(Number(value));
  };

  const handleDiscountChange = (value: number | string) => {
    const numValue = Number(value);
    setLocalDiscountRate(numValue);
    setDiscountRate(numValue);
  };

  return (
    <div>
      <Label htmlFor="unit_price" className="text-xs font-medium text-gray-600">
        Birim Fiyat
      </Label>
      <div className="flex gap-1.5 mt-0.5">
        <Input
          id="unit_price"
          type="number"
          value={localPrice || 0}
          onChange={(e) => {
            const value = e.target.value;
            handlePriceChange(value === "" ? 0 : Number(value));
          }}
          step="0.0001"
          placeholder="0.0000"
          className="flex-1 h-7 text-xs"
        />
        <Select 
          value={selectedCurrency} 
          onValueChange={handleCurrencyChange}
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
  );
};

export default PriceAndDiscountSection;
