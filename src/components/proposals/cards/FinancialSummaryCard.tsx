import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Percent, DollarSign, Receipt } from "lucide-react";
import { formatCurrency, normalizeCurrency } from "@/utils/formatters";
import { useExchangeRates } from "@/hooks/useExchangeRates";

interface FinancialTotals {
  gross: number;
  discount: number;
  net: number;
  vat: number;
  grand: number;
}

interface FinancialSummaryCardProps {
  calculationsByCurrency: Record<string, FinancialTotals>;
  globalDiscountType: 'percentage' | 'amount';
  globalDiscountValue: number;
  onGlobalDiscountTypeChange: (type: 'percentage' | 'amount') => void;
  onGlobalDiscountValueChange: (value: number) => void;
  vatPercentage?: number;
  onVatPercentageChange?: (value: number) => void;
  showVatControl?: boolean;
  inputHeight?: "h-10" | "h-8";
  selectedCurrency?: string;
}

const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  calculationsByCurrency,
  globalDiscountType,
  globalDiscountValue,
  onGlobalDiscountTypeChange,
  onGlobalDiscountValueChange,
  vatPercentage = 20,
  onVatPercentageChange,
  showVatControl = false,
  inputHeight = "h-10",
  selectedCurrency = "TRY"
}) => {
  const currencies = Object.keys(calculationsByCurrency);
  const isMultiCurrency = currencies.length > 1;
  const { exchangeRates } = useExchangeRates();

  // Convert amount to TRY using exchange rates
  const convertToTRY = (amount: number, fromCurrency: string): number => {
    if (normalizeCurrency(fromCurrency) === "TRY") return amount;
    const rate = exchangeRates.find(r => r.currency_code === fromCurrency);
    return rate?.forex_selling ? amount * rate.forex_selling : amount;
  };

  // Get exchange rate for currency
  const getExchangeRate = (currency: string): number | null => {
    if (normalizeCurrency(currency) === "TRY") return null;
    const rate = exchangeRates.find(r => r.currency_code === currency);
    return rate?.forex_selling || null;
  };

  // Get currency icon based on selected currency
  const getCurrencyIcon = (currency: string, size: "large" | "small" = "large"): React.ReactNode => {
    const sizeClass = size === "large" ? "text-lg" : "text-sm";
    switch (currency) {
      case "TRY":
        return <span className={`text-emerald-600 font-bold ${sizeClass}`}>₺</span>;
      case "USD":
        return <span className={`text-emerald-600 font-bold ${sizeClass}`}>$</span>;
      case "EUR":
        return <span className={`text-emerald-600 font-bold ${sizeClass}`}>€</span>;
      case "GBP":
        return <span className={`text-emerald-600 font-bold ${sizeClass}`}>£</span>;
      default:
        return <DollarSign className={`${size === "large" ? "h-4 w-4" : "h-3 w-3"} text-emerald-600`} />;
    }
  };

  // Get primary currency (first one or selected)
  const primaryCurrency = selectedCurrency || currencies[0] || "TRY";
  const displayCurrency = primaryCurrency;

  return (
    <Card className="lg:col-span-1 shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-200/50 flex items-center justify-center">
            {getCurrencyIcon(primaryCurrency)}
          </div>
          <span>Finansal Özet</span>
          {!isMultiCurrency && (
            <span className="text-xs text-muted-foreground font-normal">
              ({displayCurrency})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 px-4 pb-4">
        {/* Multi-currency display */}
        <div className="space-y-4">
          {currencies.map((currency) => {
            const totals = calculationsByCurrency[currency];
            return (
              <div key={currency} className="space-y-3">
                {/* Currency Header */}
                {isMultiCurrency && (
                  <div className="text-right text-sm font-medium text-primary flex items-center justify-end gap-1">
                    <div className="flex items-center">
                      {getCurrencyIcon(currency, "small")}
                    </div>
                    <span>{currency} Toplamları</span>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="space-y-2">
                  {/* Gross Total */}
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 px-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-500 text-right">Brüt Toplam:</span>
                    </div>
                    <span className="font-medium text-sm text-right tabular-nums min-w-[100px]">
                      {formatCurrency(totals.gross, currency)}
                    </span>
                  </div>

                  {/* VAT Control - Only in edit mode */}
                  {showVatControl && onVatPercentageChange && (
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 px-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-orange-400" />
                        <span className="text-xs text-gray-500 text-right">KDV Oranı:</span>
                      </div>
                      <div className="flex items-center gap-1 justify-end min-w-[100px]">
                        <span className="text-xs text-gray-400">%</span>
                        <Input
                          type="number"
                          value={vatPercentage}
                          onChange={(e) => onVatPercentageChange(Number(e.target.value))}
                          placeholder="20"
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-16 h-7 text-xs text-right"
                        />
                      </div>
                    </div>
                  )}

                  {/* Global Discount Controls */}
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 px-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <Receipt className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs text-gray-500 text-right">Genel İndirim:</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end min-w-[100px]">
                      <Select 
                        value={globalDiscountType} 
                        onValueChange={onGlobalDiscountTypeChange}
                      >
                        <SelectTrigger className="w-14 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage" className="text-xs">
                            <div className="flex items-center gap-1">
                              <Percent className="h-3 w-3" />
                              %
                            </div>
                          </SelectItem>
                          <SelectItem value="amount" className="text-xs">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ₺
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={globalDiscountValue}
                        onChange={(e) => onGlobalDiscountValueChange(Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        step={globalDiscountType === 'percentage' ? '0.1' : '0.01'}
                        className="w-16 h-7 text-xs text-right"
                      />
                    </div>
                  </div>

                  {/* Discount Display */}
                  {totals.discount > 0 && (
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 px-2">
                      <span className="text-xs text-red-500 text-right">İndirim:</span>
                      <span className="text-red-500 font-medium text-sm text-right tabular-nums min-w-[100px]">
                        -{formatCurrency(totals.discount, currency)}
                      </span>
                    </div>
                  )}

                  {/* Net Total */}
                  <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 px-2">
                    <span className="text-xs text-gray-500 text-right">Net Toplam:</span>
                    <span className="font-medium text-sm text-right tabular-nums min-w-[100px]">
                      {formatCurrency(totals.net, currency)}
                    </span>
                  </div>

                  {/* VAT Display */}
                  {totals.vat > 0 && (
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-center py-1.5 px-2">
                      <span className="text-xs text-gray-500 text-right">KDV:</span>
                      <span className="font-medium text-sm text-right tabular-nums min-w-[100px]">
                        {formatCurrency(totals.vat, currency)}
                      </span>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2" />

                  {/* Grand Total */}
                  <div className="py-2 px-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
                      <span className="font-semibold text-sm text-emerald-700 text-right">GENEL TOPLAM:</span>
                      <span className="font-bold text-base text-emerald-600 text-right tabular-nums min-w-[100px]">
                        {formatCurrency(totals.grand, currency)}
                      </span>
                    </div>
                    {normalizeCurrency(currency) !== "TRY" && (() => {
                      const exchangeRate = getExchangeRate(currency);
                      return (
                        <div className="grid grid-cols-[1fr_auto] gap-3 items-center mt-1">
                          {exchangeRate && (
                            <span className="text-[9px] text-emerald-600/50 text-right">
                              (Kur: {exchangeRate.toFixed(4)})
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-600/70 text-right tabular-nums min-w-[100px]">
                            {formatCurrency(convertToTRY(totals.grand, currency), "TRY")}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryCard;
