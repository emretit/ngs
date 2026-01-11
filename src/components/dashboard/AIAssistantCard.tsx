import { memo, useState, useEffect, useRef } from "react";
import { logger } from '@/utils/logger';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  User,
  Maximize2,
  Minimize2,
  MessageSquare,
  Trash2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithContext } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useConversationMessages,
  useCreateConversation,
  useSaveMessage,
  useAutoTitleConversation,
  useConversations,
  useDeleteConversation,
} from "@/hooks/useConversation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Hızlı öneriler
const QUICK_SUGGESTIONS = [
  "Bugünkü satış özetini göster",
  "Kritik stok seviyelerini listele",
  "Bu haftaki toplantılarım",
  "Nakit akışı durumu nedir?",
];

export const AIAssistantCard = memo(() => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get user info
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single();
        if (profile) {
          setCompanyId(profile.company_id);
        }
      }
    };
    getUser();
  }, []);

  // Conversation hooks
  const createConversation = useCreateConversation();
  const saveMessage = useSaveMessage();
  const autoTitleConversation = useAutoTitleConversation();
  const deleteConversation = useDeleteConversation();
  const { data: dbMessages = [] } = useConversationMessages(activeConversationId);
  const { data: conversations = [] } = useConversations(userId || "", companyId || "");

  // Sync DB messages to local state
  useEffect(() => {
    if (dbMessages.length > 0) {
      setMessages(
        dbMessages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at),
        }))
      );
    }
  }, [dbMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputMessage.trim();
    if (!messageContent || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      let conversationId = activeConversationId;
      if (!conversationId && userId && companyId) {
        const result = await createConversation.mutateAsync({
          userId,
          companyId,
          title: "Yeni Sohbet",
        });
        if (result) {
          conversationId = result.id;
          setActiveConversationId(result.id);
        }
      }

      if (conversationId) {
        await saveMessage.mutateAsync({
          conversationId,
          role: "user",
          content: messageContent,
        });

        if (messages.length === 0) {
          await autoTitleConversation.mutateAsync({
            conversationId,
            firstMessage: messageContent,
          });
        }
      }

      const conversationHistory = messages.map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));

      const response = await chatWithContext(
        `Sen bir ERP sistemi için akıllı asistansın. Kullanıcının iş süreçleriyle ilgili sorularını yanıtla. Türkçe yanıt ver.\n\nKullanıcı: ${messageContent}`,
        conversationHistory
      );

      if (response.error) throw new Error(response.error);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content || "Üzgünüm, yanıt oluşturamadım.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (conversationId) {
        await saveMessage.mutateAsync({
          conversationId,
          role: "assistant",
          content: aiMessage.content,
          metadata: { model: "gemini-2.0-flash-exp" },
        });
      }
    } catch (error: any) {
      logger.error("AI error:", error);
      toast({
        title: "Hata",
        description: error.message || "Mesaj gönderilemedi",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    setActiveConversationId(null);
  };

  const handleLoadConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMessages([]);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation.mutateAsync(conversationId);
      if (activeConversationId === conversationId) {
        handleClearChat();
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

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300",
        "bg-white dark:bg-zinc-900",
        "border border-zinc-200 dark:border-zinc-800",
        "shadow-md hover:shadow-lg",
        isExpanded ? "h-[600px]" : "h-[400px]"
      )}
    >
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4 border-b border-zinc-100 dark:border-zinc-800 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI Asistan
            </CardTitle>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Powered by Gemini
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Sohbet Geçmişi Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                title="Sohbet Geçmişi"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <div className="px-2 py-1.5">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Sohbet Geçmişi</p>
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-[300px] overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-zinc-500 text-center">
                    Henüz sohbet yok
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <DropdownMenuItem
                      key={conv.id}
                      className="flex items-start justify-between gap-2 px-2 py-2 cursor-pointer"
                      onSelect={() => handleLoadConversation(conv.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate text-zinc-900 dark:text-zinc-100">
                          {conv.title || "Yeni Sohbet"}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          <p className="text-[10px] text-zinc-500">
                            {format(new Date(conv.created_at), "d MMM, HH:mm", { locale: tr })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-zinc-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            title="Yeni Sohbet"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            title={isExpanded ? "Küçült" : "Genişlet"}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>

      {/* Chat Area */}
      <CardContent className="p-0">
        <div className={cn("flex flex-col", isExpanded ? "h-[520px]" : "h-[320px]")}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              // Empty State - Kompakt
              <div className="h-full flex flex-col items-center justify-center px-4 py-6">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 flex items-center justify-center mb-3">
                  <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Size nasıl yardımcı olabilirim?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-4 max-w-md">
                  Satış, stok, finans ve müşteri yönetimi hakkında sorular sorabilirsiniz
                </p>

                {/* Quick Suggestions Grid - Kompakt */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {QUICK_SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-xs font-medium transition-all",
                        "bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900",
                        "border border-zinc-200 dark:border-zinc-700",
                        "text-zinc-700 dark:text-zinc-300",
                        "hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-950 dark:hover:to-purple-950",
                        "hover:border-indigo-300 dark:hover:border-indigo-700",
                        "hover:shadow-sm"
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Messages List - Kompakt
              <div className="px-3 py-3 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="group">
                    <div className="flex gap-2 max-w-full">
                      {/* Avatar - Küçük */}
                      <div
                        className={cn(
                          "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center shadow-sm",
                          message.role === "user"
                            ? "bg-zinc-200 dark:bg-zinc-700"
                            : "bg-gradient-to-br from-indigo-500 to-purple-600"
                        )}
                      >
                        {message.role === "user" ? (
                          <User className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-white" />
                        )}
                      </div>

                      {/* Content - Kompakt */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {message.role === "user" ? "Siz" : "AI"}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </div>
                        
                        {/* Copy button */}
                        {message.role === "assistant" && (
                          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleCopy(message.id, message.content)}
                              className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            >
                              {copiedId === message.id ? (
                                <>
                                  <Check className="h-3 w-3" />
                                  Kopyalandı
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  Kopyala
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator - Kompakt */}
                {isTyping && (
                  <div className="flex gap-2">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">AI</span>
                      <div className="flex gap-1 py-1">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area - Kompakt */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Sorunuzu yazın..."
                disabled={isTyping}
                rows={1}
                className={cn(
                  "w-full resize-none rounded-xl py-2 px-3 pr-10",
                  "bg-white dark:bg-zinc-800",
                  "border border-zinc-200 dark:border-zinc-700",
                  "focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent",
                  "text-xs text-zinc-900 dark:text-zinc-100",
                  "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                  "disabled:opacity-50",
                  "min-h-[36px] max-h-[80px] shadow-sm"
                )}
                style={{
                  height: 'auto',
                  minHeight: '36px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 80) + 'px';
                }}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isTyping}
                size="icon"
                className={cn(
                  "absolute right-1.5 bottom-1.5 h-7 w-7 rounded-lg",
                  "bg-gradient-to-br from-indigo-500 to-purple-600",
                  "hover:from-indigo-600 hover:to-purple-700",
                  "shadow-md hover:shadow-lg",
                  "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                {isTyping ? (
                  <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 text-white" />
                )}
              </Button>
            </div>
            <p className="text-center text-[9px] text-zinc-400 mt-1.5">
              AI hata yapabilir. Önemli bilgileri kontrol edin.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AIAssistantCard.displayName = "AIAssistantCard";

