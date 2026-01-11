import { memo, useState, useMemo, useCallback } from "react";
import { logger } from '@/utils/logger';
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ShoppingCart } from "lucide-react";
import { ChartCard, TimePeriod, ChartType } from "./ChartCard";
import { SalesAnalysisChart } from "./SalesAnalysisChart";
import { ChartSummaryStats } from "./ChartSummaryStats";
import { ChartExportMenu } from "./ChartExportMenu";
import { calculateFinancialSummary, calculateSalesSummary, prepareSparklineData } from "./utils/chartCalculations";
import { chartAnimationConfig } from "./utils/chartAnimations";
import { useSalesAnalysis } from "@/hooks/dashboard/useSalesAnalysis";
import { 
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  Brush
} from "recharts";
import { cn } from "@/lib/utils";

// SalesAnalysisChart için wrapper - hook'u burada çağırıyoruz
const SalesAnalysisChartWrapper = memo(({ timePeriod }: { timePeriod: TimePeriod }) => {
  const { data, isLoading, error } = useSalesAnalysis({ timePeriod });

  if (error) {
    logger.error("Sales analysis data fetch error:", error);
    return (
      <div className="h-[450px] w-full flex items-center justify-center">
        <p className="text-muted-foreground">Veri yüklenirken bir hata oluştu.</p>
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-[450px] w-full" />;
  }

  return <SalesAnalysisChart data={data} timePeriod={timePeriod} />;
});

SalesAnalysisChartWrapper.displayName = "SalesAnalysisChartWrapper";


interface FinancialAnalysisChartProps {
  data?: any;
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  return `₺${value.toLocaleString('tr-TR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const gelir = payload.find((p: any) => p.dataKey === 'gelir')?.value || 0;
    const gider = payload.find((p: any) => p.dataKey === 'gider')?.value || 0;
    const kar = payload.find((p: any) => p.dataKey === 'kar')?.value || 0;
    const profitMargin = gelir > 0 ? ((kar / gelir) * 100).toFixed(1) : '0.0';

    return (
      <div className="bg-background border-2 border-border rounded-xl shadow-2xl p-5 min-w-[260px]">
        <p className="font-bold text-base mb-4 text-foreground border-b-2 border-border/60 pb-3">
          {label}
        </p>
        <div className="space-y-3">
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full shadow-md ring-2 ring-background"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-semibold text-muted-foreground">
                  {item.name}
                </span>
              </div>
              <span className="text-base font-bold text-foreground tabular-nums">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
          <div className="pt-3 mt-3 border-t-2 border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                Kar Marjı
              </span>
              <span className={cn(
                "text-base font-bold tabular-nums",
                kar >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
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

export const FinancialAnalysisChart = memo(({ data, isLoading }: FinancialAnalysisChartProps) => {
  // State'ler
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('12');
  const [chartType, setChartType] = useState<ChartType>('sales'); // Satış Analizi ile başla
  const [brushStartIndex, setBrushStartIndex] = useState<number | undefined>(undefined);
  const [brushEndIndex, setBrushEndIndex] = useState<number | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Türkçe ay isimleri - Tam ve kısa versiyonlar
  const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const fullMonthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  // Son N ayı dinamik olarak oluştur (şu anki ay dahil)
  const generateLastNMonths = useMemo(() => {
    const today = new Date();
    const months = [];
    
    // Özel tarih aralığı seçiliyse
    if (timePeriod === 'custom' && startDate && endDate) {
      const monthsDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const monthCount = Math.max(1, Math.min(monthsDiff, 36)); // Max 36 ay
      
      let baseGelir = 140000;
      let baseGider = 90000;
      
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + (monthCount - 1 - i), 1);
        const monthIndex = date.getMonth();
        const monthName = monthNames[monthIndex];
        const year = String(date.getFullYear()).slice(-2); // Son 2 rakam
        
        const trendMultiplier = 1 + ((monthCount - 1) - i) * 0.02;
        const variation = (Math.random() - 0.5) * 0.15;
        
        const gelir = baseGelir * trendMultiplier * (1 + variation);
        const gider = baseGider * trendMultiplier * (1 + variation * 0.8);
        const kar = gelir - gider;
        const hedef = gelir * 1.15;
        
        months.push({
          month: `${monthName}'${year}`,
          gelir: Math.round(gelir),
          gider: Math.round(gider),
          kar: Math.round(kar),
          hedef: Math.round(hedef),
        });
      }
      
      return months;
    }
    
    // Standart periyot seçimi
    const monthCount = parseInt(timePeriod);
    
    // Başlangıç değerleri
    let baseGelir = 140000;
    let baseGider = 90000;
    
    for (let i = monthCount - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex];
      const year = String(date.getFullYear()).slice(-2); // Son 2 rakam
      
      // Her ay için artış trendi (son aylarda daha fazla artış)
      const trendMultiplier = 1 + ((monthCount - 1) - i) * 0.02; // %2'lik artış trendi
      const variation = (Math.random() - 0.5) * 0.15; // ±7.5% varyasyon
      
      const gelir = baseGelir * trendMultiplier * (1 + variation);
      const gider = baseGider * trendMultiplier * (1 + variation * 0.8);
      const kar = gelir - gider;
      const hedef = gelir * 1.15;
      
      months.push({
        month: `${monthName}'${year}`,
        gelir: Math.round(gelir),
        gider: Math.round(gider),
        kar: Math.round(kar),
        hedef: Math.round(hedef),
      });
    }
    
    return months;
  }, [timePeriod, startDate, endDate]);

  // Mock data for combo chart - Son N ay (şu anki ay dahil)
  const comboChartData = data || generateLastNMonths;

  // Ortalama değerleri hesapla (reference line için)
  const avgGelir = useMemo(() => {
    const total = comboChartData.reduce((sum: number, item: any) => sum + item.gelir, 0);
    return Math.round(total / comboChartData.length);
  }, [comboChartData]);

  const avgGider = useMemo(() => {
    const total = comboChartData.reduce((sum: number, item: any) => sum + item.gider, 0);
    return Math.round(total / comboChartData.length);
  }, [comboChartData]);

  // Summary stats hesaplamaları
  const financialSummary = useMemo(() => 
    calculateFinancialSummary(comboChartData), 
    [comboChartData]
  );

  const salesSummary = useMemo(() => 
    calculateSalesSummary(comboChartData), 
    [comboChartData]
  );

  // Sparkline data
  const sparklineData = useMemo(() => ({
    gelir: prepareSparklineData(comboChartData, 'gelir'),
    gider: prepareSparklineData(comboChartData, 'gider'),
    kar: prepareSparklineData(comboChartData, 'kar'),
    sales: prepareSparklineData(comboChartData, 'sales'),
    siparis: prepareSparklineData(comboChartData, 'siparis'),
    musteri: prepareSparklineData(comboChartData, 'musteri'),
  }), [comboChartData]);

  // Callbacks for period and type changes
  const handleTimePeriodChange = useCallback((period: TimePeriod) => {
    setTimePeriod(period);
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
  }, []);

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <ChartCard
        title={chartType === 'financial' ? "Finansal Analiz" : "Satış Analizi"}
        description={chartType === 'financial' ? "Gelir, gider ve kar takibi" : "Satış, sipariş ve müşteri takibi"}
        icon={chartType === 'financial' ? TrendingUp : ShoppingCart}
        chartType={chartType}
        onChartTypeChange={handleChartTypeChange}
        timePeriod={timePeriod}
        onTimePeriodChange={handleTimePeriodChange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        showDateRangePicker={true}
      >
        <div className="grid grid-cols-1 xl:grid-cols-[75%_1fr] gap-4">
          <Skeleton className="h-[450px] w-full" />
          <div className="grid grid-cols-2 gap-2 h-[450px]">
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title={chartType === 'financial' ? "Finansal Analiz" : "Satış Analizi"}
      description={chartType === 'financial' ? "Gelir, gider ve kar takibi" : "Satış, sipariş ve müşteri takibi"}
      icon={chartType === 'financial' ? TrendingUp : ShoppingCart}
      chartType={chartType}
      onChartTypeChange={handleChartTypeChange}
      timePeriod={timePeriod}
      onTimePeriodChange={handleTimePeriodChange}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      showDateRangePicker={true}
      exportMenu={
        <ChartExportMenu
          data={comboChartData}
          elementId="financial-chart-container"
          filename={chartType === 'financial' ? 'finansal-analiz' : 'satis-analizi'}
          formats={['csv', 'excel', 'png', 'svg']}
        />
      }
    >
      {/* Grid Layout: Grafik (Sol %75) + İstatistikler (Sağ %25) */}
      <div className="grid grid-cols-1 xl:grid-cols-[75%_1fr] gap-4">
        {/* Sol Taraf - Grafik */}
        <div className="min-w-0 w-full">
          {chartType === 'financial' ? (
            <div id="financial-chart-container" className="h-[450px] w-full min-w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={comboChartData} 
                  margin={{ top: 20, right: 40, bottom: 60, left: 20 }}
                >
                  <defs>
                    <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorGider" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05}/>
                    </linearGradient>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15"/>
                    </filter>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    strokeOpacity={0.4}
                    vertical={true}
                    horizontal={true}
                    verticalPoints={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
                  />
                  {/* Ortalama Gelir Reference Line */}
                  <ReferenceLine 
                    y={avgGelir} 
                    stroke="#059669" 
                    strokeDasharray="8 4" 
                    strokeWidth={2}
                    opacity={0.7}
                    label={{ 
                      value: `Ort. Gelir: ${formatCurrency(avgGelir)}`, 
                      position: 'insideTopRight',
                      fill: 'hsl(var(--foreground))',
                      fontSize: 12,
                      fontWeight: 600,
                      style: { textShadow: '0 1px 2px rgba(0,0,0,0.1)' }
                    }}
                  />
                  {/* Ortalama Gider Reference Line */}
                  <ReferenceLine 
                    y={avgGider} 
                    stroke="#dc2626" 
                    strokeDasharray="8 4" 
                    strokeWidth={2}
                    opacity={0.7}
                    label={{ 
                      value: `Ort. Gider: ${formatCurrency(avgGider)}`, 
                      position: 'insideBottomRight',
                      fill: 'hsl(var(--foreground))',
                      fontSize: 12,
                      fontWeight: 600,
                      style: { textShadow: '0 1px 2px rgba(0,0,0,0.1)' }
                    }}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
                    tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                    tick={{ 
                      fontSize: 12, 
                      fill: 'hsl(var(--foreground))',
                      fontWeight: 500 
                    }}
                    angle={0}
                    textAnchor="middle"
                    height={50}
                    interval={0}
                    tickMargin={12}
                  />
                  <YAxis
                    axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1.5 }}
                    tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                    tick={{ 
                      fontSize: 12, 
                      fill: 'hsl(var(--foreground))',
                      fontWeight: 500 
                    }}
                    tickFormatter={formatCurrency}
                    width={90}
                    tickCount={8}
                    tickMargin={10}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    content={<CustomTooltip />} 
                    cursor={{ 
                      stroke: 'hsl(var(--primary))', 
                      strokeWidth: 2, 
                      strokeDasharray: '5 5',
                      opacity: 0.5 
                    }} 
                  />
                  <Legend
                    verticalAlign="top"
                    height={50}
                    iconType="circle"
                    iconSize={12}
                    wrapperStyle={{ 
                      paddingBottom: '20px',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                    formatter={(value) => (
                      <span className="text-sm font-semibold text-foreground">
                        {value}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="gelir"
                    name="Gelir"
                    fill="url(#colorGelir)"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={false}
                    filter="url(#shadow)"
                    {...chartAnimationConfig}
                  />
                  <Bar
                    dataKey="gider"
                    name="Gider"
                    fill="#dc2626"
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                    filter="url(#shadow)"
                    {...chartAnimationConfig}
                  />
                  <Line
                    type="monotone"
                    dataKey="kar"
                    name="Kar"
                    stroke="#7c3aed"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                    filter="url(#shadow)"
                    {...chartAnimationConfig}
                  />
                  <Line
                    type="monotone"
                    dataKey="hedef"
                    name="Hedef"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    strokeDasharray="8 4"
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                    {...chartAnimationConfig}
                  />
                  {/* Brush Selector - 24 ay için aktif */}
                  {parseInt(timePeriod) >= 12 && (
                    <Brush
                      dataKey="month"
                      height={30}
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--muted))"
                      startIndex={brushStartIndex}
                      endIndex={brushEndIndex}
                      onChange={(e: any) => {
                        setBrushStartIndex(e.startIndex);
                        setBrushEndIndex(e.endIndex);
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SalesAnalysisChartWrapper 
              timePeriod={timePeriod}
            />
          )}
        </div>

        {/* Sağ Taraf - İstatistikler (2 Sütun) */}
        <div className="h-[450px] flex flex-col">
          {chartType === 'financial' ? (
            <>
              <ChartSummaryStats 
                type="financial" 
                data={financialSummary} 
                sparklineData={sparklineData}
                className="grid grid-cols-2 gap-2 h-full"
              />
            </>
          ) : (
            <ChartSummaryStats 
              type="sales" 
              data={salesSummary} 
              sparklineData={sparklineData}
              className="grid grid-cols-2 gap-2 h-full"
            />
          )}
        </div>
      </div>
    </ChartCard>
  );
});

FinancialAnalysisChart.displayName = "FinancialAnalysisChart";

export default FinancialAnalysisChart;