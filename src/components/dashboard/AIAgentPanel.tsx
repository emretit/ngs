import { useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bot, 
  Settings2, 
  Image, 
  Play, 
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { generateSQLFromQuery, executeSQLQuery, testGeminiConnection } from "@/services/geminiService";
import { GeminiUsageTracker } from "@/services/geminiUsageTracker";
import { useEffect } from "react";
import { toast } from "sonner";

const AI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", icon: "⚡" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", icon: "🚀" },
  { value: "gemini-2.5-flash-lite", label: "Gemini Flash Lite", icon: "💨" },
];

export const AIAgentPanel = memo(() => {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [isRunning, setIsRunning] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const usageTracker = GeminiUsageTracker.getInstance();

  useEffect(() => {
    checkAPIConnection();
  }, []);

  const checkAPIConnection = async () => {
    setApiStatus('checking');
    const isConnected = await testGeminiConnection();
    setApiStatus(isConnected ? 'connected' : 'error');
  };

  const handleRunTask = async () => {
    if (!prompt.trim()) {
      toast.error("Lütfen bir görev girin");
      return;
    }

    const canRequest = usageTracker.canMakeRequest();
    if (!canRequest.allowed) {
      toast.error(canRequest.reason);
      return;
    }

    setIsRunning(true);

    try {
      usageTracker.trackRequest();
      const result = await generateSQLFromQuery(prompt);

      if (result.error) {
        toast.error(result.error);
      } else {
        const data = await executeSQLQuery(result.sql);
        toast.success(`Görev tamamlandı! ${data.length} sonuç bulundu.`);
      }
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setIsRunning(false);
    }
  };

  const selectedModelInfo = AI_MODELS.find(m => m.value === selectedModel);

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm sm:text-base text-foreground">
            AI Agent ile İnşa Et
          </h3>
          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0 text-[10px] sm:text-xs px-1.5 sm:px-2">
            Yeni
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1.5 h-8 text-xs sm:text-sm"
        >
          <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Proje Ayarları</span>
        </Button>
      </div>

      {/* Main Content */}
      <CardContent className="p-4 sm:p-6">
        {/* Input Area */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 focus-within:border-primary/50 transition-colors">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Agent'a yeni bir sayfa oluşturmasını, rapor hazırlamasını, veri analizi yapmasını vb. söyleyin. İnceleyin, düzenleyin ve paylaşın."
            className="min-h-[80px] sm:min-h-[100px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/70"
            disabled={isRunning}
          />
          
          {/* Bottom Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border-t border-primary/20">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Model:</span>
              <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isRunning}>
                <SelectTrigger className="h-8 w-full sm:w-[180px] text-xs border-border/50 bg-background">
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      <span>{selectedModelInfo?.icon}</span>
                      <span className="truncate">{selectedModelInfo?.label}</span>
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

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 gap-1.5 text-xs border-border/50"
                disabled={isRunning}
              >
                <Image className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Görsel & Dosya Ekle</span>
                <span className="sm:hidden">Ekle</span>
              </Button>
              <Button
                size="sm"
                onClick={handleRunTask}
                disabled={isRunning || !prompt.trim()}
                className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Çalışıyor...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Görevi Çalıştır</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Agent taslak URL'ye yayınlar — canlı siteniz değişmez.{" "}
            <a href="#" className="text-primary hover:underline">Daha fazla bilgi →</a>
          </p>
          
          {/* API Status */}
          <div className="flex items-center gap-1.5">
            {apiStatus === 'checking' ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : apiStatus === 'connected' ? (
              <CheckCircle className="h-3 w-3 text-emerald-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-500" />
            )}
            <span className="text-[10px] text-muted-foreground">
              {apiStatus === 'connected' ? 'Gemini API Aktif' : apiStatus === 'error' ? 'Demo Mod' : 'Kontrol ediliyor...'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AIAgentPanel.displayName = "AIAgentPanel";
