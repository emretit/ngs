import React from "react";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  RefreshCw,
  Calendar,
  TrendingDown,
  Bell,
  Grid3x3
} from "lucide-react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DashboardHeaderProps {
  onRefresh?: () => void;
}

const DashboardHeader = ({ onRefresh }: DashboardHeaderProps) => {
  const { exchangeRates, loading: exchangeLoading, refreshExchangeRates } = useExchangeRates();
  const { displayName } = useCurrentUser();

  // Filter rates to only show USD, EUR, and GBP
  const filteredRates = exchangeRates.filter(rate =>
    ["USD", "EUR", "GBP"].includes(rate.currency_code)
  );

  // Format rate with 4 decimal places
  const formatRate = (rate: number | null) => {
    if (rate === null) return '-';
    return rate.toFixed(4);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Üst Satır - Hoş Geldin ve Aksiyonlar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Sol taraf - Hoş Geldin Mesajı */}
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Hoş geldin, {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}
            </p>
          </div>
        </div>

        {/* Sağ taraf - Aksiyonlar */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alt Satır - Döviz Kurları */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
          <DollarSign className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Güncel Döviz Kurları:</span>
          <span className="sm:hidden">Döviz:</span>
        </div>
        
        {exchangeLoading ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Yükleniyor...</span>
          </div>
        ) : (
          filteredRates.map((rate) => (
            <div
              key={rate.currency_code}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 hover:shadow-md bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-300 dark:border-emerald-700"
            >
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">{rate.currency_code}</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                  {formatRate(rate.forex_buying)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                <span className="bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-red-800 dark:text-red-200">
                  {formatRate(rate.forex_selling)}
                </span>
              </div>
            </div>
          ))
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshExchangeRates}
          disabled={exchangeLoading}
          className="h-7 px-2 text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950"
        >
          <RefreshCw className={`h-3 w-3 ${exchangeLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;