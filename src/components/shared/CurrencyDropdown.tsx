
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyOption } from "@/components/proposals/form/items/types/currencyTypes";
import { BadgeDollarSign, BadgeEuro, BadgePoundSterling, BadgeJapaneseYen } from "lucide-react";

interface CurrencyDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  currencyOptions: CurrencyOption[];
  triggerClassName?: string;
  placeholder?: string;
  disabled?: boolean;
}

const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({
  value,
  onValueChange,
  currencyOptions,
  triggerClassName = "",
  placeholder = "Para Birimi",
  disabled = false
}) => {
  // Get currency icon based on currency code
  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case "USD":
        return <BadgeDollarSign className="h-4 w-4 mr-2" />;
      case "EUR":
        return <BadgeEuro className="h-4 w-4 mr-2" />;
      case "GBP":
        return <BadgePoundSterling className="h-4 w-4 mr-2" />;
      case "JPY":
        return <BadgeJapaneseYen className="h-4 w-4 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {currencyOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center">
              {getCurrencyIcon(option.value)}
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencyDropdown;
