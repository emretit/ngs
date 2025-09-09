
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface PriceSummaryProps {
  unitPrice: number;
  quantity: number;
  discountRate: number;
  taxRate: number;
  calculatedTotal: number;
  originalCurrency: string;
  currentCurrency: string;
  formatCurrency: (amount: number, currency?: string) => string;
  convertedPrice: number;
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  unitPrice,
  quantity,
  discountRate,
  taxRate,
  calculatedTotal,
  originalCurrency,
  currentCurrency,
  formatCurrency,
  convertedPrice
}) => {
  // Calculate values
  const baseTotal = unitPrice * quantity;
  const discountAmount = baseTotal * (discountRate / 100);
  const subtotal = baseTotal - discountAmount;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;
  
  const { exchangeRates, loading } = useExchangeRates();
  const [rate, setRate] = useState<number | null>(null);
  
  // Get exchange rate from TCMB data
  useEffect(() => {
    if (exchangeRates && exchangeRates.length > 0 && originalCurrency !== currentCurrency) {
      // Find the currency rates
      const sourceCurrencyRate = exchangeRates.find(r => r.currency_code === originalCurrency);
      const targetCurrencyRate = exchangeRates.find(r => r.currency_code === currentCurrency);
      
      if (sourceCurrencyRate && targetCurrencyRate && sourceCurrencyRate.forex_selling && targetCurrencyRate.forex_selling) {
        // Calculate cross-rate
        const crossRate = targetCurrencyRate.forex_selling / sourceCurrencyRate.forex_selling;
        setRate(crossRate);
      } else if (originalCurrency === 'TRY' && targetCurrencyRate && targetCurrencyRate.forex_selling) {
        // TRY to foreign currency
        setRate(1 / targetCurrencyRate.forex_selling);
      } else if (currentCurrency === 'TRY' && sourceCurrencyRate && sourceCurrencyRate.forex_selling) {
        // Foreign currency to TRY
        setRate(sourceCurrencyRate.forex_selling);
      }
    }
  }, [exchangeRates, originalCurrency, currentCurrency]);

  return (
    <Card className="bg-muted/40">
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Birim Fiyat:</span>
            <span className="font-medium">
              {formatCurrency(unitPrice, originalCurrency)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm">Adet:</span>
            <span className="font-medium">{quantity}</span>
          </div>
          
          {discountRate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span className="text-sm">İndirim ({discountRate}%):</span>
              <span className="font-medium">
                -{formatCurrency(discountAmount, originalCurrency)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-sm">Ara Toplam:</span>
            <span className="font-medium">
              {formatCurrency(subtotal, originalCurrency)}
            </span>
          </div>
          
          <div className="flex justify-between text-muted-foreground">
            <span className="text-sm">KDV ({taxRate}%):</span>
            <span className="font-medium">
              {formatCurrency(taxAmount, originalCurrency)}
            </span>
          </div>
          
          {originalCurrency !== currentCurrency && (
            <div className="mt-1 p-1.5 rounded-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400">
                <span>TCMB Döviz Kuru:</span>
                <span className="font-medium">
                  {loading ? 'Yükleniyor...' : rate ? 
                    `1 ${originalCurrency} = ${rate.toFixed(4)} ${currentCurrency}` : 
                    'Kur bilgisi bulunamadı'}
                </span>
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">Toplam:</span>
            </div>
            <span className="text-lg font-bold">
              {formatCurrency(total, originalCurrency)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceSummary;
