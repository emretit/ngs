
import React, { useState, useEffect } from "react";
import { getCurrencyOptions, fetchTCMBExchangeRates } from "../../utils/currencyUtils";
import { toast } from "sonner";
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
  const [exchangeRates, setExchangeRates] = useState({
    TRY: 1,
    USD: 32.5,
    EUR: 35.2,
    GBP: 41.3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch exchange rates when component mounts
  useEffect(() => {
    const getExchangeRates = async () => {
      setIsLoading(true);
      try {
        const rates = await fetchTCMBExchangeRates();
        // Ensure all required currencies exist in the rates object
        const completeRates = {
          TRY: rates.TRY || 1,
          USD: rates.USD || 32.5,
          EUR: rates.EUR || 35.2,
          GBP: rates.GBP || 41.3
        };
        setExchangeRates(completeRates);
        console.log("Exchange rates updated:", completeRates);
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        toast.error("Güncel döviz kurları alınamadı, varsayılan değerler kullanılıyor");
      } finally {
        setIsLoading(false);
      }
    };

    getExchangeRates();
  }, []);

  // Sync local state with props - but only update when props actually change from parent
  useEffect(() => {
    // If customPrice is explicitly provided (not undefined), use it
    if (customPrice !== undefined) {
      setLocalPrice(customPrice);
    } else if (!initialized) {
      // Only use convertedPrice as fallback on first initialization
      setLocalPrice(convertedPrice);
      setInitialized(true);
    }
  }, [customPrice, convertedPrice, initialized]);

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
