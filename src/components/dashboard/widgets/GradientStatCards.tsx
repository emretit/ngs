import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Wallet, 
  Receipt, 
  FileCheck, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  trend?: number;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  route?: string;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₺${(value / 1000).toFixed(0)}K`;
  }
  return `₺${value.toLocaleString("tr-TR")}`;
};

const StatCard = memo(({ title, value, subtitle, trend, icon: Icon, gradient, iconBg, route }: StatCardProps) => {
  const navigate = useNavigate();
  
  return (
    <div 
      onClick={() => route && navigate(route)}
      className={cn(
        "relative overflow-hidden rounded-xl p-4 transition-all duration-300 cursor-pointer",
        "hover:scale-[1.02] hover:shadow-lg",
        gradient
      )}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="80" cy="20" r="40" fill="white" />
          <circle cx="90" cy="30" r="20" fill="white" />
        </svg>
      </div>
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-white/80 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(value)}
          </p>
          {subtitle && (
            <p className="text-xs text-white/70">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-white/90" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-white/90" />
              )}
              <span className="text-xs font-medium text-white/90">
                {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
              <span className="text-xs text-white/60">geçen aya göre</span>
            </div>
          )}
        </div>
        
        <div className={cn("p-2.5 rounded-lg", iconBg)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
});

StatCard.displayName = "StatCard";

interface GradientStatCardsProps {
  monthlyTurnover?: number;
  totalReceivables?: number;
  monthlyExpenses?: number;
  stockValue?: number;
  turnoverTrend?: number;
  isLoading?: boolean;
}

export const GradientStatCards = memo(({
  monthlyTurnover = 0,
  totalReceivables = 0,
  monthlyExpenses = 0,
  stockValue = 0,
  turnoverTrend,
  isLoading
}: GradientStatCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
    );
  }

  const stats: StatCardProps[] = [
    {
      title: "Aylık Ciro",
      value: monthlyTurnover,
      subtitle: "Bu ay onaylanan satışlar",
      trend: turnoverTrend,
      icon: TrendingUp,
      gradient: "bg-gradient-to-br from-violet-500 via-purple-500 to-purple-600",
      iconBg: "bg-white/20",
      route: "/sales/invoices"
    },
    {
      title: "Toplam Alacak",
      value: totalReceivables,
      subtitle: "Açık hesap bakiyesi",
      icon: Wallet,
      gradient: "bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600",
      iconBg: "bg-white/20",
      route: "/receivables"
    },
    {
      title: "Aylık Gider",
      value: monthlyExpenses,
      subtitle: "Bu ay harcamalar",
      icon: Receipt,
      gradient: "bg-gradient-to-br from-rose-500 via-pink-500 to-pink-600",
      iconBg: "bg-white/20",
      route: "/accounting/expenses"
    },
    {
      title: "Stok Değeri",
      value: stockValue,
      subtitle: "Toplam envanter değeri",
      icon: Package,
      gradient: "bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600",
      iconBg: "bg-white/20",
      route: "/inventory/products"
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
});

GradientStatCards.displayName = "GradientStatCards";
