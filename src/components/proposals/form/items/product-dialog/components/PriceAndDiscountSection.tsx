
import React, { useState, useEffect } from "react";
import { getCurrencyOptions, fetchTCMBExchangeRates } from "../../utils/currencyUtils";
import { toast } from "sonner";

// Import refactored components
import PriceInput from "./price-section/PriceInput";
import TaxRateSelector from "./price-section/TaxRateSelector";

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
  const [localPrice, setLocalPrice] = useState<number | string>(customPrice || convertedPrice);
  const [localDiscountRate, setLocalDiscountRate] = useState(discountRate);
  const [exchangeRates, setExchangeRates] = useState({
    TRY: 1,
    USD: 32.5,
    EUR: 35.2,
    GBP: 41.3
  });
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    // Always use the original product price whenever customPrice or convertedPrice changes
    setLocalPrice(customPrice || convertedPrice);
    setLocalDiscountRate(discountRate);
  }, [customPrice, convertedPrice, discountRate]);

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-1">
          <PriceInput
            id="unit-price"
            label={`Birim Fiyat (${originalCurrency})`}
            value={localPrice}
            onChange={handlePriceChange}
          />
        </div>

        <div className="col-span-1">
          <PriceInput
            id="discount-rate"
            label="İndirim Oranı (%)"
            value={localDiscountRate}
            onChange={handleDiscountChange}
            placeholder="İndirim Oranı"
          />
        </div>
      </div>
      
      {/* PriceSummary component removed from here to avoid duplication */}
    </div>
  );
};

export default PriceAndDiscountSection;
