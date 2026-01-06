import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Info,
  AlertTriangle,
  Zap,
  X,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getInsights,
  dismissInsight,
  markInsightAsRead,
  logInsightInteraction,
  type Insight,
  type InsightCategory,
  type InsightSeverity
} from '@/services/insightGenerationService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface InsightFeedProps {
  companyId: string;
  limit?: number;
  showFilters?: boolean;
}

const severityConfig = {
  info: {
    icon: Info,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    badgeColor: 'bg-blue-100 text-blue-700'
  },
  warning: {
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    badgeColor: 'bg-orange-100 text-orange-700'
  },
  critical: {
    icon: AlertCircle,
    color: 'bg-red-100 text-red-700 border-red-300',
    badgeColor: 'bg-red-100 text-red-700'
  },
  opportunity: {
    icon: Lightbulb,
    color: 'bg-green-100 text-green-700 border-green-300',
    badgeColor: 'bg-green-100 text-green-700'
  }
};

const categoryLabels: Record<InsightCategory, string> = {
  sales: 'Satış',
  finance: 'Finans',
  inventory: 'Stok',
  hr: 'İK',
  operations: 'Operasyon',
  general: 'Genel'
};

export function InsightFeed({ companyId, limit, showFilters = true }: InsightFeedProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<InsightSeverity | 'all'>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadInsights();
  }, [companyId, categoryFilter, severityFilter]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const filters: any = { dismissed: false };
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (severityFilter !== 'all') filters.severity = severityFilter;

      let data = await getInsights(companyId, filters);

      // Sort by impact score and created date
      data = data.sort((a, b) => {
        if (a.impact_score !== b.impact_score) {
          return b.impact_score - a.impact_score;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      if (limit) {
        data = data.slice(0, limit);
      }

      setInsights(data);
    } catch (err) {
      console.error('Error loading insights:', err);
      toast({
        title: 'Hata',
        description: 'İçgörüler yüklenemedi.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (insightId: string) => {
    const success = await dismissInsight(insightId);
    if (success) {
      await logInsightInteraction(insightId, 'dismissed');
      setInsights(insights.filter(i => i.id !== insightId));
      toast({
        title: 'İçgörü kapatıldı',
        description: 'İçgörü listeden kaldırıldı.'
      });
    }
  };

  const handleViewInsight = async (insight: Insight) => {
    if (!insight.is_read) {
      await markInsightAsRead(insight.id);
      await logInsightInteraction(insight.id, 'viewed');
    }

    if (insight.action_url) {
      navigate(insight.action_url);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex gap-4">
          <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              <SelectItem value="sales">Satış</SelectItem>
              <SelectItem value="finance">Finans</SelectItem>
              <SelectItem value="inventory">Stok</SelectItem>
              <SelectItem value="hr">İK</SelectItem>
              <SelectItem value="operations">Operasyon</SelectItem>
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={(v: any) => setSeverityFilter(v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Öncelik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Öncelikler</SelectItem>
              <SelectItem value="critical">Kritik</SelectItem>
              <SelectItem value="warning">Uyarı</SelectItem>
              <SelectItem value="opportunity">Fırsat</SelectItem>
              <SelectItem value="info">Bilgi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Insights List */}
      {insights.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p className="text-lg font-medium">Harika! Şu an için yeni içgörü yok.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sistem sürekli verilerinizi analiz ediyor. Önemli bulgular olduğunda burada göreceksiniz.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className={limit ? `h-[${limit * 200}px]` : 'h-[600px]'}>
          <div className="space-y-4 pr-4">
            {insights.map((insight) => {
              const config = severityConfig[insight.severity];
              const Icon = config.icon;

              return (
                <Card
                  key={insight.id}
                  className={cn(
                    'transition-all hover:shadow-md cursor-pointer border-l-4',
                    !insight.is_read && 'bg-blue-50/30'
                  )}
                  style={{
                    borderLeftColor: config.color.includes('blue')
                      ? '#3b82f6'
                      : config.color.includes('orange')
                      ? '#f97316'
                      : config.color.includes('red')
                      ? '#ef4444'
                      : '#22c55e'
                  }}
                  onClick={() => handleViewInsight(insight)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn('p-2 rounded-lg', config.color)}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-base">{insight.title}</CardTitle>
                            {!insight.is_read && (
                              <Badge variant="secondary" className="text-xs">
                                Yeni
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={config.badgeColor}>
                              {insight.severity === 'info' && 'Bilgi'}
                              {insight.severity === 'warning' && 'Uyarı'}
                              {insight.severity === 'critical' && 'Kritik'}
                              {insight.severity === 'opportunity' && 'Fırsat'}
                            </Badge>
                            <Badge variant="outline">{categoryLabels[insight.category]}</Badge>
                            <Badge variant="outline" className="gap-1">
                              <Zap className="h-3 w-3" />
                              Etki: {insight.impact_score}/100
                            </Badge>
                          </div>

                          <CardDescription className="text-sm">
                            {insight.description}
                          </CardDescription>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(insight.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Recommendations */}
                    {insight.recommendations && insight.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Öneriler:</p>
                        <ul className="space-y-1">
                          {insight.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Data Summary */}
                    {insight.data_summary && Object.keys(insight.data_summary).length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium mb-2 text-muted-foreground">Veri Özeti</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(insight.data_summary)
                            .filter(([_, value]) => typeof value !== 'object')
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <div key={key}>
                                <p className="text-muted-foreground capitalize">
                                  {key.replace(/_/g, ' ')}
                                </p>
                                <p className="font-medium">{String(value)}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {insight.actionable && insight.action_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInsight(insight);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Detayları Görüntüle
                      </Button>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground text-right">
                      {new Date(insight.created_at).toLocaleString('tr-TR')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
