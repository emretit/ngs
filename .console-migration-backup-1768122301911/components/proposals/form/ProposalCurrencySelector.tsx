
import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, AlertCircle, ArrowRightLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrencyOptions } from "./items/utils/currencyUtils";
import { CurrencyRatePopover } from "@/components/currency/CurrencyRatePopover";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProposalItem } from "@/types/proposal";

interface ProposalCurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  items?: ProposalItem[];
  onItemsChange?: (items: ProposalItem[]) => void;
}

const ProposalCurrencySelector: React.FC<ProposalCurrencySelectorProps> = ({ 
  selectedCurrency, 
  onCurrencyChange,
  items = [],
  onItemsChange
}) => {
  const currencyOptions = getCurrencyOptions();
  // Use the dashboard exchange rates to show the TRY equivalent
  const { exchangeRates, formatCurrency, refreshExchangeRates, convertCurrency } = useExchangeRates();

  // Refresh exchange rates when component loads
  useEffect(() => {
    console.log("ProposalCurrencySelector loaded, refreshing rates");
    refreshExchangeRates();
  }, [refreshExchangeRates]);

  // Get the exchange rate for the selected currency
  const getExchangeRateInfo = () => {
    if (selectedCurrency === "TRY") {
      return null; // No need to show conversion for TRY
    }
    
    // Find the currency in the exchange rates
    const rate = exchangeRates.find(rate => rate.currency_code === selectedCurrency);
    
    if (rate && rate.forex_selling) {
      console.log(`Found rate for ${selectedCurrency}:`, rate.forex_selling);
      return {
        rate: rate.forex_selling,
        formattedRate: formatCurrency(rate.forex_selling, "TRY")
      };
    }
    
    console.log(`No rate found for ${selectedCurrency} in:`, exchangeRates);
    return null;
  };

  // Handle currency change and automatically convert all products' prices
  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency === selectedCurrency) return;
    
    // First change the currency
    onCurrencyChange(newCurrency);
    
    // If there are items and onItemsChange callback, convert the items' currencies
    if (items.length > 0 && onItemsChange) {
      console.log(`Converting all items from ${selectedCurrency} to ${newCurrency}`);
      
      const updatedItems = items.map(item => {
        // If item has original currency info, convert from that to maintain accuracy
        const sourceCurrency = item.original_currency || item.currency || selectedCurrency;
        const sourcePrice = 
          sourceCurrency === item.original_currency && item.original_price !== undefined
            ? item.original_price
            : item.unit_price;
            
        console.log(`Converting item ${item.name} from ${sourceCurrency} to ${newCurrency}`);
        console.log(`Original price: ${sourcePrice} ${sourceCurrency}`);

        // Convert the currency
        const convertedPrice = convertCurrency(sourcePrice, sourceCurrency, newCurrency);
        console.log(`Converted price: ${convertedPrice} ${newCurrency}`);
        
        // Calculate total with tax and discount rates
        const quantity = Number(item.quantity || 1);
        const discountRate = Number(item.discount_rate || 0);
        const taxRate = Number(item.tax_rate || 0);
        
        // Apply discount
        const discountedPrice = convertedPrice * (1 - discountRate / 100);
        // Calculate total with tax
        const totalPrice = quantity * discountedPrice * (1 + taxRate / 100);

        return {
          ...item,
          unit_price: convertedPrice,
          total_price: totalPrice,
          currency: newCurrency
        };
      });
      
      // Update the items with converted prices
      onItemsChange(updatedItems);
      toast.success(`Tüm kalemler ${newCurrency} para birimine dönüştürüldü`);
    }
  };

  const exchangeRateInfo = getExchangeRateInfo();

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <span className="text-base font-medium">
              Teklif Para Birimi:
            </span>
          </div>
          
          <CurrencyRatePopover
            selectedCurrency={selectedCurrency}
            onCurrencyChange={handleCurrencyChange}
            triggerClassName="w-[50px]"
          />
          
          {exchangeRateInfo ? (
            <div className="flex items-center gap-2 ml-2">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="font-normal">
                1 {selectedCurrency} = {exchangeRateInfo.formattedRate}
              </Badge>
            </div>
          ) : selectedCurrency !== "TRY" && (
            <div className="flex items-center gap-2 ml-2">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="font-normal text-muted-foreground">
                Kur bilgisi yükleniyor...
              </Badge>
            </div>
          )}
          
          <Alert variant="default" className="bg-muted/50 border-muted-foreground/20 ml-auto hidden sm:flex max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seçilen para birimi, tüm teklif kalemlerinin dönüştürüleceği ana para birimidir.
            </AlertDescription>
          </Alert>
        </div>
        
        <Alert variant="default" className="bg-muted/50 border-muted-foreground/20 mt-4 sm:hidden">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Seçilen para birimi, tüm teklif kalemlerinin dönüştürüleceği ana para birimidir.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default ProposalCurrencySelector;
