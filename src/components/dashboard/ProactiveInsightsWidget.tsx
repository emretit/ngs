import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { getInsights, type Insight } from '@/services/insightGenerationService';

interface ProactiveInsightsWidgetProps {
  companyId: string;
  maxInsights?: number;
}

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
  opportunity: Lightbulb
};

const severityColors = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
  opportunity: 'bg-green-100 text-green-700'
};

export function ProactiveInsightsWidget({ companyId, maxInsights = 3 }: ProactiveInsightsWidgetProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadInsights();
  }, [companyId]);

  const loadInsights = async () => {
    try {
      const data = await getInsights(companyId, { dismissed: false });

      // Prioritize critical and high-impact insights
      const sorted = data.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, opportunity: 2, info: 3 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        if (a.impact_score !== b.impact_score) {
          return b.impact_score - a.impact_score;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setInsights(sorted.slice(0, maxInsights));
    } catch (err) {
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInsightClick = (insight: Insight) => {
    if (insight.action_url) {
      navigate(insight.action_url);
    } else {
      navigate('/ai-insights');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI İçgörüleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI İçgörüleri
          </CardTitle>
          <CardDescription>Proaktif iş zekası ve öneriler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <p className="text-sm font-medium">Şu an için yeni içgörü yok</p>
            <p className="text-xs text-muted-foreground mt-1">
              AI sisteminizi sürekli analiz ediyor
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI İçgörüleri
            </CardTitle>
            <CardDescription>Top {insights.length} kritik bulgu</CardDescription>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/ai-insights')}
            className="gap-1"
          >
            Tümünü Gör
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {insights.map((insight) => {
          const Icon = severityIcons[insight.severity];
          const colorClass = severityColors[insight.severity];

          return (
            <div
              key={insight.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleInsightClick(insight)}
            >
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-lg flex-shrink-0', colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium leading-tight line-clamp-1">
                      {insight.title}
                    </p>

                    <Badge
                      variant="outline"
                      className={cn('text-xs flex-shrink-0', colorClass)}
                    >
                      {insight.impact_score}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {insight.description}
                  </p>

                  {/* Quick recommendations preview */}
                  {insight.recommendations && insight.recommendations.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3" />
                      {insight.recommendations[0]}
                    </div>
                  )}

                  {/* Category badge */}
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {insight.category === 'sales' && 'Satış'}
                      {insight.category === 'finance' && 'Finans'}
                      {insight.category === 'inventory' && 'Stok'}
                      {insight.category === 'hr' && 'İK'}
                      {insight.category === 'operations' && 'Operasyon'}
                      {insight.category === 'general' && 'Genel'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* View All Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => navigate('/ai-insights')}
        >
          Tüm İçgörüleri Görüntüle
        </Button>
      </CardContent>
    </Card>
  );
}
