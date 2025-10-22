import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Settings,
  RefreshCw,
  Calendar,
  TrendingDown
} from "lucide-react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DashboardHeaderProps {
  financialData?: {
    cashFlow: number;
    receivables: number;
    payables: number;
    netWorth: number;
  };
  crmStats?: {
    opportunities: number;
    activities: number;
    proposals: number;
  };
  hrStats?: {
    totalEmployees: number;
    onLeave: number;
  };
  onRefresh?: () => void;
}

const DashboardHeader = ({
  financialData,
  crmStats,
  hrStats,
  onRefresh
}: DashboardHeaderProps) => {
  const { exchangeRates, loading: exchangeLoading, refreshExchangeRates } = useExchangeRates();

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
    <div className="flex flex-col gap-3 p-4 pl-12 bg-gradient-to-r from-white to-gray-50/50 rounded-lg border border-gray-200 shadow-sm">
      {/* Üst Satır - Başlık ve Tarih */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Sol taraf - Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Gösterge Paneli
            </h1>
            <p className="text-xs text-muted-foreground/70">
              İş süreçlerinizi takip edin ve yönetin
            </p>
          </div>
        </div>

        {/* Sağ taraf - Tarih */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
          <Calendar className="h-4 w-4 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-blue-900">
              {format(new Date(), "d MMMM yyyy", { locale: tr })}
            </span>
            <span className="text-[10px] text-blue-600">
              {format(new Date(), "EEEE", { locale: tr })}
            </span>
          </div>
        </div>
      </div>

      {/* Alt Satır - Döviz Kurları */}
      <div className="flex flex-wrap gap-2 items-center border-t border-gray-200 pt-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <DollarSign className="h-3.5 w-3.5" />
          <span>Güncel Döviz Kurları:</span>
        </div>
        
        {exchangeLoading ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Yükleniyor...</span>
          </div>
        ) : (
          filteredRates.map((rate) => (
            <div
              key={rate.currency_code}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 hover:shadow-md bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-300"
            >
              <span className="font-semibold text-emerald-900">{rate.currency_code}/TRY</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="bg-white/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-800">
                  {formatRate(rate.forex_buying)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="bg-white/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-red-800">
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
          className="h-7 px-2 text-xs hover:bg-emerald-50"
        >
          <RefreshCw className={`h-3 w-3 ${exchangeLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;