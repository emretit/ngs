import { memo } from "react";
import { Bot, User, Database, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any[]; // Sorgu sonuçları
  chartType?: 'table' | 'bar' | 'line' | 'pie' | 'area';
  chartConfig?: {
    xKey?: string;
    yKey?: string;
    title?: string;
  };
  sql?: string; // SQL sorgusu (debug için)
}

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];


interface AIChatMessageProps {
  message: ChatMessage;
}

export const AIChatMessage = memo(({ message }: AIChatMessageProps) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2.5 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary/90 to-primary flex items-center justify-center shadow-sm">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl shadow-sm",
          isUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm px-3 py-2"
            : "bg-muted/80 backdrop-blur-sm border border-border/50 rounded-tl-sm"
        )}
      >
        {!isUser && message.data && message.data.length > 0 ? (
          <div className="space-y-3 p-3">
            {/* Text explanation */}
            {message.content && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-2">
                {message.content}
              </p>
            )}

            {/* Data visualization */}
            {message.chartType === 'table' && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {Object.keys(message.data[0]).filter(key => key !== 'company_id').map(key => (
                        <th key={key} className="px-2 py-1.5 text-left font-medium text-foreground/80">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {message.data.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/50">
                        {Object.entries(row)
                          .filter(([key]) => key !== 'company_id')
                          .map(([key, value], cellIdx) => (
                            <td key={cellIdx} className="px-2 py-1.5 text-foreground/90">
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {message.data.length > 10 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    ... ve {message.data.length - 10} satır daha
                  </p>
                )}
              </div>
            )}

            {message.chartType === 'bar' && message.chartConfig && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={message.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey={message.chartConfig.xKey} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey={message.chartConfig.yKey} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {message.chartType === 'line' && message.chartConfig && (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={message.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey={message.chartConfig.xKey} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey={message.chartConfig.yKey} stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {message.chartType === 'pie' && message.chartConfig && (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={message.data}
                    dataKey={message.chartConfig.yKey}
                    nameKey={message.chartConfig.xKey}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {message.data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* SQL debug info (collapsed by default) */}
            {message.sql && (
              <details className="text-[10px] mt-2 opacity-60">
                <summary className="cursor-pointer hover:opacity-100">SQL Sorgusu</summary>
                <pre className="mt-1 p-2 bg-background/50 rounded text-[9px] overflow-x-auto">
                  {message.sql}
                </pre>
              </details>
            )}
          </div>
        ) : (
          <div className="px-3 py-2">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        )}

        <p
          className={cn(
            "text-[9px] px-3 pb-2 opacity-70",
            isUser ? "text-right" : "text-left"
          )}
        >
          {message.timestamp.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
          <User className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </div>
  );
});

AIChatMessage.displayName = "AIChatMessage";
