import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, History, RefreshCw } from "lucide-react";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useState, memo } from "react";
import { InsightHistoryDialog } from "./InsightHistoryDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const AIInsightsPanel = memo(() => {
  const { latestInsight, isLoading, generateInsight, isGenerating } = useAIInsights();
  const [showHistory, setShowHistory] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPeriod = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <>
      <Card className="overflow-hidden border-primary/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background pb-3 sm:pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-lg">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
              <span className="truncate">AI İçgörüleri</span>
            </CardTitle>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateInsight({ periodDays: 30 })}
                disabled={isLoading || isGenerating}
                className="h-7 sm:h-8 w-7 sm:w-auto px-2 sm:px-3 shrink-0"
                title="Yenile"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Yenile</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(true)}
                disabled={isLoading}
                className="h-7 sm:h-8 w-7 sm:w-auto px-2 sm:px-3 shrink-0"
              >
                <History className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline ml-2">Geçmiş</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          {isLoading ? (
            <div className="space-y-2 sm:space-y-3">
              <Skeleton className="h-3 sm:h-4 w-full" />
              <Skeleton className="h-3 sm:h-4 w-5/6" />
              <Skeleton className="h-3 sm:h-4 w-4/6" />
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-2 sm:space-y-3">
              <div className="relative">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-pulse" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-primary opacity-30" />
                </div>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm animate-pulse text-center px-4">
                AI verilerinizi analiz ediyor...
              </p>
            </div>
          ) : latestInsight ? (
            <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {latestInsight.insight_text}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 border-t">
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  📅 <span className="hidden sm:inline">{formatPeriod(latestInsight.period_start, latestInsight.period_end)}</span>
                  <span className="sm:hidden">{new Date(latestInsight.period_start).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - {new Date(latestInsight.period_end).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                </Badge>
                
                {latestInsight.data_summary?.totalProposals > 0 && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    📊 {latestInsight.data_summary.totalProposals} Teklif
                  </Badge>
                )}
                
                {latestInsight.data_summary?.newCustomers > 0 && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    👥 {latestInsight.data_summary.newCustomers} Yeni Müşteri
                  </Badge>
                )}
                
                {latestInsight.data_summary?.totalRevenue > 0 && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    💰 <span className="hidden sm:inline">₺{latestInsight.data_summary.totalRevenue.toLocaleString('tr-TR')}</span>
                    <span className="sm:hidden">₺{(latestInsight.data_summary.totalRevenue / 1000).toFixed(0)}K</span>
                  </Badge>
                )}
              </div>

              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Oluşturulma: {formatDate(latestInsight.created_at)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3 sm:space-y-4">
              <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
              <div className="text-center space-y-1.5 sm:space-y-2 px-4">
                <p className="text-xs sm:text-sm font-medium">Henüz içgörü oluşturulmamış</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  İşletme verilerinizi analiz etmek için yenile butonuna tıklayın
                </p>
              </div>
              <Button
                onClick={() => generateInsight({ periodDays: 30 })}
                disabled={isGenerating}
                className="gap-1.5 sm:gap-2 h-8 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">İlk İçgörüyü Oluştur</span>
                <span className="sm:hidden">Oluştur</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <InsightHistoryDialog 
        open={showHistory} 
        onOpenChange={setShowHistory}
      />
    </>
  );
});
