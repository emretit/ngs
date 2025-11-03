import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, History } from "lucide-react";
import { useAIInsights } from "@/hooks/useAIInsights";
import { useState } from "react";
import { InsightHistoryDialog } from "./InsightHistoryDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const AIInsightsPanel = () => {
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
        <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              AI İçgörüleri
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
              disabled={isLoading}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="relative">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-10 w-10 text-primary opacity-30" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm animate-pulse">
                AI verilerinizi analiz ediyor...
              </p>
            </div>
          ) : latestInsight ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {latestInsight.insight_text}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Badge variant="outline" className="text-xs">
                  📅 {formatPeriod(latestInsight.period_start, latestInsight.period_end)}
                </Badge>
                
                {latestInsight.data_summary?.totalProposals > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    📊 {latestInsight.data_summary.totalProposals} Teklif
                  </Badge>
                )}
                
                {latestInsight.data_summary?.newCustomers > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    👥 {latestInsight.data_summary.newCustomers} Yeni Müşteri
                  </Badge>
                )}
                
                {latestInsight.data_summary?.totalRevenue > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    💰 ₺{latestInsight.data_summary.totalRevenue.toLocaleString('tr-TR')}
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Oluşturulma: {formatDate(latestInsight.created_at)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Sparkles className="h-12 w-12 text-muted-foreground/50" />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">Henüz içgörü oluşturulmamış</p>
                <p className="text-xs text-muted-foreground">
                  İşletme verilerinizi analiz etmek için yenile butonuna tıklayın
                </p>
              </div>
              <Button
                onClick={() => generateInsight({ periodDays: 30 })}
                disabled={isGenerating}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                İlk İçgörüyü Oluştur
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
};
