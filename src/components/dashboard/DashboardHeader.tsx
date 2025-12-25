import React from "react";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  DollarSign,
  RefreshCw,
  TrendingDown,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useTodaysTasks } from "@/hooks/useTodaysTasks";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  onRefresh?: () => void;
}

const DashboardHeader = ({ onRefresh }: DashboardHeaderProps) => {
  const { exchangeRates, loading: exchangeLoading, refreshExchangeRates } = useExchangeRates();
  const { displayName } = useCurrentUser();
  const { tasks } = useTodaysTasks();
  const { data: approvals } = usePendingApprovals();

  // Filter rates to only show USD, EUR, and GBP
  const filteredRates = exchangeRates.filter(rate =>
    ["USD", "EUR", "GBP"].includes(rate.currency_code)
  );

  // Format rate with 4 decimal places
  const formatRate = (rate: number | null) => {
    if (rate === null) return '-';
    return rate.toFixed(4);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  // Calculate stats
  const pendingTasks = tasks.filter(t => !t.isCompleted).length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const importantTasks = tasks.filter(t => t.isImportant && !t.isCompleted).length;
  const pendingApprovals = approvals?.length || 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="relative p-4 sm:p-6">
        {/* Main Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          {/* Left - Welcome Message */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {getGreeting()}, <span className="text-primary">{displayName}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}</span>
            </div>
          </div>

          {/* Right - Quick Stats Cards */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* Pending Tasks */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
              pendingTasks > 0 
                ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50" 
                : "bg-muted/50 border-border/50"
            )}>
              <Clock className={cn("h-4 w-4", pendingTasks > 0 ? "text-orange-500" : "text-muted-foreground")} />
              <div>
                <p className="text-xs text-muted-foreground">Bekleyen</p>
                <p className={cn("text-sm font-semibold", pendingTasks > 0 ? "text-orange-600 dark:text-orange-400" : "text-foreground")}>
                  {pendingTasks} Görev
                </p>
              </div>
            </div>

            {/* Important Tasks */}
            {importantTasks > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-destructive/10 border-destructive/30">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Önemli</p>
                  <p className="text-sm font-semibold text-destructive">{importantTasks} Görev</p>
                </div>
              </div>
            )}

            {/* Completed Today */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
              completedTasks > 0 
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50" 
                : "bg-muted/50 border-border/50"
            )}>
              <CheckCircle2 className={cn("h-4 w-4", completedTasks > 0 ? "text-emerald-500" : "text-muted-foreground")} />
              <div>
                <p className="text-xs text-muted-foreground">Tamamlanan</p>
                <p className={cn("text-sm font-semibold", completedTasks > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
                  {completedTasks} Görev
                </p>
              </div>
            </div>

            {/* Pending Approvals */}
            {pendingApprovals > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-primary/10 border-primary/30">
                <Bell className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Onay</p>
                  <p className="text-sm font-semibold text-primary">{pendingApprovals} Bekliyor</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Currency Rates Row */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Döviz:</span>
          </div>
          
          {exchangeLoading ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Yükleniyor...</span>
            </div>
          ) : (
            filteredRates.map((rate) => (
              <div
                key={rate.currency_code}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-200 hover:shadow-sm bg-background border-border/50"
              >
                <span className="font-semibold text-foreground">{rate.currency_code}</span>
                <div className="flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {formatRate(rate.forex_buying)}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                    {formatRate(rate.forex_selling)}
                  </span>
                </div>
              </div>
            ))
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshExchangeRates}
            disabled={exchangeLoading}
            className="h-7 w-7 hover:bg-muted"
          >
            <RefreshCw className={cn("h-3 w-3", exchangeLoading && "animate-spin")} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
