import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiWidgetProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}

const KpiWidget = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  description,
  trend = "neutral",
  onClick,
}: KpiWidgetProps) => {
  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 dark:text-green-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  const getTrendBg = () => {
    if (trend === "up") return "bg-green-50 dark:bg-green-950";
    if (trend === "down") return "bg-red-50 dark:bg-red-950";
    return "bg-muted/50";
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", getTrendBg())}>
          <Icon className={cn("h-4 w-4", getTrendColor())} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold">{value}</div>
          {(change !== undefined || description) && (
            <div className="flex items-center gap-2 text-xs">
              {change !== undefined && (
                <span className={cn("font-medium", getTrendColor())}>
                  {change > 0 ? "+" : ""}
                  {change}%
                </span>
              )}
              <span className="text-muted-foreground">
                {changeLabel || description}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiWidget;
