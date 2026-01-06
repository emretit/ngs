import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./DateRangePicker";

export type TimePeriod = '6' | '12' | '24' | 'custom';
export type ChartType = 'financial' | 'sales';

interface ChartCardProps {
  // Header props
  title: string;
  description?: string;
  icon: LucideIcon;
  
  // Filter props
  chartType: ChartType;
  onChartTypeChange?: (type: ChartType) => void;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  
  // Date range props (optional - for custom period)
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  showDateRangePicker?: boolean;
  
  // Chart content
  children: ReactNode;
  
  // Summary stats (optional)
  summaryStats?: ReactNode;
  
  // Export menu (optional)
  exportMenu?: ReactNode;
  
  // Optional styling
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const ChartCard = ({
  title,
  description,
  icon: Icon,
  chartType,
  onChartTypeChange,
  timePeriod,
  onTimePeriodChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showDateRangePicker = true,
  children,
  summaryStats,
  exportMenu,
  className,
  headerClassName,
  contentClassName,
}: ChartCardProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header & Filter Card */}
      <Card className="border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Export Menu */}
              {exportMenu && (
                <div>
                  {exportMenu}
                </div>
              )}
              
              {/* Chart Type Selector */}
              {onChartTypeChange && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                    <Button
                      variant={chartType === 'financial' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onChartTypeChange('financial')}
                      className="h-8 px-3 text-xs"
                    >
                      Finansal Analiz
                    </Button>
                    <Button
                      variant={chartType === 'sales' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onChartTypeChange('sales')}
                      className="h-8 px-3 text-xs"
                    >
                      Satış Analizi
                    </Button>
                  </div>
                </div>
              )}

              {/* Time Period Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button
                    variant={timePeriod === '6' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onTimePeriodChange('6')}
                    className="h-8 px-3 text-xs"
                  >
                    6 Ay
                  </Button>
                  <Button
                    variant={timePeriod === '12' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onTimePeriodChange('12')}
                    className="h-8 px-3 text-xs"
                  >
                    12 Ay
                  </Button>
                  <Button
                    variant={timePeriod === '24' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onTimePeriodChange('24')}
                    className="h-8 px-3 text-xs"
                  >
                    24 Ay
                  </Button>
                  {showDateRangePicker && (
                    <Button
                      variant={timePeriod === 'custom' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onTimePeriodChange('custom')}
                      className="h-8 px-3 text-xs"
                    >
                      Özel
                    </Button>
                  )}
                </div>

                {/* Date Range Picker - Özel seçildiğinde görünür */}
                {showDateRangePicker && timePeriod === 'custom' && onStartDateChange && onEndDateChange && (
                  <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={onStartDateChange}
                    onEndDateChange={onEndDateChange}
                  />
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chart Content Card */}
      <Card className={cn(
        "border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm",
        headerClassName
      )}>
        <CardContent 
          className={cn("p-6", contentClassName)}
          role="region"
          aria-label={`${title} grafiği`}
          aria-describedby="chart-description"
        >
          <div 
            id="chart-description" 
            className="sr-only"
            aria-live="polite"
          >
            {description || `${title} için interaktif grafik gösterimi. Klavye ile gezinebilir ve ekran okuyucu ile detaylı bilgi alabilirsiniz.`}
          </div>
          {children}
        </CardContent>
      </Card>

      {/* Summary Stats - Grafik Altında */}
      {summaryStats && (
        <div className="mt-3">
          {summaryStats}
        </div>
      )}
    </div>
  );
};

