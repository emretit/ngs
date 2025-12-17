import { memo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bot, Sparkles, MessageSquare, Lightbulb, RefreshCw, History, ChevronDown } from "lucide-react";
import { AIChatInterface } from "./AIChatInterface";
import { useAIInsights } from "@/hooks/useAIInsights";
import { InsightHistoryDialog } from "./InsightHistoryDialog";

export const UnifiedAIPanel = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
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
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Collapsible Trigger - Compact Header */}
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-14 px-4 sm:px-6 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-base">AI Asistan</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0 text-[10px] px-1.5">
                    Yeni
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isOpen ? 'Chat, İçgörüler ve Analizler' : 'Açmak için tıklayın'}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </CollapsibleTrigger>

        {/* Collapsible Content */}
        <CollapsibleContent className="mt-3">
          <Card className="overflow-hidden border-primary/20 shadow-md">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'insights')} className="w-full">
              <div className="border-b border-border/50 bg-muted/30 px-4 sm:px-6 pt-4">
                <TabsList className="grid w-full max-w-md grid-cols-2 h-11 bg-background/50 backdrop-blur-sm">
                  <TabsTrigger
                    value="chat"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-sm font-medium"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>AI Chat</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="insights"
                    className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all text-sm font-medium"
                  >
                    <Lightbulb className="h-4 w-4" />
                    <span>İçgörüler</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Chat Tab Content */}
              <TabsContent value="chat" className="m-0 p-0">
                <AIChatInterface />
              </TabsContent>

              {/* Insights Tab Content */}
              <TabsContent value="insights" className="m-0 p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateInsight({ periodDays: 30 })}
                      disabled={isLoading || isGenerating}
                      className="h-8 gap-1.5"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Yenile</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistory(true)}
                      disabled={isLoading}
                      className="h-8 gap-1.5"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Geçmiş</span>
                    </Button>
                  </div>

                  {/* Insights Content */}
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="relative">
                        <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                        <div className="absolute inset-0 animate-ping">
                          <Sparkles className="h-12 w-12 text-primary opacity-30" />
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm animate-pulse text-center">
                        AI verilerinizi analiz ediyor...
                      </p>
                    </div>
                  ) : latestInsight ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 sm:p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold mb-2">İçgörü Analizi</h3>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                              {latestInsight.insight_text}
                            </p>
                          </div>
                        </div>

                        {/* Data Summary Badges */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                          <Badge variant="outline" className="text-xs">
                            📅 <span className="hidden sm:inline ml-1">{formatPeriod(latestInsight.period_start, latestInsight.period_end)}</span>
                            <span className="sm:hidden ml-1">
                              {new Date(latestInsight.period_start).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} -
                              {new Date(latestInsight.period_end).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </span>
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
                              💰 <span className="hidden sm:inline">₺{latestInsight.data_summary.totalRevenue.toLocaleString('tr-TR')}</span>
                              <span className="sm:hidden">₺{(latestInsight.data_summary.totalRevenue / 1000).toFixed(0)}K</span>
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-3">
                          Oluşturulma: {formatDate(latestInsight.created_at)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-xl border border-dashed border-border/50 bg-muted/20">
                      <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                      <div className="text-center space-y-2">
                        <p className="text-sm font-medium">Henüz içgörü oluşturulmamış</p>
                        <p className="text-xs text-muted-foreground max-w-md">
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
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <InsightHistoryDialog
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
});

UnifiedAIPanel.displayName = "UnifiedAIPanel";
