
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceInputProps {
  value: number | string;
  onChange: (value: number | string) => void;
  label: string;
  id: string;
  placeholder?: string;
}

const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  label,
  id,
  placeholder = "Birim Fiyat"
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-medium">{label}</Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full"
      />
    </div>
  );
};

export default PriceInput;
