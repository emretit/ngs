import React from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Settings,
  RefreshCw
} from "lucide-react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
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

      {/* Orta - Döviz Kurları */}
      <div className="flex flex-wrap gap-1.5 justify-center flex-1 items-center">
        {exchangeLoading ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Döviz kurları yükleniyor...</span>
          </div>
        ) : (
          filteredRates.map((rate) => (
            <div
              key={rate.currency_code}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300"
            >
              <DollarSign className="h-3 w-3" />
              <span className="font-medium">{rate.currency_code}</span>
              <span className="bg-white/50 px-1.5 py-0.5 rounded-full text-xs font-bold">
                {formatRate(rate.forex_buying)}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default DashboardHeader;