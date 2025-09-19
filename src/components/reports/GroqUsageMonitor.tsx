import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { GroqUsageTracker, UsageStats } from "@/services/groqUsageTracker";

interface GroqUsageMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function GroqUsageMonitor({ isVisible, onToggle }: GroqUsageMonitorProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [percentages, setPercentages] = useState({ daily: 0, rateLimit: 0, monthly: 0 });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const tracker = GroqUsageTracker.getInstance();

  useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = () => {
    const currentStats = tracker.getUsageStats();
    const currentPercentages = tracker.getUsagePercentages();

    setStats(currentStats);
    setPercentages(currentPercentages);
    setLastRefresh(new Date());
  };

  const handleExport = () => {
    tracker.exportUsageData();
  };

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (!isVisible || !stats) return null;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-sm font-medium">Groq API Kullanım İstatistikleri</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              className="h-7 px-2"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-7 px-2"
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-7 px-2 text-xs"
            >
              Gizle
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Daily Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Günlük Kullanım</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${getStatusColor(percentages.daily)}`}>
                {stats.daily.used.toLocaleString()} / {stats.daily.limit.toLocaleString()}
              </span>
              <Badge
                variant="secondary"
                className={
                  percentages.daily < 80
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                %{percentages.daily}
              </Badge>
            </div>
          </div>
          <Progress
            value={percentages.daily}
            className="h-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{stats.daily.remaining.toLocaleString()} kalan</span>
            <span>Sıfırlama: {stats.daily.resetTime}</span>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Dakika Başına (Rate Limit)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${getStatusColor(percentages.rateLimit)}`}>
                {stats.rateLimit.current} / {stats.rateLimit.perMinute}
              </span>
              <Badge
                variant="secondary"
                className={
                  percentages.rateLimit < 80
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                %{percentages.rateLimit}
              </Badge>
            </div>
          </div>
          <Progress
            value={percentages.rateLimit}
            className="h-2"
          />
          <p className="text-xs text-gray-500">
            Son 1 dakikada yapılan istek sayısı
          </p>
        </div>

        {/* Monthly Estimate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Aylık Tahmini</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${getStatusColor(percentages.monthly)}`}>
                ~{stats.monthly.estimated.toLocaleString()} / 432K
              </span>
              <Badge
                variant="secondary"
                className={
                  percentages.monthly < 80
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                %{percentages.monthly}
              </Badge>
            </div>
          </div>
          <Progress
            value={percentages.monthly}
            className="h-2"
          />
          <p className="text-xs text-gray-500">
            Günlük ortalamaya göre aylık tahmin
          </p>
        </div>

        {/* Status Summary */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Son güncelleme: {lastRefresh.toLocaleTimeString('tr-TR')}</span>
          </div>
          <div className="flex items-center gap-1">
            {percentages.daily < 90 && percentages.rateLimit < 90 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Sağlıklı</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Dikkat</span>
              </>
            )}
          </div>
        </div>

        {/* Usage Tips */}
        {percentages.daily > 80 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">Günlük limit yaklaşıyor!</p>
                <p>Sorguları dikkatli kullanın. Limit aşılırsa Demo mod aktif olacak.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}