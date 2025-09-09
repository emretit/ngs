
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TaxRateSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const TaxRateSelector: React.FC<TaxRateSelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="vat-rate" className="font-medium">KDV Oranı (%)</Label>
      <Select 
        value={`${value}`}
        onValueChange={(value) => onChange(Number(value))}
      >
        <SelectTrigger id="vat-rate" className="w-full">
          <SelectValue placeholder="KDV Oranı" />
        </SelectTrigger>
        <SelectContent position="popper" className="bg-white z-[100]">
          {[20, 18, 10, 0].map((rate) => (
            <SelectItem key={rate} value={`${rate}`}>
              {rate}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TaxRateSelector;
