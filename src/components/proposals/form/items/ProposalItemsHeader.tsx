
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ProposalItemsHeaderProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  onAddItem: () => void;
  onOpenProductDialog: () => void;
  currencyOptions: { value: string; label: string }[];
  isGlobalCurrencyEnabled?: boolean;
}

const ProposalItemsHeader: React.FC<ProposalItemsHeaderProps> = ({ 
  selectedCurrency, 
  onCurrencyChange, 
  onAddItem, 
  onOpenProductDialog,
  currencyOptions,
  isGlobalCurrencyEnabled = true
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
      <h3 className="text-lg font-medium">Teklif Kalemleri</h3>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        {isGlobalCurrencyEnabled && (
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm text-muted-foreground">Para Birimi:</span>
            <Select 
              value={selectedCurrency} 
              onValueChange={onCurrencyChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Para Birimi" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddItem}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Manuel Ekle
        </Button>
        
        <Button 
          size="sm" 
          onClick={onOpenProductDialog}
          className="w-full sm:w-auto"
        >
          <Search className="h-4 w-4 mr-2" />
          Ürün Ekle
        </Button>
      </div>
    </div>
  );
};

export default ProposalItemsHeader;
