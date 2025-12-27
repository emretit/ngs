import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { PieChart as PieChartIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialDistributionChartProps {
  assets?: {
    bank: number;
    cash: number;
    receivables: number;
    checks: number;
    stock: number;
    total: number;
  };
  liabilities?: {
    payables: number;
    creditCards: number;
    loans: number;
    einvoices: number;
    total: number;
  };
  isLoading?: boolean;
}

const ASSET_COLORS = [
  { name: "Banka", color: "#3b82f6", lightColor: "#93c5fd" },
  { name: "Nakit", color: "#10b981", lightColor: "#6ee7b7" },
  { name: "Alacaklar", color: "#8b5cf6", lightColor: "#c4b5fd" },
  { name: "Çekler", color: "#f59e0b", lightColor: "#fcd34d" },
  { name: "Stok", color: "#6366f1", lightColor: "#a5b4fc" },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `₺${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₺${(value / 1000).toFixed(0)}K`;
  }
  return `₺${value.toFixed(0)}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: data.payload.fill }} 
          />
          <span className="text-sm font-medium">{data.name}</span>
        </div>
        <p className="text-lg font-bold mt-1">{formatCurrency(data.value)}</p>
        <p className="text-xs text-muted-foreground">{data.payload.percentage}%</p>
      </div>
    );
  }
  return null;
};

export const FinancialDistributionChart = memo(({ 
  assets, 
  liabilities, 
  isLoading 
}: FinancialDistributionChartProps) => {
  
  const chartData = useMemo(() => {
    if (!assets) {
      // Mock data
      return [
        { name: "Banka", value: 250000, fill: "#3b82f6", percentage: 35 },
        { name: "Nakit", value: 85000, fill: "#10b981", percentage: 12 },
        { name: "Alacaklar", value: 180000, fill: "#8b5cf6", percentage: 25 },
        { name: "Çekler", value: 120000, fill: "#f59e0b", percentage: 17 },
        { name: "Stok", value: 80000, fill: "#6366f1", percentage: 11 },
      ];
    }

    const items = [
      { name: "Banka", value: assets.bank, fill: "#3b82f6" },
      { name: "Nakit", value: assets.cash, fill: "#10b981" },
      { name: "Alacaklar", value: assets.receivables, fill: "#8b5cf6" },
      { name: "Çekler", value: assets.checks, fill: "#f59e0b" },
      { name: "Stok", value: assets.stock, fill: "#6366f1" },
    ].filter(item => item.value > 0);

    const total = items.reduce((sum, item) => sum + item.value, 0);
    
    return items.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
    }));
  }, [assets]);

  const totalAssets = assets?.total || chartData.reduce((sum, d) => sum + d.value, 0);
  const totalLiabilities = liabilities?.total || 350000;
  const netWorth = totalAssets - totalLiabilities;
  const healthRatio = totalAssets > 0 ? ((totalAssets - totalLiabilities) / totalAssets) * 100 : 0;

  if (isLoading) {
    return (
      <Card className="h-full bg-card border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[280px]">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <PieChartIcon className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base font-semibold">Varlık Dağılımı</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          {/* Donut Chart */}
          <div className="relative h-[200px] w-[200px] flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Toplam</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalAssets)}</p>
            </div>
          </div>
          
          {/* Legend & Stats */}
          <div className="flex-1 space-y-3">
            {/* Legend Items */}
            <div className="space-y-2">
              {chartData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{formatCurrency(item.value)}</span>
                    <span className="text-[10px] text-muted-foreground w-8 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 pt-3">
              {/* Net Worth */}
              <div className={cn(
                "flex items-center justify-between p-2 rounded-lg",
                netWorth >= 0 
                  ? "bg-emerald-50 dark:bg-emerald-950/30" 
                  : "bg-red-50 dark:bg-red-950/30"
              )}>
                <div className="flex items-center gap-1.5">
                  {netWorth >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">Net Değer</span>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  netWorth >= 0 
                    ? "text-emerald-600 dark:text-emerald-400" 
                    : "text-red-600 dark:text-red-400"
                )}>
                  {netWorth >= 0 ? "+" : ""}{formatCurrency(netWorth)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FinancialDistributionChart.displayName = "FinancialDistributionChart";
