
import React from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCcw } from "lucide-react";
import { CurrencyOption } from "@/components/proposals/form/items/types/currencyTypes";

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (value: string) => void;
  currencyOptions: CurrencyOption[];
  isLoading: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  currencyOptions,
  isLoading
}) => {
  return (
    <>
      <Label htmlFor="currency-select" className="font-medium block mb-2">Para Birimi</Label>
      <Select 
        value={selectedCurrency} 
        onValueChange={onCurrencyChange}
        disabled={isLoading}
      >
        <SelectTrigger id="currency-select" className="w-full h-7 text-xs bg-white">
          <SelectValue placeholder="Para Birimi" />
        </SelectTrigger>
        <SelectContent position="popper" className="bg-white z-[100] min-w-[8rem]">
          {currencyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.symbol} {option.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
          <RefreshCcw className="h-3 w-3 animate-spin" />
          <span>Kurlar yükleniyor...</span>
        </div>
      )}
    </>
  );
};

export default CurrencySelector;
