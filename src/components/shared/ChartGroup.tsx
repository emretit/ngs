import React from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ResponsiveContainer } from "recharts";
import type { 
  ChartConfig as SharedChartConfig, 
  EnhancedChartProps, 
  CardChartProps, 
  SimpleLineChartProps, 
  SimpleBarChartProps, 
  SimpleAreaChartProps, 
  SimplePieChartProps, 
  ChartGridProps 
} from "@/types/shared-types";

// Temel Chart Wrapper Props
export interface BaseChartProps {
  children: React.ReactNode;
  config: ChartConfig;
  title?: string;
  description?: string;
  className?: string;
  height?: number;
  aspectRatio?: 'video' | 'square' | 'portrait' | 'auto';
}

// Enhanced Chart Container - Shadcn ChartContainer'ı extend eder
export function EnhancedChart({
  children,
  config,
  title,
  description,
  className,
  height = 300,
  aspectRatio = 'auto',
}: BaseChartProps) {
  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square', 
    portrait: 'aspect-[3/4]',
    auto: '',
  };

  const containerStyle = aspectRatio === 'auto' ? { height: `${height}px` } : {};

  return (
    <div className="space-y-3">
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      
      <ChartContainer
        config={config}
        className={cn(
          aspectRatio !== 'auto' && aspectClasses[aspectRatio],
          className
        )}
        style={containerStyle}
      >
        {children}
      </ChartContainer>
    </div>
  );
}

// Card ile Sarılı Chart - En yaygın kullanım
export interface CardChartProps extends BaseChartProps {
  icon?: LucideIcon;
  actions?: React.ReactNode;
  cardClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

export function CardChart({
  children,
  config,
  title,
  description,
  icon: Icon,
  actions,
  className,
  cardClassName,
  headerClassName,
  contentClassName,
  height = 300,
  aspectRatio = 'auto',
  variant = 'default',
}: CardChartProps) {
  const variantClasses = {
    default: "border border-gray-200 bg-white",
    outlined: "border-2 border-gray-300 bg-white",
    elevated: "border border-gray-200 bg-white shadow-lg",
  };

  const hasHeader = title || description || Icon || actions;

  return (
    <Card className={cn(variantClasses[variant], cardClassName)}>
      {hasHeader && (
        <CardHeader className={cn("pb-3", headerClassName)}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 flex-1">
              {Icon && (
                <div className="mt-0.5">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="text-sm text-gray-600 mt-1">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {actions && (
              <div className="flex-shrink-0 ml-2">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn("pt-0", contentClassName)}>
        <EnhancedChart
          config={config}
          className={className}
          height={height}
          aspectRatio={aspectRatio}
        >
          {children}
        </EnhancedChart>
      </CardContent>
    </Card>
  );
}

// Hazır Chart Türleri için Common Props
interface CommonChartData {
  [key: string]: any;
}

export interface CommonChartProps {
  data: CommonChartData[];
  config: ChartConfig;
  title?: string;
  description?: string;
  height?: number;
  className?: string;
  colors?: string[];
  showTooltip?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
}

// Line Chart Wrapper
export interface LineChartProps extends CommonChartProps {
  dataKey: string;
  xAxisKey?: string;
  strokeWidth?: number;
  smooth?: boolean;
  showDots?: boolean;
}

export function SimpleLineChart({
  data,
  config,
  dataKey,
  xAxisKey = 'name',
  title,
  description,
  height = 300,
  className,
  strokeWidth = 2,
  smooth = true,
  showDots = false,
  showTooltip = true,
  showLegend = false,
  showGrid = true,
}: LineChartProps) {
  return (
    <CardChart
      config={config}
      title={title}
      description={description}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          {showTooltip && (
            <ChartTooltip 
              cursor={{ stroke: 'rgba(0, 0, 0, 0.1)' }}
              content={<ChartTooltipContent />} 
            />
          )}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          <Line
            type={smooth ? "monotone" : "linear"}
            dataKey={dataKey}
            strokeWidth={strokeWidth}
            dot={showDots}
          />
        </LineChart>
      </ResponsiveContainer>
    </CardChart>
  );
}

// Bar Chart Wrapper  
export interface BarChartProps extends CommonChartProps {
  dataKey: string | string[];
  xAxisKey?: string;
  stacked?: boolean;
  horizontal?: boolean;
}

export function SimpleBarChart({
  data,
  config,
  dataKey,
  xAxisKey = 'name',
  title,
  description,
  height = 300,
  className,
  stacked = false,
  horizontal = false,
  showTooltip = true,
  showLegend = false,
  showGrid = true,
}: BarChartProps) {
  const dataKeys = Array.isArray(dataKey) ? dataKey : [dataKey];

  return (
    <CardChart
      config={config}
      title={title}
      description={description}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'horizontal' : 'vertical'}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          {horizontal ? (
            <>
              <XAxis type="number" />
              <YAxis type="category" dataKey={xAxisKey} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} />
              <YAxis />
            </>
          )}
          {showTooltip && (
            <ChartTooltip content={<ChartTooltipContent />} />
          )}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {dataKeys.map((key, index) => (
            <Bar 
              key={key}
              dataKey={key}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardChart>
  );
}

// Area Chart Wrapper
export interface AreaChartProps extends CommonChartProps {
  dataKey: string | string[];
  xAxisKey?: string;
  stacked?: boolean;
  fillOpacity?: number;
}

export function SimpleAreaChart({
  data,
  config,
  dataKey,
  xAxisKey = 'name',
  title,
  description,
  height = 300,
  className,
  stacked = false,
  fillOpacity = 0.6,
  showTooltip = true,
  showLegend = false,
  showGrid = true,
}: AreaChartProps) {
  const dataKeys = Array.isArray(dataKey) ? dataKey : [dataKey];

  return (
    <CardChart
      config={config}
      title={title}
      description={description}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          {showTooltip && (
            <ChartTooltip content={<ChartTooltipContent />} />
          )}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId={stacked ? 'stack' : undefined}
              fillOpacity={fillOpacity}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </CardChart>
  );
}

// Pie Chart Wrapper
export interface PieChartProps extends CommonChartProps {
  dataKey: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
}

export function SimplePieChart({
  data,
  config,
  dataKey,
  nameKey = 'name',
  title,
  description,
  height = 300,
  className,
  innerRadius = 0,
  outerRadius,
  showLabels = true,
  showTooltip = true,
  showLegend = true,
}: PieChartProps) {
  return (
    <CardChart
      config={config}
      title={title}
      description={description}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {showTooltip && (
            <ChartTooltip content={<ChartTooltipContent />} />
          )}
          {showLegend && <ChartLegend content={<ChartLegendContent />} />}
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            label={showLabels}
          />
        </PieChart>
      </ResponsiveContainer>
    </CardChart>
  );
}

// Chart Grid - Birden fazla chart'ı düzenlemek için
export interface ChartGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export function ChartGrid({ 
  children, 
  columns = 2, 
  gap = 6, 
  className 
}: ChartGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
  };

  const gapClasses = {
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
  };

  return (
    <div className={cn(
      "grid",
      gridClasses[columns],
      gapClasses[gap as keyof typeof gapClasses] || "gap-6",
      className
    )}>
      {children}
    </div>
  );
}

// Import'lar için re-export
export { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid } from "recharts";
