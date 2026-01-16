import React from "react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { DollarSign, Euro, PoundSterling, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BalanceDisplayProps {
  amount: number;
  currency?: string;
  showTLEquivalent?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  amount,
  currency = 'TRY',
  showTLEquivalent = true,
  className = '',
  size = 'sm'
}) => {
  const { convertCurrency, formatCurrency } = useExchangeRates();
  
  // Normalize currency code
  const normalizedCurrency = currency === 'TL' ? 'TRY' : (currency || 'TRY');
  
  // Get currency icon
  const getCurrencyIcon = (currencyCode: string) => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
    
    switch (currencyCode) {
      case 'USD':
        return <DollarSign className={iconSize} />;
      case 'EUR':
        return <Euro className={iconSize} />;
      case 'GBP':
        return <PoundSterling className={iconSize} />;
      case 'TRY':
      case 'TL':
        return <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>₺</span>;
      default:
        return <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}>{currencyCode}</span>;
    }
  };
  
  // Format amount with proper locale
  const formatAmount = (value: number, curr: string) => {
    const currCode = curr === 'TL' ? 'TRY' : curr;
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Calculate TL equivalent if currency is not TRY
  const tlEquivalent = normalizedCurrency !== 'TRY' 
    ? convertCurrency(amount, normalizedCurrency, 'TRY')
    : null;
  
  // Color based on balance
  const balanceColor = amount >= 0 ? 'text-green-600' : 'text-red-600';
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const content = (
    <div className={`flex items-center gap-1 ${balanceColor} ${sizeClasses[size]} font-medium ${className}`}>
      {getCurrencyIcon(normalizedCurrency)}
      <span>{formatAmount(amount, normalizedCurrency)}</span>
      {showTLEquivalent && tlEquivalent !== null && (
        <span className="text-muted-foreground font-normal">
          (₺{formatAmount(tlEquivalent, 'TRY')})
        </span>
      )}
    </div>
  );

  // If showing TL equivalent, wrap with tooltip for more info
  if (showTLEquivalent && tlEquivalent !== null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p>Orijinal: {getCurrencyIcon(normalizedCurrency)} {formatAmount(amount, normalizedCurrency)}</p>
              <p>TL Karşılığı: ₺{formatAmount(tlEquivalent, 'TRY')}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

export default BalanceDisplay;
