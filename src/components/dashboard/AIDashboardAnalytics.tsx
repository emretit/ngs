import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateSQLFromQuery, executeSQLQuery, testGroqConnection } from "@/services/groqService";
import { GroqUsageTracker } from "@/services/groqUsageTracker";
import {
  Send,
  Bot,
  User,
  Loader2,
  Database,
  BarChart3,
  Sparkles,
  Copy,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users as UsersIcon
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sql?: string;
  data?: any[];
  error?: string;
  chartType?: 'table' | 'bar' | 'line' | 'pie';
}

export default function AIDashboardAnalytics() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 Merhaba! Dashboard verilerinizle ilgili nasıl yardımcı olabilirim?\n\nŞunları sorabilirsiniz:\n• "Bu ayın gelir özeti"\n• "En karlı müşteriler"\n• "Bekleyen ödemeler"\n• "Aktif fırsatların durumu"\n• "Personel istatistikleri"',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const usageTracker = GroqUsageTracker.getInstance();

  useEffect(() => {
    checkAPIConnection();
  }, []);

  const checkAPIConnection = async () => {
    setApiStatus('checking');
    const isConnected = await testGroqConnection();
    setApiStatus(isConnected ? 'connected' : 'error');

    if (!isConnected) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: '⚠️ Groq API bağlantısı kurulamadı. .env dosyanızda VITE_GROQ_API_KEY ayarlandığından emin olun.',
        timestamp: new Date(),
        error: 'API_CONNECTION_ERROR'
      }]);
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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const canRequest = usageTracker.canMakeRequest();
    if (!canRequest.allowed) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `⚠️ ${canRequest.reason}`,
        timestamp: new Date(),
        error: 'RATE_LIMIT_EXCEEDED'
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      if (apiStatus === 'connected') {
        usageTracker.trackRequest();
        const result = await generateSQLFromQuery(query);

        if (result.error) {
          throw new Error(result.error);
        }

        const data = await executeSQLQuery(result.sql);

        const aiResponse: ChatMessage = {
          id: Date.now().toString(),
          type: 'ai',
          content: result.explanation || 'SQL sorgusu başarıyla oluşturuldu ve çalıştırıldı.',
          timestamp: new Date(),
          sql: result.sql,
          data: data,
          chartType: result.chartType || 'table'
        };

        setMessages(prev => [...prev, aiResponse]);
      } else {
        const aiResponse = processDashboardQuery(query);
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error: any) {
      const errorResponse: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `Üzgünüm, sorgunuzu işlerken bir hata oluştu: ${error.message}`,
        timestamp: new Date(),
        error: error.message
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const processDashboardQuery = (query: string): ChatMessage => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('gelir') || lowerQuery.includes('satış')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Bu ayın gelir özetini hazırladım:',
        timestamp: new Date(),
        sql: `SELECT 
  DATE_TRUNC('day', created_at) as date,
  SUM(total_amount) as daily_revenue
FROM proposals
WHERE status = 'accepted'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY date
ORDER BY date DESC;`,
        data: [
          { date: '2025-01-15', daily_revenue: 45000 },
          { date: '2025-01-14', daily_revenue: 38000 }
        ],
        chartType: 'bar'
      };
    } else if (lowerQuery.includes('müşteri') || lowerQuery.includes('customer')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'En karlı müşterilerinizi analiz ettim:',
        timestamp: new Date(),
        sql: `SELECT 
  c.name,
  SUM(p.total_amount) as total_revenue,
  COUNT(p.id) as proposal_count
FROM customers c
JOIN proposals p ON c.id = p.customer_id
WHERE p.status = 'accepted'
GROUP BY c.id, c.name
ORDER BY total_revenue DESC
LIMIT 5;`,
        data: [
          { name: 'ABC Teknoloji', total_revenue: 125000, proposal_count: 8 },
          { name: 'XYZ Ltd.', total_revenue: 98000, proposal_count: 5 }
        ],
        chartType: 'table'
      };
    } else if (lowerQuery.includes('personel') || lowerQuery.includes('çalışan') || lowerQuery.includes('employee')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Personel istatistiklerinizi hazırladım:',
        timestamp: new Date(),
        sql: `SELECT 
  department,
  COUNT(*) as employee_count,
  AVG(salary) as avg_salary
FROM employees
WHERE status = 'aktif'
GROUP BY department
ORDER BY employee_count DESC;`,
        data: [
          { department: 'Satış', employee_count: 12, avg_salary: 8500 },
          { department: 'Üretim', employee_count: 8, avg_salary: 7200 }
        ],
        chartType: 'table'
      };
    } else {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Lütfen şu türde sorular sorun:\n\n• "Bu ayın gelir özeti"\n• "En karlı müşteriler"\n• "Bekleyen ödemeler"\n• "Aktif fırsatların durumu"\n• "Personel istatistikleri"',
        timestamp: new Date()
      };
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
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDataVisualization = (message: ChatMessage) => {
    if (!message.data || message.data.length === 0) return null;

    if (message.chartType === 'table') {
      const columns = Object.keys(message.data[0]);
      return (
        <div className="mt-3 border rounded-lg overflow-hidden bg-white">
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
              {message.data.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 text-foreground">
                      {typeof row[col] === 'number' && (col.includes('revenue') || col.includes('sales') || col.includes('total') || col.includes('salary')) ?
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
    }

    return (
      <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-700">
          <BarChart3 className="h-4 w-4" />
          <span className="text-sm font-medium">Grafik Görünümü ({message.chartType})</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Veri başarıyla yüklendi. Grafik görünümü yakında eklenecek.
        </p>
      </div>
    );
  };

  // Quick action suggestions
  const quickSuggestions = [
    { icon: DollarSign, label: "Bu ayın geliri", query: "Bu ayın toplam geliri nedir?" },
    { icon: TrendingUp, label: "En karlı müşteriler", query: "En karlı 5 müşterim kimler?" },
    { icon: UsersIcon, label: "Personel özeti", query: "Departman bazında personel sayıları" }
  ];

  return (
    <Card className="shadow-md border border-gray-200 bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">AI Native Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">Doğal dilde veri analizi yapın</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={
                apiStatus === 'connected'
                  ? 'bg-green-100 text-green-700'
                  : apiStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }
            >
              {apiStatus === 'checking' ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Kontrol
                </>
              ) : apiStatus === 'connected' ? (
                <>
                  <Database className="h-3 w-3 mr-1" />
                  Aktif
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Demo
                </>
              )}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Küçült' : 'Genişlet'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Suggestions */}
        {!isExpanded && messages.length <= 2 && (
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputValue(suggestion.query);
                  setIsExpanded(true);
                }}
                className="flex items-center gap-2"
              >
                <suggestion.icon className="h-3 w-3" />
                {suggestion.label}
              </Button>
            ))}
          </div>
        )}

        {/* Chat Area */}
        {isExpanded && (
          <>
            <ScrollArea className="h-[400px] pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'ai' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : ''}`}>
                      <div
                        className={`rounded-lg px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.sql && (
                        <div className="mt-2 p-3 bg-gray-900 rounded-lg text-green-400 font-mono text-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400">Generated SQL:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySQL(message.sql!)}
                              className="h-6 px-2 text-gray-400 hover:text-white"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <pre className="overflow-x-auto">{message.sql}</pre>
                        </div>
                      )}

                      {renderDataVisualization(message)}

                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
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

            {/* Input Area */}
            <div className="flex gap-2 pt-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Soru sorun... (örn: 'Bu ayın toplam geliri nedir?')"
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
