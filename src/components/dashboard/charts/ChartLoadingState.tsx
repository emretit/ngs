import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartLoadingStateProps {
  height?: string;
}

export const ChartLoadingState = memo(({ height = "450px" }: ChartLoadingStateProps) => {
  return (
    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Legend skeleton */}
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
          
          {/* Chart skeleton with shimmer effect */}
          <div className="relative" style={{ height }}>
            <Skeleton className="h-full w-full rounded-lg animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>

          {/* Axis labels skeleton */}
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-4 w-12" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

ChartLoadingState.displayName = "ChartLoadingState";

