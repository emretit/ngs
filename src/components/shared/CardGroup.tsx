import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, MoreHorizontal } from "lucide-react";
import { ButtonGroup, IconButton } from "./ButtonGroup";
import type { 
  EnhancedCardProps, 
  StructuredCardProps, 
  SummaryCardProps, 
  InfoCardProps, 
  StatsCardProps 
} from "@/types/shared-types";

// Temel Card Props
export interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
}

// Enhanced Card Bileşeni
export function EnhancedCard({
  children,
  className,
  onClick,
  hoverable = false,
  variant = 'default',
}: BaseCardProps) {
  const variantClasses = {
    default: "border border-gray-200 bg-white",
    outlined: "border-2 border-gray-300 bg-white",
    elevated: "border border-gray-200 bg-white shadow-lg",
    flat: "border-0 bg-gray-50",
  };

  const hoverClass = hoverable || onClick ? "hover:shadow-md transition-shadow duration-200 cursor-pointer" : "";

  return (
    <Card
      className={cn(
        variantClasses[variant],
        hoverClass,
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

// Structured Card - Header, Content, Footer ile
export interface StructuredCardProps extends BaseCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export function StructuredCard({
  title,
  description,
  icon: Icon,
  actions,
  footer,
  children,
  headerClassName,
  contentClassName,
  footerClassName,
  ...cardProps
}: StructuredCardProps) {
  const hasHeader = title || description || Icon || actions;

  return (
    <EnhancedCard {...cardProps}>
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
      
      {children && (
        <CardContent className={cn("pt-0", contentClassName)}>
          {children}
        </CardContent>
      )}
      
      {footer && (
        <CardFooter className={cn("pt-3 border-t border-gray-100", footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </EnhancedCard>
  );
}

// Summary Card - Dashboard için özet kartları
export interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  onClick?: () => void;
  className?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
  className,
}: SummaryCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      value: 'text-blue-900',
      border: 'border-blue-200',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      value: 'text-green-900',
      border: 'border-green-200',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      value: 'text-orange-900',
      border: 'border-orange-200',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      value: 'text-red-900',
      border: 'border-red-200',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      value: 'text-purple-900',
      border: 'border-purple-200',
    },
    gray: {
      bg: 'bg-gray-50',
      icon: 'text-gray-600',
      value: 'text-gray-900',
      border: 'border-gray-200',
    },
  };

  const colors = colorClasses[color];

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendSymbols = {
    up: '↗',
    down: '↘',
    neutral: '→',
  };

  return (
    <EnhancedCard
      hoverable={!!onClick}
      onClick={onClick}
      className={cn(
        colors.bg,
        colors.border,
        "border-l-4",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {Icon && <Icon className={cn("h-4 w-4", colors.icon)} />}
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
            
            <div className="mt-2">
              <p className={cn("text-2xl font-bold", colors.value)}>
                {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>

            {trend && (
              <div className="mt-2 flex items-center space-x-1">
                <span className={cn("text-sm font-medium", trendColors[trend.direction])}>
                  {trendSymbols[trend.direction]} {Math.abs(trend.value)}%
                </span>
                <span className="text-xs text-gray-500">{trend.label}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  );
}

// Info Card - Bilgi kartları için
export interface InfoCardProps {
  title: string;
  content: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
  icon?: LucideIcon;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function InfoCard({
  title,
  content,
  type = 'info',
  icon: Icon,
  dismissible = false,
  onDismiss,
  className,
}: InfoCardProps) {
  const typeClasses = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200 border-l-blue-500',
      icon: 'text-blue-600',
      title: 'text-blue-900',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200 border-l-yellow-500',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200 border-l-green-500',
      icon: 'text-green-600',
      title: 'text-green-900',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200 border-l-red-500',
      icon: 'text-red-600',
      title: 'text-red-900',
    },
  };

  const classes = typeClasses[type];

  return (
    <EnhancedCard
      variant="flat"
      className={cn(
        classes.bg,
        classes.border,
        "border-l-4",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {Icon && (
              <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", classes.icon)} />
            )}
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-semibold text-sm", classes.title)}>
                {title}
              </h3>
              <div className="mt-1 text-sm text-gray-700">
                {content}
              </div>
            </div>
          </div>
          
          {dismissible && onDismiss && (
            <IconButton
              icon={MoreHorizontal}
              size="sm"
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600"
            />
          )}
        </div>
      </CardContent>
    </EnhancedCard>
  );
}

// Card Grid - Kartları grid'de düzenlemek için
export interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: number;
  className?: string;
  responsive?: boolean;
}

export function CardGrid({
  children,
  columns = 3,
  gap = 4,
  className,
  responsive = true,
}: CardGridProps) {
  const gridClasses = responsive ? {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  } : {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  const gapClasses = {
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    5: "gap-5",
    6: "gap-6",
    7: "gap-7",
    8: "gap-8",
  };

  return (
    <div className={cn(
      "grid",
      gridClasses[columns],
      gapClasses[gap as keyof typeof gapClasses] || "gap-4",
      className
    )}>
      {children}
    </div>
  );
}

// Stats Card - İstatistik kartları için
export interface StatsCardProps {
  stats: Array<{
    label: string;
    value: string | number;
    subValue?: string;
    color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  }>;
  title?: string;
  description?: string;
  className?: string;
}

export function StatsCard({
  stats,
  title,
  description,
  className,
}: StatsCardProps) {
  return (
    <StructuredCard
      title={title}
      description={description}
      className={className}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center p-3 rounded-lg bg-gray-50">
            <div className="text-2xl font-bold text-gray-900">
              {typeof stat.value === 'number' 
                ? stat.value.toLocaleString('tr-TR') 
                : stat.value
              }
            </div>
            <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
            {stat.subValue && (
              <div className="text-xs text-gray-500 mt-0.5">{stat.subValue}</div>
            )}
          </div>
        ))}
      </div>
    </StructuredCard>
  );
}
