
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, Clock, RefreshCcw } from "lucide-react";
import { getCurrencyOptions } from "@/components/proposals/form/items/utils/currencyUtils";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface CurrencyRatePopoverProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  triggerClassName?: string;
}

export function CurrencyRatePopover({
  selectedCurrency,
  onCurrencyChange,
  triggerClassName = "",
}: CurrencyRatePopoverProps) {
  const { exchangeRates, lastUpdate, refreshExchangeRates, loading } = useExchangeRates();
  const currencyOptions = getCurrencyOptions();
  
  const getLastUpdateText = () => {
    if (!lastUpdate) return "Güncelleme bilgisi yok";
    
    try {
      const date = new Date(lastUpdate);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date parsing error:', error);
      return 'Geçersiz tarih';
    }
  };
  
  const formatRate = (currency: string) => {
    if (!exchangeRates || exchangeRates.length === 0) return "---";
    
    const rate = exchangeRates.find(r => r.currency_code === currency);
    if (!rate) return "---";
    
    return rate.forex_selling ? rate.forex_selling.toFixed(4) : "---";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-10 px-3 ${triggerClassName}`}
        >
          {selectedCurrency === 'TL' ? 'TL' : selectedCurrency}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              <span>{getLastUpdateText()}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2" 
              onClick={refreshExchangeRates}
              disabled={loading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {currencyOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedCurrency === option.value ? "default" : "ghost"}
                className="justify-between h-8"
                onClick={() => onCurrencyChange(option.value)}
              >
                <span>{option.symbol} {option.value === 'TL' ? 'TL' : option.value}</span>
                {option.value !== "TL" && <span className="text-xs opacity-70">{formatRate(option.value)}</span>}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
