import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TrendData } from "./utils/chartCalculations";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StatCardProps {
  title: string;
  data: TrendData;
  formatValue: (value: number) => string;
  sparklineData?: { value: number }[];
  color: string;
  icon?: React.ReactNode;
}

const StatCard = memo(({ title, data, formatValue, sparklineData, color, icon }: StatCardProps) => {
  const TrendIcon = data.change === 'up' ? TrendingUp : data.change === 'down' ? TrendingDown : Minus;
  const ArrowIcon = data.change === 'up' ? ArrowUp : ArrowDown;
  
  return (
    <Card 
      className="hover:shadow-md transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col"
      role="article"
      aria-label={`${title}: ${formatValue(data.value)}`}
    >
      <CardContent className="p-2.5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1">
            {icon && (
              <div className={cn("p-0.5 rounded", `bg-${color}-500/10`)} aria-hidden="true">
                {icon}
              </div>
            )}
            <h4 className="text-[10px] font-medium text-muted-foreground">{title}</h4>
          </div>
          <TrendIcon 
            className={cn(
              "h-3 w-3",
              data.change === 'up' && "text-emerald-500",
              data.change === 'down' && "text-red-500",
              data.change === 'neutral' && "text-muted-foreground"
            )}
            aria-label={`Trend: ${data.change === 'up' ? 'yükseliş' : data.change === 'down' ? 'düşüş' : 'sabit'}`}
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-baseline justify-between">
            <span 
              className="text-lg font-bold text-foreground leading-tight"
              aria-label={`Değer: ${formatValue(data.value)}`}
            >
              {formatValue(data.value)}
            </span>
            {data.change !== 'neutral' && (
              <Badge 
                variant="outline" 
                className={cn(
                  "gap-0.5 text-[9px] font-medium h-4 px-1",
                  data.change === 'up' && "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                  data.change === 'down' && "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400"
                )}
                aria-label={`Değişim: ${data.change === 'up' ? 'artış' : 'azalış'} ${Math.abs(data.trend)} yüzde`}
              >
                <ArrowIcon className="h-2 w-2" aria-hidden="true" />
                {Math.abs(data.trend)}%
              </Badge>
            )}
          </div>

          {sparklineData && sparklineData.length > 0 && (
            <div className="flex-1 w-full min-h-[40px] mt-2" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={1.5}
                    dot={false}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bulunduğumuz Ay Bilgisi */}
          {data.currentMonthValue !== undefined && data.currentMonthName && (
            <p 
              className="text-[9px] text-muted-foreground leading-tight mt-auto pt-1.5 border-t border-border/30"
              aria-label={`${data.currentMonthName}: ${formatValue(data.currentMonthValue)}`}
            >
              {data.currentMonthName}: {formatValue(data.currentMonthValue)}
            </p>
          )}

          <p 
            className="text-[9px] text-muted-foreground leading-tight mt-auto pt-2"
            aria-label={`Önceki değer: ${formatValue(data.previousValue)}`}
          >
            Önceki: {formatValue(data.previousValue)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = "StatCard";

interface ChartSummaryStatsProps {
  type: 'financial' | 'sales';
  data: any;
  sparklineData?: any;
  className?: string;
}

const formatCurrency = (value: number) => {
  return `₺${value.toLocaleString('tr-TR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
};

const formatNumber = (value: number) => {
  return value.toLocaleString('tr-TR');
};

const formatPercentage = (value: number) => {
  return `%${value.toFixed(1)}`;
};

export const ChartSummaryStats = memo(({ type, data, sparklineData, className }: ChartSummaryStatsProps) => {
  if (type === 'financial') {
    return (
      <div 
        className={className || "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"}
        role="region"
        aria-label="Finansal özet istatistikler"
      >
        <StatCard
          title="Gelir"
          data={data.totalRevenue}
          formatValue={formatCurrency}
          sparklineData={sparklineData?.gelir}
          color="#10b981"
          icon={<TrendingUp className="h-3 w-3 text-emerald-600" />}
        />
        <StatCard
          title="Gider"
          data={data.totalExpense}
          formatValue={formatCurrency}
          sparklineData={sparklineData?.gider}
          color="#ef4444"
          icon={<TrendingDown className="h-3 w-3 text-red-600" />}
        />
        <StatCard
          title="Kar"
          data={data.netProfit}
          formatValue={formatCurrency}
          sparklineData={sparklineData?.kar}
          color="#8b5cf6"
          icon={<TrendingUp className="h-3 w-3 text-purple-600" />}
        />
        <StatCard
          title="Kar Marjı"
          data={data.avgMargin}
          formatValue={formatPercentage}
          color="#f59e0b"
          icon={<Badge className="h-3 w-3 bg-amber-500" />}
        />
      </div>
    );
  }

  // Sales type
  return (
    <div 
      className={className || "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4"}
      role="region"
      aria-label="Satış özet istatistikler"
    >
      <StatCard
        title="Toplam Satış"
        data={data.totalSales}
        formatValue={formatCurrency}
        sparklineData={sparklineData?.sales}
        color="#3b82f6"
        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
      />
      <StatCard
        title="Toplam Sipariş"
        data={data.totalOrders}
        formatValue={formatNumber}
        sparklineData={sparklineData?.siparis}
        color="#10b981"
        icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}
      />
      <StatCard
        title="Toplam Müşteri"
        data={data.totalCustomers}
        formatValue={formatNumber}
        sparklineData={sparklineData?.musteri}
        color="#f59e0b"
        icon={<TrendingUp className="h-4 w-4 text-amber-600" />}
      />
      <StatCard
        title="Ort. Sipariş Değeri"
        data={data.avgOrderValue}
        formatValue={formatCurrency}
        color="#8b5cf6"
        icon={<Badge className="h-4 w-4 bg-purple-500" />}
      />
    </div>
  );
});

ChartSummaryStats.displayName = "ChartSummaryStats";

