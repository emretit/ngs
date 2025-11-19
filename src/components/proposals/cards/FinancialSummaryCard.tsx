import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, Percent, DollarSign, Receipt, Coins } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

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

  // Get currency icon based on selected currency
  const getCurrencyIcon = (currency: string, size: "large" | "small" = "large"): React.ReactNode => {
    const normalizedCurrency = currency === "TRY" ? "TL" : currency;
    const sizeClass = size === "large" ? "text-lg" : "text-sm";
    switch (normalizedCurrency) {
      case "TL":
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
  const displayCurrency = primaryCurrency === "TRY" ? "TL" : primaryCurrency;

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
                    <span>{currency === "TRY" ? "TL" : currency} Toplamları</span>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="space-y-3">
                  {/* Gross Total */}
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Brüt Toplam:
                    </span>
                    <span className="font-semibold text-sm">{formatCurrency(totals.gross, currency)}</span>
                  </div>

                  {/* VAT Control - Only in edit mode */}
                  {showVatControl && onVatPercentageChange && (
                    <div className="border border-orange-200 rounded-lg p-3 bg-orange-50/30">
                      <div className="text-xs text-center text-orange-700 font-medium mb-2 flex items-center justify-center gap-1">
                        <Percent className="h-3 w-3" />
                        KDV Oranı
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={vatPercentage}
                          onChange={(e) => onVatPercentageChange(Number(e.target.value))}
                          placeholder="20"
                          min="0"
                          max="100"
                          step="0.1"
                          className={`flex-1 ${inputHeight}`}
                        />
                        <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs flex items-center rounded font-medium">
                          %
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Global Discount Controls */}
                  <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/30">
                    <div className="text-xs text-center text-blue-700 font-medium mb-2 flex items-center justify-center gap-1">
                      <Receipt className="h-3 w-3" />
                      Genel İndirim
                    </div>
                    <div className="flex gap-2">
                      <Select 
                        value={globalDiscountType} 
                        onValueChange={onGlobalDiscountTypeChange}
                      >
                        <SelectTrigger className={`w-16 ${inputHeight}`}>
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
                        className={`flex-1 ${inputHeight}`}
                      />
                    </div>
                  </div>

                  {/* Discount Display */}
                  {totals.discount > 0 && (
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-red-600 text-xs font-medium">İndirim:</span>
                      <span className="text-red-600 font-semibold text-sm">
                        -{formatCurrency(totals.discount, currency)}
                      </span>
                    </div>
                  )}

                  {/* Net Total */}
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-600 font-medium">Net Toplam:</span>
                    <span className="font-semibold text-sm">{formatCurrency(totals.net, currency)}</span>
                  </div>

                  {/* VAT Display */}
                  {totals.vat > 0 && (
                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                      <span className="text-purple-600 text-xs font-medium">KDV:</span>
                      <span className="text-purple-600 font-semibold text-sm">
                        {formatCurrency(totals.vat, currency)}
                      </span>
                    </div>
                  )}

                  <Separator className="my-2" />

                  {/* Grand Total */}
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200">
                    <span className="font-bold text-sm text-emerald-800">GENEL TOPLAM:</span>
                    <span className="font-bold text-lg text-emerald-600">
                      {formatCurrency(totals.grand, currency)}
                    </span>
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
