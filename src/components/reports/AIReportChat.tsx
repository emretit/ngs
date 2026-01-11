import { useState, useRef, useEffect } from "react";
import { logger } from '@/utils/logger';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { chatWithAI, generateSQLQuery } from "@/services/geminiService";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  TrendingUp,
  PieChart,
  LineChart,
  Table,
  Lightbulb,
  MessageSquare,
  Zap,
  BarChart3,
  X,
  RefreshCw,
  Database
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart as RechartsLine,
  Line,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sql?: string;
  data?: any[];
  error?: string;
  chartType?: 'table' | 'bar' | 'line' | 'pie' | 'area';
  chartConfig?: {
    xKey?: string;
    yKey?: string;
    title?: string;
  };
  isStreaming?: boolean;
}

interface AIReportChatProps {
  searchParams: URLSearchParams;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const QUICK_QUERIES = [
  { label: "Bu ayın satışları", query: "Bu ayın toplam satış tutarı nedir?" },
  { label: "En çok satanlar", query: "En çok satan 10 ürün hangileri?" },
  { label: "Müşteri analizi", query: "Müşteri bazında gelir dağılımını göster" },
  { label: "Açık siparişler", query: "Açık durumda kaç sipariş var?" },
  { label: "Stok durumu", query: "Kritik stok seviyesindeki ürünler hangileri?" },
  { label: "Servis talepleri", query: "Açık servis taleplerinin durumu nedir?" },
];

export default function AIReportChat({ searchParams }: AIReportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Merhaba! 👋 Ben Gemini AI asistanınızım. Raporlarınızla ilgili doğal dilde sorular sorabilirsiniz. Örneğin: "Bu ayın satış toplamı nedir?" veya "En çok satan ürünleri göster".',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [copiedSql, setCopiedSql] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAPIConnection();
  }, []);

  const checkAPIConnection = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:108',message:'checkAPIConnection entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    setApiStatus('checking');
    try {
      // Use checkGeminiStatus instead of generateSQLQuery for better error detection
      const { checkGeminiStatus } = await import('@/services/geminiService');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:112',message:'calling checkGeminiStatus',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      const statusResult = await checkGeminiStatus();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:113',message:'statusResult received',data:{configured:statusResult.configured,message:statusResult.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      // #endregion
      if (statusResult.configured) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:116',message:'connection successful',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        setApiStatus('connected');
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:114',message:'API error detected',data:{message:statusResult.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        setApiStatus('error');
      }
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:118',message:'exception in checkAPIConnection',data:{errorMessage:err.message,errorType:err.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
      // #endregion
      setApiStatus('error');
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages]);

  const executeSQL = async (sql: string) => {
    try {
      // execute_readonly_query function automatically adds company_id filter
      const { data, error } = await supabase.rpc('execute_readonly_query', {
        query_text: sql
      });
      
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      logger.error('SQL execution error:', err);
      throw new Error(err.message || 'SQL sorgusu çalıştırılamadı');
    }
  };

  const handleSendMessage = async (query?: string) => {
    const messageText = query || inputValue.trim();
    if (!messageText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add placeholder AI message for streaming effect
    const aiMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      const context = {
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        currency: searchParams.get('currency') || 'TRY',
      };

      // Use Gemini to generate SQL
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:180',message:'handleSendMessage calling generateSQLQuery',data:{messageText,tableName:'opportunities'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'N'})}).catch(()=>{});
      // #endregion
      const sqlResult = await generateSQLQuery(messageText, 'opportunities');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:182',message:'sqlResult received in handleSendMessage',data:{hasError:!!sqlResult.error,errorMessage:sqlResult.error||'none',hasSql:!!sqlResult.sql},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      
      if (sqlResult.error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/540e240f-d0a0-4970-8617-130dc8f4fe56',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIReportChat.tsx:183',message:'throwing error from sqlResult',data:{errorMessage:sqlResult.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'P'})}).catch(()=>{});
        // #endregion
        throw new Error(sqlResult.error);
      }

      if (!sqlResult.sql) {
        throw new Error('SQL sorgusu oluşturulamadı');
      }

      // Execute SQL
      const queryData = await executeSQL(sqlResult.sql);

      // Get explanation from Gemini
      const chatMessages = [
        {
          role: 'system' as const,
          content: 'Sen bir veri analiz asistanısın. SQL sorgusu sonuçlarını açık ve anlaşılır şekilde açıkla.'
        },
        {
          role: 'user' as const,
          content: `Soru: ${messageText}\n\nSQL: ${sqlResult.sql}\n\nSonuç: ${JSON.stringify(queryData.slice(0, 5))}\n\nBu sonuçları Türkçe olarak açıkla.`
        }
      ];

      const explanationResult = await chatWithAI(chatMessages);
      const explanation = explanationResult.content || 'Sorgu başarıyla çalıştırıldı.';

      // Determine chart type based on data
      let chartType: 'table' | 'bar' | 'line' | 'pie' | 'area' = 'table';
      if (queryData.length > 0) {
        const columns = Object.keys(queryData[0]);
        const numericColumns = columns.filter(col => 
          typeof queryData[0][col] === 'number'
        );
        
        if (numericColumns.length >= 2) {
          chartType = 'bar';
        } else if (queryData.length > 10) {
          chartType = 'line';
        }
      }

      // Update the AI message with results
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? {
          ...msg,
          content: explanation,
          sql: sqlResult.sql,
          data: queryData,
          chartType,
          chartConfig: {
            xKey: Object.keys(queryData[0] || {})[0],
            yKey: Object.keys(queryData[0] || {}).find(k => typeof queryData[0]?.[k] === 'number')
          },
          isStreaming: false
        } : msg
      ));

    } catch (error: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? {
          ...msg,
          content: `Üzgünüm, bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
          error: error.message,
          isStreaming: false
        } : msg
      ));
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(sql);
    setTimeout(() => setCopiedSql(null), 2000);
    toast.success('SQL kopyalandı!');
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: 'Merhaba! 👋 Ben Gemini AI asistanınızım. Raporlarınızla ilgili doğal dilde sorular sorabilirsiniz.',
      timestamp: new Date()
    }]);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatValue = (value: any, key: string): string => {
    if (typeof value === 'number') {
      if (key.includes('amount') || key.includes('total') || key.includes('revenue') || key.includes('value') || key.includes('price')) {
        return `₺${value.toLocaleString('tr-TR')}`;
      }
      if (key.includes('percent') || key.includes('rate') || key.includes('margin')) {
        return `%${value.toFixed(1)}`;
      }
      return value.toLocaleString('tr-TR');
    }
    return String(value ?? '-');
  };

  const renderChart = (message: ChatMessage) => {
    if (!message.data || message.data.length === 0) return null;

    const columns = Object.keys(message.data[0]);
    const xKey = message.chartConfig?.xKey || columns[0];
    const yKey = message.chartConfig?.yKey || columns.find(c => typeof message.data![0][c] === 'number') || columns[1];

    switch (message.chartType) {
      case 'bar':
        return (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={message.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey={yKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line':
        return (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLine data={message.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey={yKey} stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </RechartsLine>
            </ResponsiveContainer>
          </div>
        );

      case 'pie':
        return (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={message.data.slice(0, 6)}
                  dataKey={yKey}
                  nameKey={xKey}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {message.data.slice(0, 6).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        );

      case 'area':
        return (
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={message.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey={yKey} stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'table':
      default:
        return (
          <div className="mt-3 border border-border/50 rounded-lg overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-3 py-2.5 text-left font-medium text-muted-foreground capitalize text-xs">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {message.data.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="border-t border-border/30 hover:bg-muted/30 transition-colors">
                      {columns.map(col => (
                        <td key={col} className="px-3 py-2 text-foreground text-xs">
                          {formatValue(row[col], col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {message.data.length > 10 && (
              <div className="px-3 py-2 bg-muted/30 text-xs text-muted-foreground text-center">
                +{message.data.length - 10} daha fazla kayıt
              </div>
            )}
          </div>
        );
    }
  };

  const getChartIcon = (type?: string) => {
    switch (type) {
      case 'bar': return <BarChart3 className="h-3.5 w-3.5" />;
      case 'line': return <LineChart className="h-3.5 w-3.5" />;
      case 'pie': return <PieChart className="h-3.5 w-3.5" />;
      case 'area': return <TrendingUp className="h-3.5 w-3.5" />;
      default: return <Table className="h-3.5 w-3.5" />;
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 border-b border-border/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-500/30">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-semibold flex items-center gap-2">
                Gemini AI Asistanı
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-violet-500/10 text-violet-600 border-violet-500/20">
                  <Zap className="h-2.5 w-2.5 mr-1" />
                  Gemini 2.5 Flash
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Doğal dilde sorular sorun, anında analiz alın</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-2 py-1",
                apiStatus === 'connected' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                apiStatus === 'error' && 'bg-rose-500/10 text-rose-600 border-rose-500/20',
                apiStatus === 'checking' && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              )}
            >
              {apiStatus === 'checking' ? (
                <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Bağlanıyor</>
              ) : apiStatus === 'connected' ? (
                <><div className="h-2 w-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse" />Aktif</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" />Bağlantı Hatası</>
              )}
            </Badge>
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="h-7 w-7 p-0"
                title="Sohbeti Temizle"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick Query Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUERIES.map((q, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => handleSendMessage(q.query)}
              disabled={isLoading || apiStatus !== 'connected'}
              className="h-7 text-xs gap-1.5 hover:bg-violet-500/10 hover:text-violet-600 hover:border-violet-500/30 transition-all"
            >
              <Lightbulb className="h-3 w-3" />
              {q.label}
            </Button>
          ))}
        </div>
      </div>

      <CardContent className="p-0 flex flex-col h-[500px]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 group",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'ai' && (
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/20">
                      <Bot className="h-4.5 w-4.5 text-white" />
                    </div>
                  </div>
                )}

                <div className={cn("max-w-[80%] flex flex-col", message.type === 'user' && 'items-end')}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm transition-all",
                      message.type === 'user'
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                        : 'bg-muted/60 text-foreground border border-border/40 backdrop-blur-sm'
                    )}
                  >
                    {message.isStreaming ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Gemini analiz ediyor...</span>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    )}
                  </div>

                  {/* SQL Query Display */}
                  {message.sql && !message.isStreaming && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-border/40 bg-card shadow-sm w-full">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/30">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-violet-500/10 rounded">
                            <Database className="h-3 w-3 text-violet-600" />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">SQL Sorgusu</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copySQL(message.sql!)}
                          className="h-6 px-2 text-xs hover:bg-violet-500/10"
                        >
                          {copiedSql === message.sql ? (
                            <><Check className="h-3 w-3 mr-1" />Kopyalandı</>
                          ) : (
                            <><Copy className="h-3 w-3 mr-1" />Kopyala</>
                          )}
                        </Button>
                      </div>
                      <pre className="p-3 bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto border-t border-zinc-800">
                        <code>{message.sql}</code>
                      </pre>
                    </div>
                  )}

                  {/* Chart Type Badge */}
                  {message.data && message.data.length > 0 && !message.isStreaming && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs gap-1.5 px-2 py-0.5">
                        {getChartIcon(message.chartType)}
                        <span>{message.data.length} kayıt</span>
                      </Badge>
                    </div>
                  )}

                  {/* Data Visualization */}
                  {!message.isStreaming && renderChart(message)}

                  <div className="mt-1.5 text-[10px] text-muted-foreground px-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md ring-2 ring-primary/20">
                      <User className="h-4.5 w-4.5 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/30 p-4 bg-gradient-to-t from-muted/40 to-transparent">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Raporlarınız hakkında soru sorun... (örn: 'Bu ayın satış toplamı nedir?')"
                disabled={isLoading || apiStatus !== 'connected'}
                className="pr-10 bg-background/80 border-border/50 focus:border-violet-500/50 focus:ring-violet-500/20"
              />
              {inputValue && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputValue('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim() || apiStatus !== 'connected'}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:shadow-none h-10 px-4"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {apiStatus === 'error' && (
            <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Gemini API bağlantısı kurulamadı. Lütfen ayarları kontrol edin.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
