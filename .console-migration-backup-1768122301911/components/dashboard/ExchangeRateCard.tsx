import React, { useState } from "react";
import { RefreshCw, AlertCircle, CalendarIcon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useExchangeRates, ExchangeRate } from "@/hooks/useExchangeRates";

const ExchangeRateCard: React.FC = () => {
  const { exchangeRates, loading, error, lastUpdate, refreshExchangeRates } = useExchangeRates();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [historicalRate, setHistoricalRate] = useState<ExchangeRate | null>(null);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

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
  

  // Available currencies for historical lookup
  const availableCurrencies = [
    { code: "USD", name: "Amerikan Doları" },
    { code: "EUR", name: "Euro" },
    { code: "GBP", name: "İngiliz Sterlini" },
    { code: "JPY", name: "Japon Yeni" },
    { code: "CHF", name: "İsviçre Frangı" },
    { code: "CAD", name: "Kanada Doları" },
    { code: "AUD", name: "Avustralya Doları" },
  ];

  // Fetch historical rate
  const fetchHistoricalRate = async () => {
    if (!selectedDate || !selectedCurrency) return;
    
    setLoadingHistorical(true);
    try {
      // Here you would typically call your historical rates API
      // For now, we'll simulate with current rates
      const currentRate = exchangeRates.find(rate => rate.currency_code === selectedCurrency);
      if (currentRate) {
        setHistoricalRate({
          ...currentRate,
          update_date: format(selectedDate, 'yyyy-MM-dd')
        });
      }
    } catch (error) {
      console.error('Error fetching historical rate:', error);
      setHistoricalRate(null);
    } finally {
      setLoadingHistorical(false);
    }
  };

  // Effect to fetch historical rate when date or currency changes
  React.useEffect(() => {
    if (selectedDate && selectedCurrency) {
      fetchHistoricalRate();
    }
  }, [selectedDate, selectedCurrency]);

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

        <Separator className="my-6" />

        {/* Historical Rate Lookup Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Geçmiş Kur Sorgulama</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tarih Seçin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : "Tarih seçin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Currency Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Para Birimi</label>
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Para birimi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Historical Rate Display */}
          {(selectedDate && selectedCurrency) && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              {loadingHistorical ? (
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : historicalRate ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {selectedCurrency} - {format(selectedDate, "d MMMM yyyy", { locale: tr })}
                    </span>
                    <span className="text-sm text-muted-foreground">Güncel Kur</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Forex Alış</div>
                      <div className="font-mono">{formatRate(historicalRate.forex_buying)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Forex Satış</div>
                      <div className="font-mono">{formatRate(historicalRate.forex_selling)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Efektif Alış</div>
                      <div className="font-mono">{formatRate(historicalRate.banknote_buying)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Efektif Satış</div>
                      <div className="font-mono">{formatRate(historicalRate.banknote_selling)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Seçilen tarih ve para birimi için kur bilgisi bulunamadı
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeRateCard;
