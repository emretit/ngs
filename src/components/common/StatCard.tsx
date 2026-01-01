import React from "react";
import { cn } from "@/lib/utils";

type StatTrend = "up" | "down" | "neutral";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: StatTrend;
    label?: string;
  };
  footer?: React.ReactNode;
  className?: string;
  valueClassName?: string;
  size?: "sm" | "md" | "lg";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  footer,
  className,
  valueClassName,
  size = "md",
}) => {
  const sizeStyles = {
    sm: {
      container: "p-3",
      title: "text-xs",
      value: "text-lg",
      icon: "h-8 w-8",
    },
    md: {
      container: "p-4",
      title: "text-sm",
      value: "text-2xl",
      icon: "h-10 w-10",
    },
    lg: {
      container: "p-6",
      title: "text-base",
      value: "text-3xl",
      icon: "h-12 w-12",
    },
  };

  const styles = sizeStyles[size];

  const trendColors: Record<StatTrend, string> = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        styles.container,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn("font-medium text-muted-foreground", styles.title)}>
            {title}
          </p>
          <p className={cn("font-bold text-foreground", styles.value, valueClassName)}>
            {value}
          </p>
        </div>
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg bg-primary/10 text-primary",
              styles.icon
            )}
          >
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 mt-2 text-xs", trendColors[trend.direction])}>
          <span>
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}
          </span>
          <span className="font-medium">{Math.abs(trend.value)}%</span>
          {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
        </div>
      )}
      {footer && <div className="mt-3 pt-3 border-t">{footer}</div>}
    </div>
  );
};

export default StatCard;
