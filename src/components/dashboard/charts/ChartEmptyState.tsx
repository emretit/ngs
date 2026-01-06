import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion, TrendingUp } from "lucide-react";

interface ChartEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ChartEmptyState = memo(({
  title = "Veri Bulunamadı",
  description = "Seçilen periyot için henüz veri bulunmuyor. Lütfen farklı bir zaman aralığı seçin veya veri ekleyin.",
  actionLabel,
  onAction,
}: ChartEmptyStateProps) => {
  return (
    <Card className="border-border/40 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Icon */}
          <div className="p-4 bg-muted rounded-full">
            <FileQuestion className="h-12 w-12 text-muted-foreground" />
          </div>

          {/* Title */}
          <CardTitle className="text-xl">{title}</CardTitle>

          {/* Description */}
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>

          {/* Action Button */}
          {actionLabel && onAction && (
            <Button onClick={onAction} className="gap-2 mt-4">
              <TrendingUp className="h-4 w-4" />
              {actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ChartEmptyState.displayName = "ChartEmptyState";

