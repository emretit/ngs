import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Clock,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Package,
  ShoppingCart,
  FileText,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { WorkStatusOverview } from "@/components/dashboard/v2/WorkStatusOverview";
import { AdvancedFinancialCharts } from "@/components/dashboard/v2/AdvancedFinancialCharts";
import { SmartTaskManagement } from "@/components/dashboard/v2/SmartTaskManagement";
import { SalesPerformance } from "@/components/dashboard/v2/SalesPerformance";
import { TeamPerformance } from "@/components/dashboard/v2/TeamPerformance";
import { NotificationCenter } from "@/components/dashboard/v2/NotificationCenter";
import { QuickStatsBar } from "@/components/dashboard/v2/QuickStatsBar";
import { StockCriticalLevels } from "@/components/dashboard/v2/StockCriticalLevels";
import { ServiceManagement } from "@/components/dashboard/v2/ServiceManagement";
import { CashflowForecast } from "@/components/dashboard/v2/CashflowForecast";
import { CalendarAppointments } from "@/components/dashboard/v2/CalendarAppointments";
import { ConversionFunnel } from "@/components/dashboard/v2/ConversionFunnel";
import { CustomerSatisfaction } from "@/components/dashboard/v2/CustomerSatisfaction";
import { SupplierPerformance } from "@/components/dashboard/v2/SupplierPerformance";
import { HrSummary } from "@/components/dashboard/v2/HrSummary";
import { VehicleFleet } from "@/components/dashboard/v2/VehicleFleet";
import { ProductionOverview } from "@/components/dashboard/v2/ProductionOverview";
import { PurchasingOverview } from "@/components/dashboard/v2/PurchasingOverview";
import { AIAgentAccordion } from "@/components/dashboard/v2/AIAgentAccordion";
import { TimePeriodCard } from "@/components/dashboard/v2/TimePeriodCard";

