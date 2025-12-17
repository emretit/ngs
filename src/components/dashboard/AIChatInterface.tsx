import { useState, useRef, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { AIChatMessage, ChatMessage } from "./AIChatMessage";
import { chatWithAI, generateReport, executeSQLQuery } from "@/services/geminiService";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const AI_MODELS = [
  { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash", icon: "⚡" },
  { value: "gemini-exp-1206", label: "Gemini Exp 1206", icon: "🚀" },
  { value: "gemini-2.0-flash-thinking-exp", label: "Gemini 2.0 Thinking", icon: "💨" },
];

const INITIAL_SYSTEM_MESSAGE: ChatMessage = {
  role: 'system',
  content: `Merhaba! 👋 Ben PAFTA AI Agent. Sisteminiz hakkında size yardımcı olabilirim.

📊 VERİ ANALİZİ ÖRNEKLERİ:
• "Geçen ayki teklifleri hazırlayanlara göre sırala"
• "Bu ay kaç müşteri ekledim?"
• "Son 30 günün toplam satış faturalarını göster"
• "En çok stokta olan ürünleri listele"
• "Bekleyen servis taleplerini göster"

💬 YARDIM & REHBERLİK:
• "Nasıl teklif oluştururum?"
• "e-Fatura nasıl gönderilir?"
• "Satın alma onayı nasıl yapılır?"

Hem sorularınızı yanıtlarım hem de verilerinizi görselleştiririm!`,
  timestamp: new Date()
};

export const AIChatInterface = memo(() => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_SYSTEM_MESSAGE]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const userQuery = userMessage.content.toLowerCase();

      // Analiz/veri sorgusu tespit et
      const isDataQuery = (
        userQuery.includes('göster') ||
        userQuery.includes('listele') ||
        userQuery.includes('sırala') ||
        userQuery.includes('kaç') ||
        userQuery.includes('toplam') ||
        userQuery.includes('analiz') ||
        userQuery.includes('rapor') ||
        userQuery.includes('grafik') ||
        userQuery.includes('tablo') ||
        /\d+\s+(ay|gün|hafta|yıl)/.test(userQuery) // "geçen ay", "son 30 gün" vb.
      );

      if (isDataQuery) {
        // VERİ ANALİZİ MODU
        const reportResponse = await generateReport(userMessage.content, undefined, selectedModel);

        if (reportResponse.error) {
          toast.error(reportResponse.error);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `Üzgünüm, analiz yapamadım: ${reportResponse.error}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }

        if (!reportResponse.sql) {
          const noSqlMessage: ChatMessage = {
            role: 'assistant',
            content: reportResponse.explanation || 'SQL sorgusu oluşturulamadı.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, noSqlMessage]);
          return;
        }

        // SQL'i çalıştır
        const data = await executeSQLQuery(reportResponse.sql);

        if (!data || data.length === 0) {
          const noDataMessage: ChatMessage = {
            role: 'assistant',
            content: reportResponse.explanation || 'Veri bulunamadı.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, noDataMessage]);
          return;
        }

        // Hata kontrolü
        if (data[0]?.error) {
          toast.error(data[0].message);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: data[0].message,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }

        // Başarılı - veriyi ve grafiği göster
        const dataMessage: ChatMessage = {
          role: 'assistant',
          content: reportResponse.explanation || 'İşte sonuçlar:',
          data: data,
          chartType: reportResponse.chartType || 'table',
          chartConfig: reportResponse.chartConfig,
          sql: reportResponse.sql,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, dataMessage]);
        toast.success(`${data.length} sonuç bulundu`);
      } else {
        // NORMAL SOHBET MODU
        const apiMessages = [...messages, userMessage]
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }));

        const response = await chatWithAI(apiMessages, selectedModel);

        if (response.error) {
          toast.error(response.error);
          return;
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.content || 'Üzgünüm, yanıt oluşturamadım.',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_SYSTEM_MESSAGE]);
    setInput("");
    toast.success("Sohbet sıfırlandı");
  };

  const selectedModelInfo = AI_MODELS.find(m => m.value === selectedModel);

  return (
    <div className="flex flex-col h-[400px] sm:h-[450px] bg-gradient-to-br from-background via-background to-primary/5">
      {/* Chat Header - Compact */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
            <SelectTrigger className="h-8 w-[140px] sm:w-[160px] text-xs border-border/50">
              <SelectValue>
                <span className="flex items-center gap-1.5">
                  <span>{selectedModelInfo?.icon}</span>
                  <span className="truncate hidden sm:inline text-xs">{selectedModelInfo?.label}</span>
                  <span className="truncate sm:hidden text-xs">Model</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.value} value={model.value} className="text-xs">
                  <span className="flex items-center gap-2">
                    <span>{model.icon}</span>
                    <span>{model.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={isLoading || messages.length <= 1}
          className="h-7 px-2 text-xs"
          title="Sohbeti sıfırla"
        >
          <RotateCcw className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">Sıfırla</span>
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-1">
          {messages.map((message, index) => (
            <AIChatMessage key={index} message={message} />
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 mb-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center shadow-sm">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="bg-muted/80 backdrop-blur-sm border border-border/50 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Compact */}
      <div className="border-t border-border/50 bg-muted/20 p-3">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın... (Enter = gönder)"
            className="min-h-[50px] max-h-[100px] resize-none border-border/50 focus-visible:ring-primary/20 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="h-[50px] px-3 bg-gradient-to-br from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 hidden sm:block">
          AI Agent şirket verilerinize erişebilir ve analizler yapabilir
        </p>
      </div>
    </div>
  );
});

AIChatInterface.displayName = "AIChatInterface";
