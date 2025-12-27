import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Customer {
  id: string;
  name: string;
  company: string;
  totalValue: number;
  orders: number;
  growth: number;
  status: 'excellent' | 'good' | 'average';
}

interface SalesPerformanceProps {
  data?: {
    customers: Customer[];
    targets: {
      monthly: { target: number; actual: number };
      quarterly: { target: number; actual: number };
      yearly: { target: number; actual: number };
    };
  };
  isLoading?: boolean;
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

export const SalesPerformance = memo(({ data, isLoading }: SalesPerformanceProps) => {
  const navigate = useNavigate();

  // Mock data
  const topCustomers: Customer[] = data?.customers || [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      company: 'ABC Teknoloji A.Ş.',
      totalValue: 850000,
      orders: 24,
      growth: 25.5,
      status: 'excellent'
    },
    {
      id: '2',
      name: 'Ayşe Demir',
      company: 'XYZ Holding',
      totalValue: 620000,
      orders: 18,
      growth: 18.2,
      status: 'excellent'
    },
    {
      id: '3',
      name: 'Mehmet Kaya',
      company: 'DEF İnşaat',
      totalValue: 480000,
      orders: 15,
      growth: -5.3,
      status: 'good'
    },
    {
      id: '4',
      name: 'Fatma Şahin',
      company: 'GHI Perakende',
      totalValue: 390000,
      orders: 22,
      growth: 12.8,
      status: 'good'
    },
    {
      id: '5',
      name: 'Can Arslan',
      company: 'JKL Lojistik',
      totalValue: 310000,
      orders: 11,
      growth: 8.4,
      status: 'average'
    }
  ];

  const targets = data?.targets || {
    monthly: { target: 500000, actual: 580000 },
    quarterly: { target: 1500000, actual: 1320000 },
    yearly: { target: 6000000, actual: 4250000 }
  };

  const statusConfig = {
    excellent: { label: 'Mükemmel', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: '🌟' },
    good: { label: 'İyi', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: '👍' },
    average: { label: 'Orta', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: '📊' }
  };

  const calculatePercentage = (actual: number, target: number) => {
    return Math.round((actual / target) * 100);
  };

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Müşteri & Satış Performansı</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                En değerli müşteriler ve satış hedefleri
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate('/customers')}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            Tüm Müşteriler
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Top Customers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">En Değerli Müşteriler</h3>
              <Badge variant="secondary" className="text-xs">
                Top 5
              </Badge>
            </div>

            <div className="space-y-3">
              {topCustomers.map((customer, index) => {
                const status = statusConfig[customer.status];
                return (
                  <div
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                    className="group p-3 rounded-lg border-2 border-border hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-md bg-background"
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank Badge */}
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm",
                        index === 0 && "bg-gradient-to-br from-amber-400 to-yellow-500 text-white",
                        index === 1 && "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800",
                        index === 2 && "bg-gradient-to-br from-orange-400 to-orange-500 text-white",
                        index > 2 && "bg-muted text-muted-foreground"
                      )}>
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold truncate">{customer.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{customer.company}</p>
                          </div>
                          <Badge className={cn("text-[10px] px-2 py-0.5 shrink-0", status.color)}>
                            {status.icon} {status.label}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
                          <div>
                            <p className="text-xs text-muted-foreground">Toplam Değer</p>
                            <p className="text-sm font-bold text-foreground">{formatCurrency(customer.totalValue)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{customer.orders} Sipariş</p>
                            <div className={cn(
                              "flex items-center gap-0.5 text-xs font-semibold",
                              customer.growth >= 0 ? "text-emerald-600" : "text-red-600"
                            )}>
                              {customer.growth >= 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {Math.abs(customer.growth).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Sales Targets */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Satış Hedefleri</h3>
              <Badge variant="secondary" className="text-xs">
                2024
              </Badge>
            </div>

            {/* Monthly Target */}
            <div className="p-4 rounded-xl border-2 border-border bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-950/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Aylık Hedef</h4>
                    <p className="text-xs text-muted-foreground">Aralık 2024</p>
                  </div>
                </div>
                <Badge className={cn(
                  "text-xs px-2 py-1",
                  calculatePercentage(targets.monthly.actual, targets.monthly.target) >= 100
                    ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                    : "bg-amber-100 text-amber-700 border-amber-300"
                )}>
                  {calculatePercentage(targets.monthly.actual, targets.monthly.target)}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gerçekleşen</span>
                  <span className="font-bold text-foreground">{formatCurrency(targets.monthly.actual)}</span>
                </div>
                <Progress value={calculatePercentage(targets.monthly.actual, targets.monthly.target)} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Hedef</span>
                  <span className="font-semibold">{formatCurrency(targets.monthly.target)}</span>
                </div>
              </div>
            </div>

            {/* Quarterly Target */}
            <div className="p-4 rounded-xl border-2 border-border bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-950/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Çeyrek Hedef</h4>
                    <p className="text-xs text-muted-foreground">Q4 2024</p>
                  </div>
                </div>
                <Badge className={cn(
                  "text-xs px-2 py-1",
                  calculatePercentage(targets.quarterly.actual, targets.quarterly.target) >= 100
                    ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                    : "bg-amber-100 text-amber-700 border-amber-300"
                )}>
                  {calculatePercentage(targets.quarterly.actual, targets.quarterly.target)}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gerçekleşen</span>
                  <span className="font-bold text-foreground">{formatCurrency(targets.quarterly.actual)}</span>
                </div>
                <Progress value={calculatePercentage(targets.quarterly.actual, targets.quarterly.target)} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Hedef</span>
                  <span className="font-semibold">{formatCurrency(targets.quarterly.target)}</span>
                </div>
              </div>
            </div>

            {/* Yearly Target */}
            <div className="p-4 rounded-xl border-2 border-border bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-950/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Yıllık Hedef</h4>
                    <p className="text-xs text-muted-foreground">2024</p>
                  </div>
                </div>
                <Badge className={cn(
                  "text-xs px-2 py-1",
                  calculatePercentage(targets.yearly.actual, targets.yearly.target) >= 100
                    ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                    : "bg-amber-100 text-amber-700 border-amber-300"
                )}>
                  {calculatePercentage(targets.yearly.actual, targets.yearly.target)}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gerçekleşen</span>
                  <span className="font-bold text-foreground">{formatCurrency(targets.yearly.actual)}</span>
                </div>
                <Progress value={calculatePercentage(targets.yearly.actual, targets.yearly.target)} className="h-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Hedef</span>
                  <span className="font-semibold">{formatCurrency(targets.yearly.target)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

SalesPerformance.displayName = "SalesPerformance";

