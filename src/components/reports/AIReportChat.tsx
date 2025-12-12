import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Send,
  Bot,
  User,
  Loader2,
  Database,
  BarChart3,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  TrendingUp,
  PieChart,
  LineChart,
  Table,
  Lightbulb,
  ChevronRight
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
      content: 'Merhaba! Size raporlarınızla ilgili nasıl yardımcı olabilirim? Doğal dilde sorular sorabilir veya hızlı sorgu önerilerini kullanabilirsiniz.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [copiedSql, setCopiedSql] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAPIConnection();
  }, []);

  const checkAPIConnection = async () => {
    setApiStatus('checking');
    try {
      const { data, error } = await supabase.functions.invoke('groq-chat', {
        body: { type: 'status' }
      });
      
      if (error || !data?.configured) {
        setApiStatus('error');
      } else {
        setApiStatus('connected');
      }
    } catch {
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

      const { data, error } = await supabase.functions.invoke('groq-chat', {
        body: { 
          type: 'report',
          query: messageText,
          context
        }
      });

      if (error) throw new Error(error.message);

      // Execute the SQL query if we got one
      let queryData: any[] = [];
      if (data?.sql) {
        try {
          const { data: sqlResult, error: sqlError } = await supabase.rpc('execute_readonly_query', {
            query_text: data.sql
          });
          
          if (!sqlError && sqlResult) {
            queryData = sqlResult;
          }
        } catch (sqlErr) {
          console.error('SQL execution error:', sqlErr);
        }
      }

      // Update the AI message with results
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? {
          ...msg,
          content: data?.explanation || 'Sorgunuz işlendi.',
          sql: data?.sql,
          data: queryData,
          chartType: data?.chartType || 'table',
          chartConfig: data?.chartConfig,
          isStreaming: false
        } : msg
      ));

    } catch (error: any) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? {
          ...msg,
          content: `Üzgünüm, bir hata oluştu: ${error.message}`,
          error: error.message,
          isStreaming: false
        } : msg
      ));
    } finally {
      setIsLoading(false);
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
          <div className="mt-3 border border-border/50 rounded-lg overflow-hidden">
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
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg text-white shadow-lg shadow-violet-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">AI Rapor Asistanı</CardTitle>
              <p className="text-xs text-muted-foreground">Doğal dilde soru sorun, anında rapor alın</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              apiStatus === 'connected' && 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
              apiStatus === 'error' && 'bg-rose-500/10 text-rose-600 border-rose-500/20',
              apiStatus === 'checking' && 'bg-amber-500/10 text-amber-600 border-amber-500/20'
            )}
          >
            {apiStatus === 'checking' ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Kontrol</>
            ) : apiStatus === 'connected' ? (
              <><Database className="h-3 w-3 mr-1" />Aktif</>
            ) : (
              <><AlertTriangle className="h-3 w-3 mr-1" />Hata</>
            )}
          </Badge>
        </div>

        {/* Quick Query Suggestions */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_QUERIES.map((q, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => handleSendMessage(q.query)}
              disabled={isLoading}
              className="h-7 text-xs gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
            >
              <Lightbulb className="h-3 w-3" />
              {q.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[450px]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.type === 'ai' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <div className={cn("max-w-[85%]", message.type === 'user' && 'order-2')}>
                  <div
                    className={cn(
                      "rounded-xl px-4 py-3",
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 text-foreground border border-border/30'
                    )}
                  >
                    {message.isStreaming ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Analiz ediliyor...</span>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>

                  {/* SQL Query Display */}
                  {message.sql && !message.isStreaming && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border/30">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/30">
                        <span className="text-xs text-muted-foreground font-medium">SQL Sorgusu</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copySQL(message.sql!)}
                          className="h-6 px-2 text-xs"
                        >
                          {copiedSql === message.sql ? (
                            <><Check className="h-3 w-3 mr-1" />Kopyalandı</>
                          ) : (
                            <><Copy className="h-3 w-3 mr-1" />Kopyala</>
                          )}
                        </Button>
                      </div>
                      <pre className="p-3 bg-zinc-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                        {message.sql}
                      </pre>
                    </div>
                  )}

                  {/* Chart Type Badge */}
                  {message.data && message.data.length > 0 && !message.isStreaming && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs gap-1">
                        {getChartIcon(message.chartType)}
                        {message.data.length} kayıt
                      </Badge>
                    </div>
                  )}

                  {/* Data Visualization */}
                  {!message.isStreaming && renderChart(message)}

                  <div className="mt-1.5 text-[10px] text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border/30 p-4 bg-muted/20">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Soru sorun... (örn: 'Bu ayın satış toplamı nedir?')"
              disabled={isLoading || apiStatus !== 'connected'}
              className="flex-1 bg-background/50"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim() || apiStatus !== 'connected'}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
