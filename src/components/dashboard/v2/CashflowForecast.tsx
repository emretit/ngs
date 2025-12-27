import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Wallet,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface CashflowForecastProps {
  data?: {
    daily: Array<{ date: string; collection: number; payment: number; net: number }>;
    weekly: Array<{ week: string; collection: number; payment: number; net: number }>;
    upcomingPayments: Array<{ date: string; amount: number; description: string; priority: 'high' | 'medium' | 'low' }>;
    upcomingCollections: Array<{ date: string; amount: number; description: string; priority: 'high' | 'medium' | 'low' }>;
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[200px]">
        <p className="font-semibold text-xs mb-2 text-foreground border-b border-border pb-1">{label}</p>
        <div className="space-y-1.5">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] font-medium text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-xs font-bold text-foreground">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const CashflowForecast = memo(({ data, isLoading }: CashflowForecastProps) => {
  const navigate = useNavigate();
  const [view, setView] = useState<'daily' | 'weekly'>('daily');

  // Mock data
  const mockData = data || {
    daily: Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        date: format(date, 'd MMM', { locale: tr }),
        collection: Math.floor(Math.random() * 50000) + 20000,
        payment: Math.floor(Math.random() * 40000) + 15000,
        net: 0
      };
    }).map(d => ({ ...d, net: d.collection - d.payment })),
    
    weekly: [
      { week: 'Bu Hafta', collection: 280000, payment: 195000, net: 85000 },
      { week: 'Gelecek Hafta', collection: 320000, payment: 210000, net: 110000 },
      { week: '3. Hafta', collection: 295000, payment: 225000, net: 70000 },
      { week: '4. Hafta', collection: 310000, payment: 200000, net: 110000 },
    ],
    
    upcomingPayments: [
      { date: '2024-01-15', amount: 45000, description: 'Tedarikçi Ödemesi - ABC Ltd.', priority: 'high' as const },
      { date: '2024-01-18', amount: 32000, description: 'Kira Ödemesi', priority: 'high' as const },
      { date: '2024-01-20', amount: 18000, description: 'Elektrik Faturası', priority: 'medium' as const },
      { date: '2024-01-22', amount: 12500, description: 'İnternet Faturası', priority: 'low' as const },
    ],
    
    upcomingCollections: [
      { date: '2024-01-14', amount: 85000, description: 'Müşteri Ödemesi - XYZ A.Ş.', priority: 'high' as const },
      { date: '2024-01-16', amount: 62000, description: 'Müşteri Ödemesi - DEF Ltd.', priority: 'high' as const },
      { date: '2024-01-19', amount: 38000, description: 'Müşteri Ödemesi - GHI A.Ş.', priority: 'medium' as const },
      { date: '2024-01-21', amount: 25000, description: 'Müşteri Ödemesi - JKL Ltd.', priority: 'low' as const },
    ]
  };

  const currentData = view === 'daily' ? mockData.daily : mockData.weekly;
  const totalCollection = currentData.reduce((sum, d) => sum + d.collection, 0);
  const totalPayment = currentData.reduce((sum, d) => sum + d.payment, 0);
  const netCashflow = totalCollection - totalPayment;
  const isPositive = netCashflow >= 0;

  // Kritik ödemeler (3 gün içinde)
  const today = new Date();
  const criticalPayments = mockData.upcomingPayments.filter(p => {
    const paymentDate = new Date(p.date);
    const daysDiff = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 3 && daysDiff >= 0;
  });

  const criticalCollections = mockData.upcomingCollections.filter(c => {
    const collectionDate = new Date(c.date);
    const daysDiff = Math.ceil((collectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 3 && daysDiff >= 0;
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <DollarSign className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Nakit Akış Tahmini</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                Günlük/haftalık tahsilat-ödeme öngörüsü
              </p>
            </div>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-auto">
            <TabsList className="grid w-[180px] grid-cols-2 h-8">
              <TabsTrigger value="daily" className="text-[11px]">Günlük</TabsTrigger>
              <TabsTrigger value="weekly" className="text-[11px]">Haftalık</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold">
                Tahsilat
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalCollection)}
            </p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70">
              {view === 'daily' ? '14 gün' : '4 hafta'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
              <p className="text-[10px] uppercase tracking-wide text-rose-600 dark:text-rose-400 font-semibold">
                Ödeme
              </p>
            </div>
            <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
              {formatCurrency(totalPayment)}
            </p>
            <p className="text-[9px] text-rose-600/70 dark:text-rose-400/70">
              {view === 'daily' ? '14 gün' : '4 hafta'}
            </p>
          </div>

          <div className={cn(
            "p-3 rounded-lg border",
            isPositive 
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
          )}>
            <div className="flex items-center gap-2 mb-1">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
              )}
              <p className={cn(
                "text-[10px] uppercase tracking-wide font-semibold",
                isPositive 
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              )}>
                Net Akış
              </p>
            </div>
            <p className={cn(
              "text-lg font-bold",
              isPositive 
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-amber-700 dark:text-amber-300"
            )}>
              {formatCurrency(Math.abs(netCashflow))}
            </p>
            <p className={cn(
              "text-[9px]",
              isPositive 
                ? "text-emerald-600/70 dark:text-emerald-400/70"
                : "text-amber-600/70 dark:text-amber-400/70"
            )}>
              {isPositive ? 'Pozitif' : 'Negatif'}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            {view === 'daily' ? (
              <AreaChart data={currentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCollection" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="collection"
                  name="Tahsilat"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorCollection)"
                />
                <Area
                  type="monotone"
                  dataKey="payment"
                  name="Ödeme"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#colorPayment)"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Net"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#8b5cf6' }}
                />
              </AreaChart>
            ) : (
              <LineChart data={currentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="week" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={formatCurrency}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="collection"
                  name="Tahsilat"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  dataKey="payment"
                  name="Ödeme"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#ef4444' }}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Net"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#8b5cf6' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Critical Items */}
        <div className="grid grid-cols-2 gap-4">
          {/* Kritik Ödemeler */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-rose-600" />
                <p className="text-xs font-semibold text-foreground">Kritik Ödemeler</p>
                {criticalPayments.length > 0 && (
                  <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">
                    {criticalPayments.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cashflow/expenses')}
                className="h-6 px-2 text-[10px]"
              >
                Tümü
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {criticalPayments.length > 0 ? (
                criticalPayments.slice(0, 3).map((payment, index) => {
                  const paymentDate = new Date(payment.date);
                  const daysDiff = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div
                      key={index}
                      className="p-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-rose-600" />
                          <span className="text-[10px] font-medium text-foreground">
                            {format(paymentDate, 'd MMM', { locale: tr })}
                          </span>
                          {daysDiff === 0 && (
                            <Badge variant="destructive" className="h-3 px-1 text-[8px]">
                              Bugün!
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground truncate">
                        {payment.description}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-2 rounded-lg border border-border/50 bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground">Kritik ödeme yok</p>
                </div>
              )}
            </div>
          </div>

          {/* Kritik Tahsilatlar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-semibold text-foreground">Kritik Tahsilatlar</p>
                {criticalCollections.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {criticalCollections.length}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/cashflow/bank-accounts')}
                className="h-6 px-2 text-[10px]"
              >
                Tümü
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {criticalCollections.length > 0 ? (
                criticalCollections.slice(0, 3).map((collection, index) => {
                  const collectionDate = new Date(collection.date);
                  const daysDiff = Math.ceil((collectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div
                      key={index}
                      className="p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-emerald-600" />
                          <span className="text-[10px] font-medium text-foreground">
                            {format(collectionDate, 'd MMM', { locale: tr })}
                          </span>
                          {daysDiff === 0 && (
                            <Badge className="h-3 px-1 text-[8px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                              Bugün!
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(collection.amount)}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground truncate">
                        {collection.description}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="p-2 rounded-lg border border-border/50 bg-muted/30 text-center">
                  <p className="text-[10px] text-muted-foreground">Kritik tahsilat yok</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        {criticalPayments.length > 0 && netCashflow < 0 && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <span className="font-semibold">Uyarı:</span> Negatif nakit akışı ve {criticalPayments.length} kritik ödeme var. 
              Nakit durumunu kontrol edin.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CashflowForecast.displayName = "CashflowForecast";

