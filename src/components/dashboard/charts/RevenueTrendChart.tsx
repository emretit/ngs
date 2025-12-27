import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from "recharts";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueTrendChartProps {
  data?: {
    month: string;
    income: number;
    expense: number;
    profit: number;
  }[];
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
    const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
    const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
    const profit = payload.find((p: any) => p.dataKey === 'profit')?.value || 0;
    const profitMargin = income > 0 ? ((profit / income) * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 min-w-[220px]">
        <p className="font-bold text-sm mb-3 text-foreground border-b border-border pb-2">{label}</p>
        <div className="space-y-2">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Kar Marjı</span>
              <span className={cn(
                "text-sm font-bold",
                profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {profitMargin}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueTrendChart = memo(({ data, isLoading }: RevenueTrendChartProps) => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
    const totalExpense = data.reduce((sum, d) => sum + d.expense, 0);
    const totalProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0;
    
    // Compare with previous period (first half vs second half if we have enough data)
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);
    
    const firstHalfIncome = firstHalf.reduce((sum, d) => sum + d.income, 0);
    const secondHalfIncome = secondHalf.reduce((sum, d) => sum + d.income, 0);
    const trend = firstHalfIncome > 0 ? ((secondHalfIncome - firstHalfIncome) / firstHalfIncome) * 100 : 0;
    
    return { totalIncome, totalExpense, totalProfit, profitMargin, trend };
  }, [data]);

  if (isLoading) {
    return (
      <Card className="h-full bg-card border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Mock data if none provided
  const chartData = data || [
    { month: "Oca", income: 125000, expense: 85000, profit: 40000 },
    { month: "Şub", income: 145000, expense: 92000, profit: 53000 },
    { month: "Mar", income: 132000, expense: 88000, profit: 44000 },
    { month: "Nis", income: 168000, expense: 105000, profit: 63000 },
    { month: "May", income: 155000, expense: 98000, profit: 57000 },
    { month: "Haz", income: 189000, expense: 115000, profit: 74000 },
  ];

  const displayStats = stats || {
    totalIncome: chartData.reduce((sum, d) => sum + d.income, 0),
    totalExpense: chartData.reduce((sum, d) => sum + d.expense, 0),
    totalProfit: chartData.reduce((sum, d) => sum + d.profit, 0),
    profitMargin: 35,
    trend: 12.5
  };

  return (
    <Card className="h-full bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Gelir & Gider Trendi</CardTitle>
          </div>
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1",
              displayStats.trend >= 0 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800" 
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800"
            )}
          >
            {displayStats.trend >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {displayStats.trend >= 0 ? "+" : ""}{displayStats.trend.toFixed(1)}%
          </Badge>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2.5 mt-3">
          <div className="px-3 py-2.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">Toplam Gelir</p>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(displayStats.totalIncome)}
            </p>
            <p className="text-[9px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Son 6 ay</p>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-950/20 border border-red-200 dark:border-red-800/50 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold mb-0.5">Toplam Gider</p>
            <p className="text-base font-bold text-red-700 dark:text-red-300">
              {formatCurrency(displayStats.totalExpense)}
            </p>
            <p className="text-[9px] text-red-600/70 dark:text-red-400/70 mt-0.5">Son 6 ay</p>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-950/20 border border-blue-200 dark:border-blue-800/50 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold mb-0.5">Net Kar</p>
            <p className={cn(
              "text-base font-bold",
              displayStats.totalProfit >= 0
                ? "text-blue-700 dark:text-blue-300"
                : "text-red-700 dark:text-red-300"
            )}>
              {formatCurrency(displayStats.totalProfit)}
            </p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">Son 6 ay</p>
          </div>
          <div className="px-3 py-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-950/20 border border-purple-200 dark:border-purple-800/50 shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-purple-600 dark:text-purple-400 font-semibold mb-0.5">Kar Marjı</p>
            <p className={cn(
              "text-base font-bold",
              displayStats.profitMargin >= 0
                ? "text-purple-700 dark:text-purple-300"
                : "text-red-700 dark:text-red-300"
            )}>
              {displayStats.profitMargin.toFixed(1)}%
            </p>
            <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70 mt-0.5">Ortalama</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                dy={5}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatCurrency}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Legend
                verticalAlign="bottom"
                height={32}
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => <span className="text-xs font-medium text-muted-foreground">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Gelir"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#incomeGradient)"
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2.5 }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Gider"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#expenseGradient)"
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2.5 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Kar"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#profitGradient)"
                dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

RevenueTrendChart.displayName = "RevenueTrendChart";
