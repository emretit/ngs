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
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[180px]">
        <p className="font-semibold text-sm mb-2 text-foreground">{label}</p>
        <div className="space-y-1.5">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-xs text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-xs font-semibold text-foreground">
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
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
            <p className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400 font-medium">Gelir</p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(displayStats.totalIncome)}
            </p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
            <p className="text-[10px] uppercase tracking-wide text-red-600 dark:text-red-400 font-medium">Gider</p>
            <p className="text-sm font-bold text-red-700 dark:text-red-300">
              {formatCurrency(displayStats.totalExpense)}
            </p>
          </div>
          <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50">
            <p className="text-[10px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-medium">Kar</p>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(displayStats.totalProfit)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={30}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Gelir"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#incomeGradient)"
                dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Gider"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#expenseGradient)"
                dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                name="Kar"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#profitGradient)"
                dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

RevenueTrendChart.displayName = "RevenueTrendChart";
