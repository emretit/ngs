
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

interface QuantityDepoSectionProps {
  quantity: number;
  setQuantity: (value: number) => void;
  selectedDepo: string;
  setSelectedDepo: (value: string) => void;
  availableStock?: number;
  stockStatus?: string;
}

const QuantityDepoSection: React.FC<QuantityDepoSectionProps> = ({
  quantity,
  setQuantity,
  selectedDepo,
  setSelectedDepo,
  availableStock,
  stockStatus
}) => {
  // Check if quantity exceeds available stock
  const isOverStock = availableStock !== undefined && quantity > availableStock;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Miktar</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className={isOverStock ? "border-red-300 focus-visible:ring-red-400" : ""}
          />
          {isOverStock && (
            <div className="flex items-center text-xs text-red-500 mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>Stok miktarını aşıyor ({availableStock} adet mevcut)</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="depo">Depo</Label>
          <Select value={selectedDepo} onValueChange={setSelectedDepo}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Depo seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ana Depo">Ana Depo</SelectItem>
              <SelectItem value="Yedek Depo">Yedek Depo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {stockStatus === 'low_stock' && (
        <div className="text-amber-500 text-xs">
          <AlertCircle className="h-3 w-3 inline-block mr-1" />
          <span>Stok miktarı düşük, satın alma planlanabilir</span>
        </div>
      )}
    </div>
  );
};

export default QuantityDepoSection;
