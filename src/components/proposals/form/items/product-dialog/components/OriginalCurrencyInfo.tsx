
import React from "react";
import { BadgeDollarSign, BadgeEuro, BadgePoundSterling, InfoIcon } from "lucide-react";

interface OriginalCurrencyInfoProps {
  originalCurrency: string;
  originalPrice: number;
  formatCurrency: (amount: number, currency?: string) => string;
}

const OriginalCurrencyInfo: React.FC<OriginalCurrencyInfoProps> = ({
  originalCurrency,
  originalPrice,
  formatCurrency
}) => {
  if (!originalCurrency || !originalPrice) {
    return null;
  }
  
  // Get currency icon based on currency code
  const getCurrencyIcon = () => {
    switch (originalCurrency) {
      case "USD":
        return <BadgeDollarSign className="h-4 w-4" />;
      case "EUR":
        return <BadgeEuro className="h-4 w-4" />;
      case "GBP":
        return <BadgePoundSterling className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded-md flex items-start gap-2 text-sm">
      <InfoIcon className="h-4 w-4 text-blue-500 mt-0.5" />
      <div>
        <span className="text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
          Orijinal Para Birimi: {originalCurrency} {getCurrencyIcon()}
        </span>
        <span className="text-blue-600 dark:text-blue-300">
          Fiyat: {formatCurrency(originalPrice, originalCurrency)}
        </span>
        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
          Bu ürünün orijinal fiyatı {formatCurrency(originalPrice, originalCurrency)} olarak tanımlanmış.
        </p>
      </div>
    </div>
  );
};

export default OriginalCurrencyInfo;
