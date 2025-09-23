import React from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useExchangeRates, ExchangeRate } from "@/hooks/useExchangeRates";

const ExchangeRateCard: React.FC = () => {
  const { exchangeRates, loading, error, lastUpdate, refreshExchangeRates } = useExchangeRates();

  // Format number with 4 decimal places
  const formatRate = (rate: number | null) => {
    if (rate === null) return '-';
    return rate.toFixed(4);
  };

  // Format date consistently
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Güncelleme bilgisi alınamadı';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date parsing error:', error);
      return 'Geçersiz tarih';
    }
  };

  // Filter rates to only show USD, EUR, and GBP
  const filteredRates = exchangeRates.filter(rate => 
    ["USD", "EUR", "GBP"].includes(rate.currency_code)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-bold">Döviz Kurları</CardTitle>
          <CardDescription>
            {formatDate(lastUpdate)}
          </CardDescription>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={refreshExchangeRates}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Döviz kurlarını güncelle</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center gap-2 p-4 text-red-500 bg-red-50 rounded-md">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Döviz kurları yüklenemedi</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <Skeleton className="h-5 w-10" />
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Para Birimi</th>
                  <th className="text-right p-2 font-medium">Forex Alış</th>
                  <th className="text-right p-2 font-medium">Teklif Kuru (Satış)</th>
                  <th className="text-right p-2 font-medium">Efektif Alış</th>
                  <th className="text-right p-2 font-medium">Efektif Satış</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate: ExchangeRate) => (
                  <tr key={rate.currency_code} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{rate.currency_code}</td>
                    <td className="text-right p-2">{formatRate(rate.forex_buying)}</td>
                    <td className="text-right p-2">{formatRate(rate.forex_selling)}</td>
                    <td className="text-right p-2">{formatRate(rate.banknote_buying)}</td>
                    <td className="text-right p-2">{formatRate(rate.banknote_selling)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExchangeRateCard;
