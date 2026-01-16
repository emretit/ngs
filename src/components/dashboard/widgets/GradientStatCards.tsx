import { memo, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Wallet, 
  Receipt, 
  FileCheck, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  DollarSign,
  AlertCircle,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  colorKey: string;
  route?: string;
  isCurrency?: boolean;
}

const formatCurrency = (value: number) => {
  return `₺${value.toLocaleString("tr-TR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

const formatNumber = (value: number) => {
  return value.toLocaleString("tr-TR", { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });
};

// Gradient mapping for icons
const gradientMap: Record<string, string> = {
  violet: "from-violet-500 to-purple-500",
  cyan: "from-cyan-500 to-blue-500",
  rose: "from-rose-500 to-pink-500",
  amber: "from-amber-500 to-orange-500",
  red: "from-red-500 to-rose-500",
  emerald: "from-emerald-500 to-teal-500",
  orange: "from-orange-500 to-amber-500",
  indigo: "from-indigo-500 to-blue-500",
};

const StatCard = memo(({ title, value, subtitle, trend, icon: Icon, colorKey, route, isCurrency = true }: StatCardProps) => {
  const navigate = useNavigate();
  
  const formattedValue = isCurrency 
    ? formatCurrency(value)
    : formatNumber(value);
  
  const isPositive = trend !== undefined ? trend >= 0 : true;
  const gradient = gradientMap[colorKey] || gradientMap.violet;
  
  return (
    <Card 
      onClick={() => route && navigate(route)}
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
          gradient
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <p className="text-lg font-bold text-foreground truncate">
              {formattedValue}
            </p>
            {trend !== undefined && (
              <Badge 
                className={cn(
                  "text-[9px] px-1 py-0 gap-0 border-0 shrink-0",
                  isPositive 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" 
                    : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                )}
              >
                {isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                {Math.abs(trend).toFixed(1)}%
              </Badge>
            )}
          </div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = "StatCard";

interface GradientStatCardsProps {
  monthlyTurnover?: number;
  totalReceivables?: number;
  monthlyExpenses?: number;
  stockValue?: number;
  turnoverTrend?: number;
  liabilities?: number;
  netProfit?: number;
  overdueReceivablesTotal?: number;
  activeCustomers?: number;
  isLoading?: boolean;
}

export const GradientStatCards = memo(({
  monthlyTurnover = 0,
  totalReceivables = 0,
  monthlyExpenses = 0,
  stockValue = 0,
  turnoverTrend,
  liabilities = 0,
  netProfit = 0,
  overdueReceivablesTotal = 0,
  activeCustomers = 0,
  isLoading
}: GradientStatCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-[67px] rounded-lg" />
        ))}
      </div>
    );
  }

  // Calculate net profit trend (if we had previous month data)
  const netProfitTrend = useMemo(() => {
    // This could be calculated if we had previous month expenses
    return undefined;
  }, []);

  const stats: StatCardProps[] = [
    {
      title: "Aylık Ciro",
      value: monthlyTurnover,
      subtitle: "Faturalandırılmış satışlar",
      trend: turnoverTrend,
      icon: TrendingUp,
      colorKey: "violet",
      route: "/invoices"
    },
    {
      title: "Toplam Alacak",
      value: totalReceivables,
      subtitle: "Açık hesap bakiyesi",
      icon: Wallet,
      colorKey: "cyan",
      route: "/customers"
    },
    {
      title: "Aylık Gider",
      value: monthlyExpenses,
      subtitle: "Bu ay harcamalar",
      icon: Receipt,
      colorKey: "rose",
      route: "/cashflow/expenses"
    },
    {
      title: "Stok Değeri",
      value: stockValue,
      subtitle: "Toplam envanter değeri",
      icon: Package,
      colorKey: "amber",
      route: "/inventory"
    },
    {
      title: "Toplam Borç",
      value: liabilities,
      subtitle: "Ödenmesi gereken tutar",
      icon: CreditCard,
      colorKey: "red",
      route: "/cashflow"
    },
    {
      title: "Net Kar",
      value: netProfit,
      subtitle: "Ciro - Gider farkı",
      trend: netProfitTrend,
      icon: DollarSign,
      colorKey: "emerald",
      route: "/cashflow"
    },
    {
      title: "Vadesi Geçen Alacak",
      value: overdueReceivablesTotal,
      subtitle: "Ödenmemiş faturalar",
      icon: AlertCircle,
      colorKey: "orange",
      route: "/invoices?filter=overdue"
    },
    {
      title: "Aktif Müşteri",
      value: activeCustomers,
      subtitle: "Aktif müşteri sayısı",
      icon: Users,
      colorKey: "indigo",
      route: "/customers",
      isCurrency: false
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
});

GradientStatCards.displayName = "GradientStatCards";
