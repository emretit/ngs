import { memo, useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Bot,
  Sparkles,
  MessageSquare,
  Lightbulb,
  RefreshCw,
  History,
  ChevronDown,
  Send,
  Loader2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { ConversationList } from "@/components/ai/ConversationList";
import { MessageBubble } from "@/components/ai/MessageBubble";
import { PromptSuggestions } from "@/components/ai/PromptSuggestions";
import { useAIInsights } from "@/hooks/useAIInsights";
import { InsightHistoryDialog } from "./InsightHistoryDialog";
import {
  useConversations,
  useConversationMessages,
  useCreateConversation,
  useDeleteConversation,
  useSaveMessage,
  useAutoTitleConversation,
} from "@/hooks/useConversation";
import { chatWithContext } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const UnifiedAIPanel = memo(() => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Insights hook
  const { latestInsight, isLoading: insightsLoading, generateInsight, isGenerating } = useAIInsights();
  const [showHistory, setShowHistory] = useState(false);

  // Get user info
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          setCompanyId(profile.company_id);
        }
      }
    };
    getUser();
  }, []);

  // Conversation queries
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations(
    userId || '',
    companyId || ''
  );
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(activeConversationId);
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();
  const saveMessage = useSaveMessage();
  const autoTitleConversation = useAutoTitleConversation();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select first conversation
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0 && activeTab === 'chat') {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId, activeTab]);

  const handleNewConversation = async () => {
    if (!userId || !companyId) return;

    try {
      const result = await createConversation.mutateAsync({
        userId,
        companyId,
        title: 'Yeni Sohbet',
      });

      if (result) {
        setActiveConversationId(result.id);
        setInputMessage("");
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Yeni sohbet oluşturulamadı",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation.mutateAsync(conversationId);

      if (conversationId === activeConversationId) {
        setActiveConversationId(null);
      }

      toast({
        title: "Başarılı",
        description: "Sohbet silindi",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Sohbet silinemedi",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !userId || !companyId || isTyping) return;

    let currentConversationId = activeConversationId;

    try {
      if (!currentConversationId) {
        const result = await createConversation.mutateAsync({
          userId,
          companyId,
        });

        if (!result) throw new Error('Failed to create conversation');

        currentConversationId = result.id;
        setActiveConversationId(result.id);
      }

      await saveMessage.mutateAsync({
        conversationId: currentConversationId,
        role: 'user',
        content: inputMessage,
      });

      if (messages.length === 0) {
        await autoTitleConversation.mutateAsync({
          conversationId: currentConversationId,
          firstMessage: inputMessage,
        });
      }

      const userMessage = inputMessage;
      setInputMessage("");
      setIsTyping(true);

      const conversationHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));

      const response = await chatWithContext(userMessage, conversationHistory);

      if (response.error) throw new Error(response.error);

      await saveMessage.mutateAsync({
        conversationId: currentConversationId,
        role: 'assistant',
        content: response.content || 'Üzgünüm, yanıt oluşturamadım.',
        metadata: { model: 'gemini-2.0-flash-exp' },
      });

    } catch (error: any) {
      console.error('Send message error:', error);
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-14 px-4 sm:px-6 bg-gradient-to-r from-indigo-500/8 via-indigo-500/4 to-transparent border border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-base">AI Asistan</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0 text-[10px] px-1.5">
                    Gelişmiş
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isOpen ? 'Chat, İçgörüler ve Analizler' : 'Açmak için tıklayın'}
                </p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-300",
                isOpen && "rotate-180"
              )}
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3">
          <Card className="overflow-hidden border-indigo-500/20 shadow-md">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'insights')} className="w-full">
              <div className="border-b border-border/50 bg-muted/30 px-4 sm:px-6 pt-4">
                <TabsList className="grid w-full max-w-md grid-cols-2 h-11 bg-background/50 backdrop-blur-sm">
                  <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all text-sm font-medium">
                    <MessageSquare className="h-4 w-4" />
                    <span>AI Chat</span>
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all text-sm font-medium">
                    <Lightbulb className="h-4 w-4" />
                    <span>İçgörüler</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Chat Tab */}
              <TabsContent value="chat" className="m-0 p-0">
                <div className="flex h-[600px]">
                  {/* Sidebar */}
                  {isSidebarOpen && (
                    <div className="w-80 border-r border-slate-200 dark:border-slate-800">
                      <ConversationList
                        conversations={conversations}
                        activeConversationId={activeConversationId}
                        onSelectConversation={setActiveConversationId}
                        onNewConversation={handleNewConversation}
                        onDeleteConversation={handleDeleteConversation}
                        isLoading={conversationsLoading}
                      />
                    </div>
                  )}

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                          className="h-8 w-8 p-0"
                        >
                          {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                        </Button>
                        <h3 className="font-semibold text-sm">
                          {activeConversationId
                            ? conversations.find(c => c.id === activeConversationId)?.title || 'Yeni Sohbet'
                            : 'AI Asistan'}
                        </h3>
                      </div>
                      {activeConversationId && (
                        <Badge variant="outline" className="text-xs">{messages.length} mesaj</Badge>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                          <Bot className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Yeni bir sohbet başlatın</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                            AI asistanınız işletmeniz hakkında sorularınızı yanıtlamaya hazır.
                          </p>
                          <div className="w-full max-w-2xl">
                            <PromptSuggestions onSelectPrompt={setInputMessage} filter="all" limit={6} />
                          </div>
                        </div>
                      ) : (
                        <>
                          {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                          ))}
                          {isTyping && (
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="rounded-lg px-4 py-3 bg-slate-100 dark:bg-slate-800 inline-block">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                      <div className="flex gap-2">
                        <Textarea
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyDown={handleKeyPress}
                          placeholder="Mesajınızı yazın..."
                          className="min-h-[60px] max-h-[200px] resize-none"
                          disabled={isTyping}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isTyping}
                          size="lg"
                          className="bg-indigo-500 hover:bg-indigo-600 px-6"
                        >
                          {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 text-center">
                        AI asistanınız Gemini 2.0 ile güçlendirilmiştir
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="m-0 p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => generateInsight({ periodDays: 30 })} disabled={insightsLoading || isGenerating} className="h-8 gap-1.5">
                      <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Yenile</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} disabled={insightsLoading} className="h-8 gap-1.5">
                      <History className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Geçmiş</span>
                    </Button>
                  </div>

                  {insightsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Sparkles className="h-12 w-12 text-indigo-500 animate-pulse" />
                      <p className="text-muted-foreground text-sm animate-pulse">AI verilerinizi analiz ediyor...</p>
                    </div>
                  ) : latestInsight ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent p-4 sm:p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold mb-2">İçgörü Analizi</h3>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                              {latestInsight.insight_text}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-border/30">
                          <Badge variant="outline" className="text-xs">📅 {formatPeriod(latestInsight.period_start, latestInsight.period_end)}</Badge>
                          {latestInsight.data_summary?.totalProposals > 0 && (
                            <Badge variant="secondary" className="text-xs">📊 {latestInsight.data_summary.totalProposals} Teklif</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                          Oluşturulma: {formatDate(latestInsight.created_at)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-xl border border-dashed">
                      <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm font-medium">Henüz içgörü oluşturulmamış</p>
                      <Button onClick={() => generateInsight({ periodDays: 30 })} disabled={isGenerating}>
                        <Sparkles className="h-4 w-4 mr-2" />
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

      <InsightHistoryDialog open={showHistory} onOpenChange={setShowHistory} />
    </>
  );
});

UnifiedAIPanel.displayName = "UnifiedAIPanel";
