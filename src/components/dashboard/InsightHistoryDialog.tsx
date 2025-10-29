import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAIInsights } from "@/hooks/useAIInsights";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface InsightHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InsightHistoryDialog = ({ open, onOpenChange }: InsightHistoryDialogProps) => {
  const { insightHistory, isLoadingHistory } = useAIInsights();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPeriod = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    const endDate = new Date(end).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    return `${startDate} - ${endDate}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            İçgörü Geçmişi
          </DialogTitle>
          <DialogDescription>
            Geçmiş AI analizlerinizi görüntüleyin
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoadingHistory ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ))}
            </div>
          ) : insightHistory && insightHistory.length > 0 ? (
            <div className="space-y-4">
              {insightHistory.map((insight, index) => (
                <div
                  key={insight.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                      {index === 0 ? "En Yeni" : formatDate(insight.created_at)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      📅 {formatPeriod(insight.period_start, insight.period_end)}
                    </Badge>
                  </div>

                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {insight.insight_text}
                  </p>

                  {insight.data_summary && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {insight.data_summary.totalProposals > 0 && (
                        <Badge variant="outline" className="text-xs">
                          📊 {insight.data_summary.totalProposals} Teklif
                        </Badge>
                      )}
                      {insight.data_summary.acceptanceRate > 0 && (
                        <Badge variant="outline" className="text-xs">
                          ✅ %{insight.data_summary.acceptanceRate} Kabul
                        </Badge>
                      )}
                      {insight.data_summary.totalRevenue > 0 && (
                        <Badge variant="outline" className="text-xs">
                          💰 ₺{insight.data_summary.totalRevenue.toLocaleString('tr-TR')}
                        </Badge>
                      )}
                      {insight.data_summary.newCustomers > 0 && (
                        <Badge variant="outline" className="text-xs">
                          👥 {insight.data_summary.newCustomers} Müşteri
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Sparkles className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Henüz geçmiş içgörü bulunmuyor
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
