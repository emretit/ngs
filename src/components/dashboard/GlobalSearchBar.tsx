import { useState, useRef, useEffect } from "react";
import { Search, Loader2, X, Bot, Sparkles, Send, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateSQLFromQuery, executeSQLQuery } from "@/services/geminiService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sql?: string;
  data?: any[];
  error?: string;
}

const GlobalSearchBar = () => {
  const [mode, setMode] = useState<"search" | "ai">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const { results, isLoading, error } = useGlobalSearch(debouncedQuery);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // AI mode states
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 Merhaba! Verilerinizle ilgili nasıl yardımcı olabilirim?\n\nŞunları sorabilirsiniz:\n• "Bu ayın gelir özeti"\n• "En karlı müşteriler"\n• "Bekleyen ödemeler"\n• "Aktif fırsatların durumu"',
      timestamp: new Date()
    }
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Show/hide dropdown based on query and results
  useEffect(() => {
    // Only show dropdown if:
    // 1. Query is at least 2 characters
    // 2. Either we have results OR we're still loading (showing loading state)
    // 3. Don't show if there's an error and no results
    const shouldShow = searchQuery.length >= 2 && (
      (results.length > 0) || 
      (isLoading && searchQuery.length >= 2)
    );
    setIsOpen(shouldShow);
    setSelectedIndex(-1); // Reset selection when results change
  }, [searchQuery, results, isLoading]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex].url);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSearchQuery("");
        inputRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (url: string) => {
    navigate(url);
    setIsOpen(false);
    setSearchQuery("");
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // AI mode handlers
  const handleAiSendMessage = async () => {
    if (!aiInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: aiInput,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    const query = aiInput;
    setAiInput("");
    setIsAiLoading(true);

    try {
      const result = await generateSQLFromQuery(query);
      
      if (result.error) {
        throw new Error(result.error);
      }

      const data = await executeSQLQuery(result.sql);

      const aiResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: result.explanation || 'SQL sorgusu başarıyla oluşturuldu.',
        timestamp: new Date(),
        sql: result.sql,
        data: data
      };

      setAiMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      const errorResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Üzgünüm, sorgunuzu işlerken bir hata oluştu: ${error.message}`,
        timestamp: new Date(),
        error: error.message
      };
      setAiMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiSendMessage();
    }
  };

  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
  };

  const renderDataTable = (data: any[]) => {
    if (!data || data.length === 0) return null;
    const columns = Object.keys(data[0]);
    
    return (
      <div className="mt-3 border rounded-lg overflow-hidden bg-background">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-3 py-2 text-left font-medium text-foreground capitalize">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t">
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 text-foreground">
                    {typeof row[col] === 'number' && (col.includes('revenue') || col.includes('total') || col.includes('salary')) ?
                      `₺${row[col].toLocaleString('tr-TR')}` :
                      row[col]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  useEffect(() => {
    if (scrollAreaRef.current && mode === 'ai') {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [aiMessages, mode]);

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  // Track selected category for filtering
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const categories = Object.keys(groupedResults);
  
  // Filter results based on selected category
  const filteredResults = selectedCategory === "all" 
    ? results 
    : groupedResults[selectedCategory] || [];

  return (
    <div 
      className="w-full mx-auto px-2 sm:px-4 md:px-0" 
      ref={containerRef}
      role="search"
    >
      {/* Modern Search Card Container */}
      <div className="relative bg-gradient-to-r from-primary/5 via-primary/3 to-background rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-primary to-primary/80 rounded-lg sm:rounded-xl shadow-md">
              {mode === "search" ? (
                <Search className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
              ) : (
                <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {mode === "search" ? "Hızlı Arama" : "AI Analytics"}
              </h2>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                {mode === "search" 
                  ? "Tüm kayıtlarınızda anında arama yapın"
                  : "Doğal dille veri analizi yapın"
                }
              </p>
            </div>
          </div>

          {/* Mode Toggle */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "search" | "ai")}>
            <TabsList className="bg-background/50 h-8 sm:h-10">
              <TabsTrigger value="search" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Arama</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content based on mode */}
        {mode === "search" ? (
          <>
            {/* Search Input Container */}
            <div className="relative group">
              <Input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="🔍 Müşteri, teklif, çalışan, ürün veya fırsat ara..."
                className="w-full pl-4 sm:pl-5 pr-24 sm:pr-32 h-11 sm:h-14 text-xs sm:text-sm bg-background border-2 border-border/50 rounded-lg sm:rounded-xl focus:border-primary focus:ring-2 sm:focus:ring-4 focus:ring-primary/10 transition-all duration-300 shadow-sm hover:shadow-md placeholder:text-muted-foreground/60 font-medium"
                aria-label="Global arama"
                aria-expanded={isOpen}
                aria-controls="search-results"
                aria-autocomplete="list"
                autoComplete="off"
              />
              
              {/* Right side controls */}
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
                {isLoading && (
                  <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary animate-spin" />
                    <span className="text-[10px] sm:text-xs font-semibold text-primary hidden sm:inline">Aranıyor...</span>
                  </div>
                )}
                
                {searchQuery && !isLoading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-7 sm:h-9 px-2 sm:px-3 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 rounded-lg font-medium"
                    aria-label="Aramayı temizle"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="text-[10px] sm:text-xs hidden sm:inline">Temizle</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            {!isOpen && !searchQuery && (
              <div className="mt-2 sm:mt-3 flex items-center justify-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground/70">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted rounded border border-border/50 font-mono text-[9px] sm:text-[10px]">↑</kbd>
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted rounded border border-border/50 font-mono text-[9px] sm:text-[10px]">↓</kbd>
                  <span className="hidden sm:inline">Gezin</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted rounded border border-border/50 font-mono text-[9px] sm:text-[10px]">Enter</kbd>
                  <span className="hidden sm:inline">Seç</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-muted rounded border border-border/50 font-mono text-[9px] sm:text-[10px]">Esc</kbd>
                  <span className="hidden sm:inline">Kapat</span>
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* AI Chat Area */}
            <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4 mb-3 sm:mb-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.sql && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-lg font-mono text-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-[10px] uppercase">SQL Query:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySQL(message.sql!)}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <pre className="overflow-x-auto text-foreground">{message.sql}</pre>
                        </div>
                      )}

                      {message.data && renderDataTable(message.data)}

                      <div className="mt-1 text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analiz ediliyor...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* AI Input Area */}
            <div className="flex gap-2">
              <Input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={handleAiKeyPress}
                placeholder="Soru sorun... (örn: 'Bu ayın toplam geliri nedir?')"
                disabled={isAiLoading}
                className="flex-1 h-10 sm:h-12 text-xs sm:text-sm"
              />
              <Button
                onClick={handleAiSendMessage}
                disabled={isAiLoading || !aiInput.trim()}
                className="h-10 sm:h-12 px-3 sm:px-4 gap-1 sm:gap-2"
              >
                <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Gönder</span>
              </Button>
            </div>
          </>
        )}

            {/* Results Dropdown - Modern Design */}
        {isOpen && (
          <div 
            id="search-results"
            role="listbox"
            className="absolute top-full left-0 right-0 mt-2 sm:mt-4 bg-background border-2 border-border/50 rounded-xl sm:rounded-2xl shadow-2xl max-h-[min(400px,60vh)] sm:max-h-[min(500px,70vh)] overflow-hidden z-50 animate-in slide-in-from-top-4 fade-in-0 duration-300"
          >
            {error ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-2xl flex items-center justify-center">
                  <X className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-foreground font-semibold text-base mb-1">Arama sırasında hata oluştu</p>
                <p className="text-sm text-muted-foreground">Lütfen sayfayı yenileyip tekrar deneyin</p>
              </div>
            ) : results.length === 0 && !isLoading ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-2xl flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-foreground font-semibold text-base mb-1">Sonuç bulunamadı</p>
                <p className="text-sm text-muted-foreground">Farklı anahtar kelimeler deneyin</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row h-[400px] sm:h-[500px]">
                {/* Left Column - Categories */}
                <div className="w-full sm:w-48 md:w-64 border-b sm:border-b-0 sm:border-r border-border/50 bg-muted/20 shrink-0">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border/50">
                    <h3 className="font-bold text-xs sm:text-sm text-foreground">Kategoriler</h3>
                  </div>
                  <ScrollArea className="h-[120px] sm:h-[calc(500px-49px)]">
                    <div className="p-1.5 sm:p-2 space-y-1">
                      <button
                        onClick={() => setSelectedCategory("all")}
                        className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          selectedCategory === "all"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Tümü</span>
                          <Badge variant="secondary" className="ml-2 text-[10px] sm:text-xs">
                            {results.length}
                          </Badge>
                        </div>
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            selectedCategory === category
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{category}</span>
                            <Badge variant="secondary" className="ml-2 text-[10px] sm:text-xs shrink-0">
                              {groupedResults[category].length}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right Column - Results */}
                <div className="flex-1 bg-background min-w-0">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-border/50">
                    <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
                      {selectedCategory === "all" ? "Tüm Sonuçlar" : selectedCategory}
                    </h3>
                  </div>
                  <ScrollArea className="h-[calc(400px-120px-49px)] sm:h-[calc(500px-49px)]">
                    <div className="p-1.5 sm:p-2 space-y-1">
                      {filteredResults.map((result) => {
                        const globalIndex = results.indexOf(result);
                        const isSelected = selectedIndex === globalIndex;
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result.url)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            role="option"
                            aria-selected={isSelected}
                            className={`w-full text-left px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-all duration-200 focus:outline-none group ${
                              isSelected 
                                ? "bg-primary/10 shadow-sm" 
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs sm:text-sm line-clamp-1 transition-colors ${
                                  isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                                }`}>
                                  {result.title}
                                </div>
                                {result.subtitle && (
                                  <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                                    {result.subtitle}
                                  </div>
                                )}
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                                    {result.category}
                                  </Badge>
                                </div>
                              </div>
                              <div className={`ml-2 sm:ml-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${
                                isSelected ? "opacity-100" : ""
                              }`}>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <span className="text-primary text-xs sm:text-sm">→</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default GlobalSearchBar;
