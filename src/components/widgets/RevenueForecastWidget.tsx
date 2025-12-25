import { useQuery } from '@tanstack/react-query';
import { generateRevenueForecast } from '@/services/forecastService';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function RevenueForecastWidget() {
  const { data: forecastData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['revenue-forecast'],
    queryFn: () => generateRevenueForecast(12, 3),
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-[250px] w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!forecastData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Tahmin verileri yüklenemedi
        </p>
        <Button onClick={() => refetch()} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tekrar Dene
        </Button>
      </div>
    );
  }

  // Combine historical and forecast for chart
  const chartData = [
    ...forecastData.historical.map(h => ({
      name: `${h.month.substring(0, 3)} ${h.year}`,
      historical: h.revenue,
      forecast: null,
    })),
    ...forecastData.forecast.map(f => ({
      name: `${f.month.substring(0, 3)} ${f.year}`,
      historical: null,
      forecast: f.revenue,
    })),
  ];

  // Get trend icon and color
  const getTrendIcon = () => {
    switch (forecastData.trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTrendLabel = () => {
    switch (forecastData.trend) {
      case 'increasing':
        return 'Artış Trendi';
      case 'decreasing':
        return 'Azalış Trendi';
      default:
        return 'Stabil';
    }
  };

  const getTrendColor = () => {
    switch (forecastData.trend) {
      case 'increasing':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'decreasing':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Get confidence color
  const getConfidenceColor = () => {
    if (forecastData.confidence >= 70) return 'text-emerald-600';
    if (forecastData.confidence >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={cn('flex items-center gap-1', getTrendColor())}>
            {getTrendIcon()}
            {getTrendLabel()}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <span className={getConfidenceColor()}>
              %{forecastData.confidence} Güven
            </span>
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isRefetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Chart */}
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              stroke="#888"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#888"
              tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: any) => [`₺${value?.toLocaleString('tr-TR')}`, '']}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => value === 'historical' ? 'Geçmiş' : 'Tahmin'}
            />
            <ReferenceLine
              x={chartData[forecastData.historical.length - 1]?.name}
              stroke="#cbd5e1"
              strokeDasharray="3 3"
              label={{ value: 'Bugün', position: 'top', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-3 gap-2">
        {forecastData.forecast.map((f, idx) => (
          <div
            key={idx}
            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800"
          >
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">
              {f.month.substring(0, 3)}
            </p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              ₺{(f.revenue / 1000).toFixed(0)}K
            </p>
          </div>
        ))}
      </div>

      {/* AI Insight */}
      {forecastData.aiInsight && (
        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              {forecastData.aiInsight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
