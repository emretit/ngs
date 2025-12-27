import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp,
  Wallet,
  CreditCard,
  Users,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QuickStat {
  label: string;
  value: number;
  change: number;
  icon: React.ElementType;
  gradient: string;
  route: string;
  isCurrency?: boolean;
}

interface QuickStatsBarProps {
  data?: {
    todaySales: number;
    todayCollection: number;
    todayPayment: number;
    newCustomers: number;
    newOrders: number;
    activeServices: number;
  };
  isLoading?: boolean;
  selectedTimePeriod?: 'today' | 'week' | 'month' | 'quarter';
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₺${(value / 1000).toFixed(0)}K`;
  }
  return `₺${value.toFixed(0)}`;
};

export const QuickStatsBar = memo(({ data, isLoading, selectedTimePeriod = 'month' }: QuickStatsBarProps) => {
  const navigate = useNavigate();
  
  // Zaman periyoduna göre label'ları güncelle
  const getPeriodLabel = () => {
    switch (selectedTimePeriod) {
      case 'today': return 'Bugünkü';
      case 'week': return 'Bu Hafta';
      case 'month': return 'Bu Ay';
      case 'quarter': return 'Bu Çeyrek';
      default: return 'Bugünkü';
    }
  };

  const periodLabel = getPeriodLabel();
  
  const stats: QuickStat[] = [
    {
      label: `${periodLabel} Satış`,
      value: data?.todaySales || 45000,
      change: 12.5,
      icon: TrendingUp,
      gradient: "from-emerald-500 to-teal-500",
      route: "/invoices",
      isCurrency: true
    },
    {
      label: `${periodLabel} Tahsilat`,
      value: data?.todayCollection || 38000,
      change: 8.3,
      icon: Wallet,
      gradient: "from-cyan-500 to-blue-500",
      route: "/cashflow/bank-accounts",
      isCurrency: true
    },
    {
      label: `${periodLabel} Ödeme`,
      value: data?.todayPayment || 22000,
      change: -5.2,
      icon: CreditCard,
      gradient: "from-rose-500 to-pink-500",
      route: "/cashflow/expenses",
      isCurrency: true
    },
    {
      label: `${periodLabel} Yeni Müşteri`,
      value: data?.newCustomers || 3,
      change: 50,
      icon: Users,
      gradient: "from-violet-500 to-purple-500",
      route: "/customers"
    },
    {
      label: `${periodLabel} Yeni Sipariş`,
      value: data?.newOrders || 7,
      change: 16.7,
      icon: ShoppingCart,
      gradient: "from-indigo-500 to-blue-500",
      route: "/orders/list"
    },
    {
      label: "Aktif Servis",
      value: data?.activeServices || 12,
      change: -10,
      icon: Activity,
      gradient: "from-amber-500 to-orange-500",
      route: "/service"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change >= 0;
        
        return (
          <Card
            key={index}
            onClick={() => navigate(stat.route)}
            className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 bg-card/80 backdrop-blur-sm border-border/50"
          >
            <div className="relative p-3 flex items-center gap-3">
              {/* Icon */}
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shadow-sm shrink-0",
                "bg-gradient-to-br",
                stat.gradient
              )}>
                <Icon className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-lg font-bold text-foreground truncate">
                    {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                  </p>
                  <Badge 
                    className={cn(
                      "text-[9px] px-1 py-0 gap-0 border-0 shrink-0",
                      isPositive 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" 
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                    )}
                  >
                    {isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                    {Math.abs(stat.change)}%
                  </Badge>
                </div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">
                  {stat.label}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
});

QuickStatsBar.displayName = "QuickStatsBar";

