import { memo, useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Bot,
  Sparkles,
  ChevronDown,
  Send,
  Loader2,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Check,
  User,
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
} from "@/hooks/useConversation";

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

export const AIAgentAccordion = memo(() => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
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
  const { data: dbMessages = [] } = useConversationMessages(activeConversationId);

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

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
      console.error("AI error:", error);
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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger Button - Minimal ChatGPT Style */}
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between h-14 px-5 rounded-xl transition-all duration-300",
            "bg-white dark:bg-zinc-900",
            "hover:bg-zinc-50 dark:hover:bg-zinc-800",
            "border border-zinc-200 dark:border-zinc-800",
            "shadow-sm hover:shadow-md",
            "group"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white dark:text-zinc-900" />
            </div>
            <div className="text-left">
              <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                AI Asistan
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isOpen ? "Sohbet devam ediyor" : "Bir soru sorun veya görev verin"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Gemini
            </Badge>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-zinc-400 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </Button>
      </CollapsibleTrigger>

      {/* Content Panel - ChatGPT Style */}
      <CollapsibleContent className="overflow-hidden">
        <div
          className={cn(
            "mt-2 rounded-xl overflow-hidden transition-all duration-300",
            "bg-white dark:bg-zinc-900",
            "border border-zinc-200 dark:border-zinc-800",
            "shadow-lg",
            isExpanded ? "h-[70vh]" : "h-[450px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white dark:text-zinc-900" />
              </div>
              <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                ChatGPT
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearChat}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          <div className={cn("flex flex-col", isExpanded ? "h-[calc(70vh-120px)]" : "h-[330px]")}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                // Empty State - ChatGPT Style
                <div className="h-full flex flex-col items-center justify-center px-6 py-8">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Bot className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    Size nasıl yardımcı olabilirim?
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6 max-w-sm">
                    Satış, stok, finans veya müşteri yönetimi hakkında sorular sorabilirsiniz.
                  </p>

                  {/* Quick Suggestions Grid */}
                  <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
                    {QUICK_SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(suggestion)}
                        className={cn(
                          "text-left px-4 py-3 rounded-xl text-sm transition-all",
                          "bg-zinc-50 dark:bg-zinc-800/50",
                          "border border-zinc-200 dark:border-zinc-700",
                          "text-zinc-700 dark:text-zinc-300",
                          "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                          "hover:border-zinc-300 dark:hover:border-zinc-600"
                        )}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Messages List - ChatGPT Style
                <div className="px-4 py-4 space-y-6">
                  {messages.map((message) => (
                    <div key={message.id} className="group">
                      <div className="flex gap-4 max-w-3xl mx-auto">
                        {/* Avatar */}
                        <div
                          className={cn(
                            "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                            message.role === "user"
                              ? "bg-zinc-200 dark:bg-zinc-700"
                              : "bg-zinc-900 dark:bg-white"
                          )}
                        >
                          {message.role === "user" ? (
                            <User className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                          ) : (
                            <Sparkles className="h-4 w-4 text-white dark:text-zinc-900" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {message.role === "user" ? "Siz" : "ChatGPT"}
                            </span>
                          </div>
                          <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </div>
                          
                          {/* Copy button for assistant */}
                          {message.role === "assistant" && (
                            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleCopy(message.id, message.content)}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                              >
                                {copiedId === message.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    Kopyalandı
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
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

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex gap-4 max-w-3xl mx-auto">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white dark:text-zinc-900" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            ChatGPT
                          </span>
                        </div>
                        <div className="flex gap-1 py-2">
                          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area - ChatGPT Style */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 p-4">
              <div className="max-w-3xl mx-auto">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Mesajınızı yazın..."
                    disabled={isTyping}
                    rows={1}
                    className={cn(
                      "w-full resize-none rounded-2xl py-3 px-4 pr-12",
                      "bg-zinc-100 dark:bg-zinc-800",
                      "border-0 focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600",
                      "text-sm text-zinc-900 dark:text-zinc-100",
                      "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                      "disabled:opacity-50",
                      "min-h-[48px] max-h-[120px]"
                    )}
                    style={{
                      height: 'auto',
                      minHeight: '48px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isTyping}
                    size="icon"
                    className={cn(
                      "absolute right-2 bottom-2 h-8 w-8 rounded-lg",
                      "bg-zinc-900 dark:bg-white",
                      "hover:bg-zinc-700 dark:hover:bg-zinc-200",
                      "disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 text-white dark:text-zinc-900 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 text-white dark:text-zinc-900" />
                    )}
                  </Button>
                </div>
                <p className="text-center text-[10px] text-zinc-400 mt-2">
                  ChatGPT hata yapabilir. Önemli bilgileri kontrol edin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

AIAgentAccordion.displayName = "AIAgentAccordion";
