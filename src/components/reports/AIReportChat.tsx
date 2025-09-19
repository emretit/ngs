import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateSQLFromQuery, executeSQLQuery, testGroqConnection, testDatabaseTables } from "@/services/groqService";
import { GroqUsageTracker } from "@/services/groqUsageTracker";
import GroqUsageMonitor from "./GroqUsageMonitor";
import {
  Send,
  Bot,
  User,
  Loader2,
  Database,
  BarChart3,
  MessageSquare,
  Sparkles,
  Copy,
  Download,
  AlertTriangle,
  BarChart
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

interface AIReportChatProps {
  searchParams: URLSearchParams;
}

export default function AIReportChat({ searchParams }: AIReportChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Merhaba! Size raporlarınızla ilgili nasıl yardımcı olabilirim? Örneğin: "Bu ayın satış toplamı", "En çok satan ürünler", "Müşteri bazında gelir analizi" gibi sorular sorabilirsiniz.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [showUsageMonitor, setShowUsageMonitor] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const usageTracker = GroqUsageTracker.getInstance();

  // Check Groq API connection on mount
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
        content: '⚠️ Groq API bağlantısı kurulamadı. .env dosyanızda VITE_GROQ_API_KEY ayarlandığından emin olun. Şimdilik demo mod aktif.',
        timestamp: new Date(),
        error: 'API_CONNECTION_ERROR'
      }]);
    }
  };

  const testTables = async () => {
    setIsLoading(true);
    try {
      const availableTables = await testDatabaseTables();
      const tableMessage = {
        id: Date.now().toString(),
        type: 'ai' as const,
        content: `Mevcut tablolar test edildi:\n\n✅ Kullanılabilir tablolar:\n${availableTables.map(t => `- ${t}`).join('\n')}\n\nBu tablolar üzerinde sorgular yapabilirsiniz.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, tableMessage]);
    } catch (error) {
      console.error('Table test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto scroll to bottom when new messages are added
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

    // Check usage limits before processing
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
      // Use real Groq API if connected, otherwise fallback to demo
      if (apiStatus === 'connected') {
        // Track the request
        usageTracker.trackRequest();
        const result = await generateSQLFromQuery(query);

        if (result.error) {
          throw new Error(result.error);
        }

        // Execute SQL and get data
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
        // Fallback to demo processing
        const aiResponse = processUserQuery(query);
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

  const processUserQuery = (query: string): ChatMessage => {
    // Mock AI processing - konuşma dilinden SQL'e çevirme simülasyonu
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('satış') || lowerQuery.includes('gelir')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Satış verilerinizi analiz ettim. İşte bu ayın satış raporu:',
        timestamp: new Date(),
        sql: `SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(total_amount) as total_sales,
  COUNT(*) as order_count
FROM proposals
WHERE status = 'accepted'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY month
ORDER BY month DESC;`,
        data: [
          { month: '2025-09', total_sales: 450000, order_count: 23 },
          { month: '2025-08', total_sales: 380000, order_count: 19 }
        ],
        chartType: 'bar'
      };
    } else if (lowerQuery.includes('ürün') || lowerQuery.includes('product')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'En çok satan ürünlerinizin listesini hazırladım:',
        timestamp: new Date(),
        sql: `SELECT
  p.name,
  SUM(pi.quantity) as total_sold,
  SUM(pi.total_price) as total_revenue
FROM products p
JOIN proposal_items pi ON p.id = pi.product_id
JOIN proposals pr ON pi.proposal_id = pr.id
WHERE pr.status = 'accepted'
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;`,
        data: [
          { name: 'Laptop Dell XPS', total_sold: 45, total_revenue: 135000 },
          { name: 'Yazıcı HP LaserJet', total_sold: 32, total_revenue: 48000 }
        ],
        chartType: 'table'
      };
    } else if (lowerQuery.includes('müşteri') || lowerQuery.includes('customer')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Müşteri bazında gelir analizinizi hazırladım:',
        timestamp: new Date(),
        sql: `SELECT
  c.name as customer_name,
  COUNT(p.id) as proposal_count,
  SUM(p.total_amount) as total_revenue,
  AVG(p.total_amount) as avg_order_value
FROM customers c
JOIN proposals p ON c.id = p.customer_id
WHERE p.status = 'accepted'
GROUP BY c.id, c.name
ORDER BY total_revenue DESC
LIMIT 15;`,
        data: [
          { customer_name: 'ABC Teknoloji', proposal_count: 8, total_revenue: 95000, avg_order_value: 11875 },
          { customer_name: 'XYZ Ltd.', proposal_count: 5, total_revenue: 72000, avg_order_value: 14400 }
        ],
        chartType: 'pie'
      };
    } else {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Üzgünüm, bu soruyu tam olarak anlayamadım. Lütfen şu türde sorular sorun:\n\n• "Bu ayın satış toplamı nedir?"\n• "En çok satan ürünler hangileri?"\n• "Müşteri bazında gelir analizi"\n• "Geçen ayın kar marjı"\n• "Açık siparişlerin durumu"',
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
        <div className="mt-3 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(col => (
                  <th key={col} className="px-3 py-2 text-left font-medium text-gray-700 capitalize">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {message.data.map((row, idx) => (
                <tr key={idx} className="border-t">
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 text-gray-900">
                      {typeof row[col] === 'number' && col.includes('revenue') || col.includes('sales') || col.includes('total') ?
                        `₺${row[col].toLocaleString()}` :
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

    // Diğer chart türleri için placeholder
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

  return (
    <div className="space-y-4">
      {/* Usage Monitor */}
      <GroqUsageMonitor
        isVisible={showUsageMonitor}
        onToggle={() => setShowUsageMonitor(false)}
      />

      {/* Main Chat Card */}
      <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">AI Rapor Asistanı</CardTitle>
              <p className="text-sm text-muted-foreground">Konuşma dilinizle rapor oluşturun</p>
            </div>
          </div>
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
                Kontrol Ediliyor
              </>
            ) : apiStatus === 'connected' ? (
              <>
                <Database className="h-3 w-3 mr-1" />
                Groq AI Aktif
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 mr-1" />
                Demo Mod
              </>
            )}
          </Badge>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testTables}
              disabled={isLoading}
              title="Veritabanı Tablolarını Test Et"
            >
              <Database className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUsageMonitor(!showUsageMonitor)}
              title="Kullanım İstatistikleri"
            >
              <BarChart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-6 min-h-0" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
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
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* SQL Query Display */}
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

                  {/* Data Visualization */}
                  {renderDataVisualization(message)}

                  <div className="mt-1 text-xs text-gray-500">
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

            {/* Loading State */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">AI raporu hazırlıyor...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Rapor sorgunuzu yazın... (örn: 'Bu ayın satış toplamı nedir?')"
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

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('Bu ayın satış toplamı nedir?')}
              disabled={isLoading}
              className="text-xs"
            >
              💰 Satış Toplamı
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('En çok satan ürünler hangileri?')}
              disabled={isLoading}
              className="text-xs"
            >
              📦 En Çok Satan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue('Müşteri bazında gelir analizi')}
              disabled={isLoading}
              className="text-xs"
            >
              👥 Müşteri Analizi
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}