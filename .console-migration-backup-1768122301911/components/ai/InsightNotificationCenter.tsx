import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  X,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  getInsights,
  dismissInsight,
  markInsightAsRead,
  type Insight
} from '@/services/insightGenerationService';

interface InsightNotificationCenterProps {
  companyId: string;
}

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
  opportunity: Lightbulb
};

const severityColors = {
  info: 'text-blue-600',
  warning: 'text-orange-600',
  critical: 'text-red-600',
  opportunity: 'text-green-600'
};

export function InsightNotificationCenter({ companyId }: InsightNotificationCenterProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadInsights();

    // Poll for new insights every 5 minutes
    const interval = setInterval(loadInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [companyId]);

  const loadInsights = async () => {
    try {
      const data = await getInsights(companyId, { dismissed: false });

      // Sort by severity and created date
      const sorted = data.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, opportunity: 2, info: 3 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Take top 10 most recent
      setInsights(sorted.slice(0, 10));
      setUnreadCount(sorted.filter(i => !i.is_read).length);
    } catch (err) {
      console.error('Error loading insights:', err);
    }
  };

  const handleInsightClick = async (insight: Insight) => {
    if (!insight.is_read) {
      await markInsightAsRead(insight.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setInsights(insights.map(i =>
        i.id === insight.id ? { ...i, is_read: true } : i
      ));
    }

    setOpen(false);

    if (insight.action_url) {
      navigate(insight.action_url);
    }
  };

  const handleDismiss = async (insightId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    await dismissInsight(insightId);
    const dismissed = insights.find(i => i.id === insightId);
    if (dismissed && !dismissed.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setInsights(insights.filter(i => i.id !== insightId));
  };

  const handleMarkAllRead = async () => {
    await Promise.all(
      insights
        .filter(i => !i.is_read)
        .map(i => markInsightAsRead(i.id))
    );
    setInsights(insights.map(i => ({ ...i, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">AI İçgörüleri</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} okunmamış içgörü
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              Tümünü okundu işaretle
            </Button>
          )}
        </div>

        {/* Insights List */}
        <ScrollArea className="h-[400px]">
          {insights.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p className="text-sm font-medium">Yeni içgörü yok</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tüm içgörüler işlendi
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {insights.map((insight) => {
                const Icon = severityIcons[insight.severity] || Info;
                const colorClass = severityColors[insight.severity] || 'text-blue-600';

                return (
                  <div
                    key={insight.id}
                    className={cn(
                      'p-4 hover:bg-gray-50 cursor-pointer transition-colors relative',
                      !insight.is_read && 'bg-blue-50/50'
                    )}
                    onClick={() => handleInsightClick(insight)}
                  >
                    {/* Unread Indicator */}
                    {!insight.is_read && (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                    )}

                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5', colorClass)}>
                        {Icon && <Icon className="h-5 w-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-tight">
                            {insight.title}
                          </p>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => handleDismiss(insight.id, e)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {insight.description}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {insight.severity === 'critical' && '🔴 Kritik'}
                            {insight.severity === 'warning' && '🟠 Uyarı'}
                            {insight.severity === 'opportunity' && '🟢 Fırsat'}
                            {insight.severity === 'info' && 'ℹ️ Bilgi'}
                          </Badge>

                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(insight.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {insights.length > 0 && (
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setOpen(false);
                navigate('/ai-insights');
              }}
            >
              Tüm İçgörüleri Görüntüle
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Şimdi';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;

  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
