import { cn } from "@/lib/utils";
import { CardSummaryProps, statusGridColorClasses, colorVariantClasses } from "./types";

const CardSummary = ({ 
  mainMetric, 
  statusGrid, 
  footer, 
  compact = true,
  gridCols = 2 
}: CardSummaryProps) => {
  const metricColors = mainMetric.color ? colorVariantClasses[mainMetric.color] : null;
  
  const gridColsClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[gridCols];

  return (
    <div className="space-y-2">
      {/* Main Metric */}
      <div className={cn(
        "text-center rounded-lg",
        compact ? "p-2.5" : "p-4",
        metricColors ? metricColors.lightBg : "bg-muted/50"
      )}>
        <div className={cn(
          "font-bold text-foreground",
          compact ? "text-xl" : "text-2xl"
        )}>
          {mainMetric.value}
        </div>
        <div className={cn(
          "font-medium text-muted-foreground",
          compact ? "text-[10px]" : "text-xs"
        )}>
          {mainMetric.label}
        </div>
      </div>

      {/* Status Grid */}
      <div className={cn(
        "grid text-xs",
        gridColsClass,
        compact ? "gap-1.5" : "gap-2"
      )}>
        {statusGrid.map((item, index) => {
          const colors = statusGridColorClasses[item.color];
          return (
            <div
              key={index}
              className={cn(
                "rounded-lg border",
                compact ? "p-2" : "p-3",
                colors.bg,
                colors.border
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <div 
                  className={cn(
                    "rounded-full flex-shrink-0",
                    compact ? "w-1.5 h-1.5" : "w-2 h-2",
                    item.dotColor || colors.dot
                  )}
                  style={item.dotColor ? { backgroundColor: item.dotColor } : undefined}
                />
                <span className={cn(
                  "font-medium truncate",
                  compact ? "text-[10px]" : "text-xs",
                  colors.text
                )}>
                  {item.label}
                </span>
              </div>
              <div className={cn(
                "font-bold",
                compact ? "text-sm" : "text-base",
                colors.value
              )}>
                {item.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {footer && (
        <div className={cn(
          "rounded-lg border border-border bg-muted/30",
          compact ? "p-2" : "p-3"
        )}>
          {footer.type === "progress" && (
            <>
              <div className={cn(
                "flex justify-between items-center",
                compact ? "mb-1.5" : "mb-2"
              )}>
                <span className={cn(
                  "font-medium text-muted-foreground",
                  compact ? "text-[10px]" : "text-xs"
                )}>
                  {footer.progressLabel}
                </span>
                <span className={cn(
                  "font-bold text-foreground",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {footer.progressValue}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    footer.progressColor 
                      ? statusGridColorClasses[footer.progressColor].dot 
                      : "bg-primary"
                  )}
                  style={{ width: `${Math.min(100, footer.progressValue || 0)}%` }}
                />
              </div>
              {footer.progressTarget && (
                <div className={cn(
                  "text-muted-foreground mt-1",
                  compact ? "text-[9px]" : "text-[10px]"
                )}>
                  {footer.progressTarget}
                </div>
              )}
            </>
          )}
          
          {footer.type === "value" && (
            <div className="flex justify-between items-center">
              <span className={cn(
                "text-muted-foreground",
                compact ? "text-[10px]" : "text-xs"
              )}>
                {footer.valueLabel}
              </span>
              <span className={cn(
                "font-bold",
                compact ? "text-sm" : "text-base",
                footer.valueColor === "success" ? "text-green-600" :
                footer.valueColor === "warning" ? "text-orange-600" :
                footer.valueColor === "danger" ? "text-red-600" :
                "text-foreground"
              )}>
                {footer.value}
              </span>
            </div>
          )}
          
          {footer.type === "custom" && footer.customContent}
        </div>
      )}
    </div>
  );
};

export default CardSummary;
