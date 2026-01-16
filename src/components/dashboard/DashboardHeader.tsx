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
  AlertCircle,
  Sparkles,
  Target,
  Activity,
  FileText,
  ShoppingCart,
  Zap
} from "lucide-react";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useTodaysTasks } from "@/hooks/useTodaysTasks";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { HeaderAIButton } from "./HeaderAIButton";

interface DashboardHeaderProps {
  onRefresh?: () => void;
}

const DashboardHeader = ({ onRefresh }: DashboardHeaderProps) => {
  const navigate = useNavigate();
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

  // Quick actions - memoized
  const quickActions = useMemo(() => [
    { label: "Fırsat", icon: Target, gradient: "from-cyan-500 via-blue-500 to-indigo-600", route: "/opportunities" },
    { label: "Teklif", icon: FileText, gradient: "from-violet-500 to-purple-600", route: "/proposals" },
    { label: "Sipariş", icon: ShoppingCart, gradient: "from-amber-500 to-orange-600", route: "/orders/list" },
    { label: "Aktivite", icon: Activity, gradient: "from-emerald-500 to-teal-600", route: "/activities?action=new" },
  ], []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="relative p-4 sm:p-6">
        {/* Main Header Row */}
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          {/* Left - Welcome Message */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {getGreeting()}, <span className="text-primary">{displayName}</span>
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}</span>
                </div>
              </div>
            </div>

            {/* Hızlı Erişim Butonları */}
            <div className="flex items-center gap-3 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hızlı Erişim:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* AI Assistant Button */}
                <HeaderAIButton />

                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      onClick={() => navigate(action.route)}
                      size="default"
                      className={cn(
                        "h-8 px-3 gap-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-[1.02]",
                        "bg-gradient-to-r text-white border-0",
                        action.gradient
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right - Currency Rates */}
          <div className="flex flex-col gap-1 items-end lg:items-start lg:min-w-[200px]">
            {/* Yenileme Butonu */}
            <div className="flex items-center justify-between w-full mb-0.5">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                Döviz Kurları
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshExchangeRates}
                disabled={exchangeLoading}
                className={cn(
                  "h-6 w-6 hover:bg-muted/50",
                  exchangeLoading && "cursor-not-allowed"
                )}
                title="Döviz kurlarını yenile"
              >
                <RefreshCw className={cn("h-3 w-3 text-muted-foreground", exchangeLoading && "animate-spin")} />
              </Button>
            </div>
            
            {exchangeLoading ? (
              <>
                <div className="h-7 w-full rounded-lg border border-border/50 bg-muted/50 animate-pulse" />
                <div className="h-7 w-full rounded-lg border border-border/50 bg-muted/50 animate-pulse" />
                <div className="h-7 w-full rounded-lg border border-border/50 bg-muted/50 animate-pulse" />
              </>
            ) : (
              filteredRates.map((rate) => {
                return (
                  <div
                    key={rate.currency_code}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-sm transition-all w-full"
                  >
                    <span className="text-[11px] font-semibold text-foreground w-9">{rate.currency_code}</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-500" />
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatRate(rate.forex_buying)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-[11px] font-bold text-red-600 dark:text-red-400 tabular-nums">
                        {formatRate(rate.forex_selling)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
