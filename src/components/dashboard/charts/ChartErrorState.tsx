import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface ChartErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
}

export const ChartErrorState = memo(({
  title = "Veri Yüklenirken Hata Oluştu",
  description = "Grafik verileri yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.",
  error,
  onRetry,
}: ChartErrorStateProps) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <Card className="border-border/40 bg-card/80 backdrop-blur-sm border-red-500/20">
      <CardContent className="p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Error Icon */}
          <div className="p-4 bg-red-500/10 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <CardTitle className="text-xl text-red-900 dark:text-red-100">
            {title}
          </CardTitle>

          {/* Description */}
          <p className="text-sm text-muted-foreground max-w-md">
            {description}
          </p>

          {/* Error Message (if available) */}
          {errorMessage && (
            <div className="mt-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg max-w-md">
              <p className="text-xs font-mono text-red-700 dark:text-red-300">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Retry Button */}
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline"
              className="gap-2 mt-4 border-red-500/50 hover:bg-red-500/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Tekrar Dene
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ChartErrorState.displayName = "ChartErrorState";