// ═══════════════════════════════════════════════════════════════════════════
// TEMA KONFİGÜRASYONU - Midnight Ocean Teması
// ═══════════════════════════════════════════════════════════════════════════
const THEME = {
  gradients: {
    accent: "from-cyan-500 via-blue-500 to-indigo-600",
    success: "from-emerald-500 to-teal-600",
    warning: "from-amber-500 to-orange-600", 
    danger: "from-rose-500 to-red-600",
    purple: "from-violet-500 to-purple-600",
  },
  colors: {
    cyan: { border: "border-l-cyan-500", bg: "bg-cyan-500/5", icon: "from-cyan-500 to-blue-500", badge: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400" },
    emerald: { border: "border-l-emerald-500", bg: "bg-emerald-500/5", icon: "from-emerald-500 to-green-500", badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
    rose: { border: "border-l-rose-500", bg: "bg-rose-500/5", icon: "from-rose-500 to-pink-500", badge: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400" },
    violet: { border: "border-l-violet-500", bg: "bg-violet-500/5", icon: "from-violet-500 to-purple-500", badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400" },
    amber: { border: "border-l-amber-500", bg: "bg-amber-500/5", icon: "from-amber-500 to-orange-500", badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
    indigo: { border: "border-l-indigo-500", bg: "bg-indigo-500/5", icon: "from-indigo-500 to-blue-500", badge: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400" },
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// KPI KART BİLEŞENİ - Tutarlı Tasarım
// ═══════════════════════════════════════════════════════════════════════════
interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  change?: { value: number; label: string };
  badge?: string;
  icon: React.ElementType;
  colorKey: keyof typeof THEME.colors;
  onClick?: () => void;
}

const KPICard = memo(({ title, value, subtitle, change, badge, icon: Icon, colorKey, onClick }: KPICardProps) => {
  const colors = THEME.colors[colorKey];
  const isPositive = change ? change.value >= 0 : true;
  
  // Gradient mapping
  const gradientMap: Record<string, string> = {
    cyan: "from-cyan-500 to-blue-500",
    emerald: "from-emerald-500 to-teal-500",
    rose: "from-rose-500 to-pink-500",
    violet: "from-violet-500 to-purple-500",
    amber: "from-amber-500 to-orange-500",
    indigo: "from-indigo-500 to-blue-500",
  };
  
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-300",
        "hover:shadow-md hover:-translate-y-0.5",
        "bg-card/80 backdrop-blur-sm border-border/50"
      )}
    >
      <div className="relative p-3 flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center shadow-sm shrink-0",
          "bg-gradient-to-br",
          gradientMap[colorKey] || gradientMap.cyan
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-lg font-bold text-foreground truncate">
              {value}
            </p>
            {change && (
              <Badge 
                className={cn(
                  "text-[9px] px-1 py-0 gap-0 border-0 shrink-0",
                  isPositive 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" 
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                )}
              >
                {isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                {Math.abs(change.value)}%
              </Badge>
            )}
            {badge && !change && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
        </div>
      </div>
    </Card>
  );
});

KPICard.displayName = "KPICard";

// ═══════════════════════════════════════════════════════════════════════════
// ANA DASHBOARD BİLEŞENİ
// ═══════════════════════════════════════════════════════════════════════════
const DashboardV2 = () => {
  const navigate = useNavigate();
  const { displayName } = useCurrentUser();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');

  const {
    monthlyTurnover = 0,
    monthlyExpenses = 0,
    stockValue = 0,
    totalReceivables = 0,
    isLoading: widgetsLoading
  } = useDashboardWidgets();

  const { exchangeRates, loading: ratesLoading } = useExchangeRates();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  // Döviz kuru format helper
  const formatRate = (rate: number | null) => {
    if (rate === null) return "-";
    return rate.toFixed(4);
  };

  // Ana dövizleri filtrele
  const mainCurrencies = exchangeRates.filter((rate) =>
    ["USD", "EUR", "GBP"].includes(rate.currency_code)
  );

  const quickActions = [
    { label: "Fırsat", icon: Target, gradient: THEME.gradients.accent, route: "/opportunities" },
    { label: "Teklif", icon: FileText, gradient: THEME.gradients.purple, route: "/proposals" },
    { label: "Sipariş", icon: ShoppingCart, gradient: THEME.gradients.warning, route: "/orders/list" },
    { label: "Aktivite", icon: Activity, gradient: THEME.gradients.success, route: "/activities?action=new" },
  ];

  const kpiCards: KPICardProps[] = [
    {
      title: "Aylık Ciro",
      value: `₺${monthlyTurnover.toLocaleString('tr-TR')}`,
      subtitle: "Satış gelirleri",
      change: { value: 12.5, label: "artış" },
      icon: TrendingUp,
      colorKey: "cyan",
      onClick: () => navigate("/invoices")
    },
    {
      title: "Toplam Alacak",
      value: `₺${totalReceivables.toLocaleString('tr-TR')}`,
      subtitle: "Açık hesap bakiyesi",
      badge: "15 Fatura",
      icon: Wallet,
      colorKey: "emerald",
      onClick: () => navigate("/customers")
    },
    {
      title: "Aylık Gider",
      value: `₺${monthlyExpenses.toLocaleString('tr-TR')}`,
      subtitle: "Operasyonel giderler",
      change: { value: -8.2, label: "azalış" },
      icon: DollarSign,
      colorKey: "rose",
      onClick: () => navigate("/cashflow/expenses")
    },
    {
      title: "Stok Değeri",
      value: `₺${stockValue.toLocaleString('tr-TR')}`,
      subtitle: "Toplam envanter",
      badge: "250 Ürün",
      icon: Package,
      colorKey: "violet",
      onClick: () => navigate("/inventory")
    },
    {
      title: "Aktif Görevler",
      value: "24",
      subtitle: "8 görev tamamlandı",
      badge: "3 Acil",
      icon: Clock,
      colorKey: "amber",
      onClick: () => navigate("/activities")
    },
    {
      title: "Bekleyen Onaylar",
      value: "7",
      subtitle: "Bugün 5 onaylandı",
      badge: "2 Yeni",
      icon: CheckCircle2,
      colorKey: "indigo",
      onClick: () => navigate("/budget/approvals")
    }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KOMPAKT HEADER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-sm">
        {/* Subtle Background Effect */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative px-5 py-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Sol Taraf - Karşılama ve Hızlı Erişim Butonları */}
            <div className="flex-1 space-y-4">
              {/* Karşılama */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    {getGreeting()}, <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">{displayName}</span>
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
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Button
                        key={index}
                        onClick={() => navigate(action.route)}
                        size="default"
                        className={cn(
                          "h-9 gap-2 text-sm font-medium shadow-sm hover:shadow-md transition-all hover:scale-[1.02]",
                          "bg-gradient-to-r text-white border-0",
                          action.gradient
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{action.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sağ Taraf - Döviz Kurları */}
            <div className="flex flex-col gap-2 items-end lg:items-start lg:min-w-[200px]">
              {ratesLoading ? (
                <>
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-7 w-full" />
                </>
              ) : (
                mainCurrencies.map((rate) => {
                  return (
                    <div
                      key={rate.currency_code}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-sm transition-all w-full"
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* AI AGENT ACCORDION - Header Altında */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <AIAgentAccordion />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZAMAN PERİYODU KARTI */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <TimePeriodCard
        selectedPeriod={selectedTimePeriod}
        onPeriodChange={setSelectedTimePeriod}
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HIZLI İSTATİSTİKLER */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <QuickStatsBar selectedTimePeriod={selectedTimePeriod} />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* KPI KARTLARI */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {widgetsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))
        ) : (
          kpiCards.map((card, index) => (
            <KPICard key={index} {...card} />
          ))
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* İŞ DURUMU PANELİ - Operasyonel Özet */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <WorkStatusOverview />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FİNANSAL ANALİZ BÖLÜMÜ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <AdvancedFinancialCharts />
        <CashflowForecast />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* OPERASYONEL WİDGET'LAR - ERP */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <StockCriticalLevels />
        <ServiceManagement />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProductionOverview />
        <PurchasingOverview />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CRM & SATIŞ PERFORMANSI */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SalesPerformance />
        <ConversionFunnel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CustomerSatisfaction />
        <SupplierPerformance />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAKVİM & RANDEVULAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <CalendarAppointments />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* GÖREV YÖNETİMİ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <SmartTaskManagement
        onTaskClick={(id) => navigate(`/activities?taskId=${id}`)}
        onAddTask={() => navigate('/activities?action=new')}
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* İK & OPERASYONEL KAYNAKLAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <HrSummary />
        <VehicleFleet />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* EKİP PERFORMANSI */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <TeamPerformance />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BİLDİRİM MERKEZİ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <NotificationCenter
        onAction={(id, route) => route && navigate(route)}
      />
    </div>
  );
};

export default memo(DashboardV2);
