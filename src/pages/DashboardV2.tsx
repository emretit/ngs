import { memo, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  DollarSign,
  Package,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { QuickStatsBar } from "@/components/dashboard/v2/QuickStatsBar";
import { TimePeriodCard } from "@/components/dashboard/v2/TimePeriodCard";
import { AIAgentAccordion } from "@/components/dashboard/v2/AIAgentAccordion";

// Lazy load heavy dashboard components
const WorkStatusOverview = lazy(() => import("@/components/dashboard/v2/WorkStatusOverview").then(m => ({ default: m.WorkStatusOverview })));
const AdvancedFinancialCharts = lazy(() => import("@/components/dashboard/v2/AdvancedFinancialCharts").then(m => ({ default: m.AdvancedFinancialCharts })));
const SmartTaskManagement = lazy(() => import("@/components/dashboard/v2/SmartTaskManagement").then(m => ({ default: m.SmartTaskManagement })));
const SalesPerformance = lazy(() => import("@/components/dashboard/v2/SalesPerformance").then(m => ({ default: m.SalesPerformance })));
const TeamPerformance = lazy(() => import("@/components/dashboard/v2/TeamPerformance").then(m => ({ default: m.TeamPerformance })));
const NotificationCenter = lazy(() => import("@/components/dashboard/v2/NotificationCenter").then(m => ({ default: m.NotificationCenter })));
const StockCriticalLevels = lazy(() => import("@/components/dashboard/v2/StockCriticalLevels").then(m => ({ default: m.StockCriticalLevels })));
const ServiceManagement = lazy(() => import("@/components/dashboard/v2/ServiceManagement").then(m => ({ default: m.ServiceManagement })));
const CashflowForecast = lazy(() => import("@/components/dashboard/v2/CashflowForecast").then(m => ({ default: m.CashflowForecast })));
const CalendarAppointments = lazy(() => import("@/components/dashboard/v2/CalendarAppointments").then(m => ({ default: m.CalendarAppointments })));
const ConversionFunnel = lazy(() => import("@/components/dashboard/v2/ConversionFunnel").then(m => ({ default: m.ConversionFunnel })));
const CustomerSatisfaction = lazy(() => import("@/components/dashboard/v2/CustomerSatisfaction").then(m => ({ default: m.CustomerSatisfaction })));
const SupplierPerformance = lazy(() => import("@/components/dashboard/v2/SupplierPerformance").then(m => ({ default: m.SupplierPerformance })));
const HrSummary = lazy(() => import("@/components/dashboard/v2/HrSummary").then(m => ({ default: m.HrSummary })));
const VehicleFleet = lazy(() => import("@/components/dashboard/v2/VehicleFleet").then(m => ({ default: m.VehicleFleet })));
const ProductionOverview = lazy(() => import("@/components/dashboard/v2/ProductionOverview").then(m => ({ default: m.ProductionOverview })));
const PurchasingOverview = lazy(() => import("@/components/dashboard/v2/PurchasingOverview").then(m => ({ default: m.PurchasingOverview })));

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
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');

  const {
    monthlyTurnover = 0,
    monthlyExpenses = 0,
    stockValue = 0,
    totalReceivables = 0,
    isLoading: widgetsLoading
  } = useDashboardWidgets();

  // KPI Cards - memoized
  const kpiCards: KPICardProps[] = useMemo(() => [
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
  ], [monthlyTurnover, totalReceivables, monthlyExpenses, stockValue, navigate]);

  // Navigation handlers - memoized
  const handleTaskClick = useCallback((id: string) => {
    navigate(`/activities?taskId=${id}`);
  }, [navigate]);

  const handleAddTask = useCallback(() => {
    navigate('/activities?action=new');
  }, [navigate]);

  const handleNotificationAction = useCallback((id: string, route?: string) => {
    if (route) navigate(route);
  }, [navigate]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* AI AGENT ACCORDION */}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
      <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-lg" />}>
        <WorkStatusOverview />
      </Suspense>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FİNANSAL ANALİZ BÖLÜMÜ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-5">
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
          <AdvancedFinancialCharts />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
          <CashflowForecast />
        </Suspense>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* OPERASYONEL WİDGET'LAR - ERP */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-lg" />}>
          <StockCriticalLevels />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-lg" />}>
          <ServiceManagement />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-lg" />}>
          <ProductionOverview />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-lg" />}>
          <PurchasingOverview />
        </Suspense>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CRM & SATIŞ PERFORMANSI */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
          <SalesPerformance />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
          <ConversionFunnel />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
          <CustomerSatisfaction />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
          <SupplierPerformance />
        </Suspense>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAKVİM & RANDEVULAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
        <CalendarAppointments />
      </Suspense>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* GÖREV YÖNETİMİ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-lg" />}>
        <SmartTaskManagement
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
        />
      </Suspense>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* İK & OPERASYONEL KAYNAKLAR */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-lg" />}>
          <HrSummary />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[350px] w-full rounded-lg" />}>
          <VehicleFleet />
        </Suspense>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* EKİP PERFORMANSI */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
        <TeamPerformance />
      </Suspense>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BİLDİRİM MERKEZİ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
        <NotificationCenter
          onAction={handleNotificationAction}
        />
      </Suspense>
    </div>
  );
};

export default memo(DashboardV2);
