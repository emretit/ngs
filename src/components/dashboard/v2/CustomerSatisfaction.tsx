import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Star,
  MessageSquare,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Smile,
  Frown,
  Meh
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CustomerSatisfactionProps {
  data?: {
    npsScore: number; // -100 to 100
    averageRating: number; // 1 to 5
    totalRatings: number;
    totalComplaints: number;
    averageResponseTime: number; // minutes
    ratingDistribution: {
      rating: number;
      count: number;
      percentage: number;
    }[];
    recentComplaints: Array<{
      id: string;
      customer: string;
      issue: string;
      date: string;
      status: 'open' | 'resolved' | 'pending';
    }>;
  };
  isLoading?: boolean;
}

const getNPSLabel = (score: number) => {
  if (score >= 50) return { label: 'Mükemmel', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
  if (score >= 0) return { label: 'İyi', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' };
  if (score >= -50) return { label: 'Orta', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' };
  return { label: 'Kötü', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' };
};

const getRatingColor = (rating: number) => {
  if (rating >= 4.5) return 'text-emerald-600';
  if (rating >= 3.5) return 'text-blue-600';
  if (rating >= 2.5) return 'text-amber-600';
  return 'text-red-600';
};

export const CustomerSatisfaction = memo(({ data, isLoading }: CustomerSatisfactionProps) => {
  const navigate = useNavigate();

  // Mock data
  const mockData = data || {
    npsScore: 42,
    averageRating: 4.3,
    totalRatings: 156,
    totalComplaints: 8,
    averageResponseTime: 45,
    ratingDistribution: [
      { rating: 5, count: 85, percentage: 54.5 },
      { rating: 4, count: 45, percentage: 28.8 },
      { rating: 3, count: 18, percentage: 11.5 },
      { rating: 2, count: 5, percentage: 3.2 },
      { rating: 1, count: 3, percentage: 1.9 }
    ],
    recentComplaints: [
      {
        id: '1',
        customer: 'ABC Teknoloji A.Ş.',
        issue: 'Teslimat gecikmesi',
        date: '2024-01-10',
        status: 'resolved' as const
      },
      {
        id: '2',
        customer: 'XYZ Holding',
        issue: 'Ürün kalitesi',
        date: '2024-01-12',
        status: 'open' as const
      },
      {
        id: '3',
        customer: 'DEF İnşaat',
        issue: 'Fiyat uyumsuzluğu',
        date: '2024-01-13',
        status: 'pending' as const
      }
    ]
  };

  const { npsScore, averageRating, totalRatings, totalComplaints, averageResponseTime, ratingDistribution, recentComplaints } = mockData;
  const npsInfo = getNPSLabel(npsScore);
  const promoters = ratingDistribution.find(r => r.rating >= 4)?.count || 0;
  const detractors = ratingDistribution.find(r => r.rating <= 2)?.count || 0;
  const openComplaints = recentComplaints.filter(c => c.status === 'open').length;

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/50 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
              <Star className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Müşteri Memnuniyeti</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                NPS skoru, değerlendirmeler ve şikayetler
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className={cn("p-2.5 rounded-lg border", npsInfo.bg, "border-amber-200 dark:border-amber-800")}>
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="h-3 w-3 text-amber-600" />
              <p className="text-[9px] uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
                NPS
              </p>
            </div>
            <p className="text-lg font-bold text-foreground">{npsScore}</p>
            <p className="text-[9px] text-muted-foreground">{npsInfo.label}</p>
          </div>

          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="h-3 w-3 text-blue-600" />
              <p className="text-[9px] uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">
                Ortalama
              </p>
            </div>
            <p className={cn("text-lg font-bold", getRatingColor(averageRating))}>
              {averageRating.toFixed(1)}
            </p>
            <p className="text-[9px] text-blue-600/70 dark:text-blue-400/70">
              {totalRatings} değerlendirme
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <p className="text-[9px] uppercase tracking-wide text-red-600 dark:text-red-400 font-semibold">
                Şikayet
              </p>
            </div>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{totalComplaints}</p>
            <p className="text-[9px] text-red-600/70 dark:text-red-400/70">
              {openComplaints} açık
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="h-3 w-3 text-indigo-600" />
              <p className="text-[9px] uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold">
                Yanıt
              </p>
            </div>
            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{averageResponseTime}dk</p>
            <p className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70">
              Ortalama
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* NPS Score Visualization */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">NPS Skoru</h4>
              <Badge className={cn("h-5 px-2 text-[10px]", npsInfo.bg, npsInfo.color)}>
                {npsInfo.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Smile className="h-3.5 w-3.5 text-emerald-600" />
                <span>Promoter: {promoters}</span>
              </div>
              <div className="flex items-center gap-1">
                <Frown className="h-3.5 w-3.5 text-red-600" />
                <span>Detractor: {detractors}</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Progress 
              value={npsScore + 100} 
              className="h-8"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">{npsScore}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>-100</span>
            <span>0</span>
            <span>+100</span>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-foreground mb-3">Değerlendirme Dağılımı</h4>
          <div className="space-y-2">
            {ratingDistribution.map((dist) => (
              <div key={dist.rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-16">
                  <Star className={cn(
                    "h-4 w-4",
                    dist.rating >= 4 ? "text-emerald-600 fill-emerald-600" :
                    dist.rating >= 3 ? "text-blue-600 fill-blue-600" :
                    dist.rating >= 2 ? "text-amber-600 fill-amber-600" :
                    "text-red-600 fill-red-600"
                  )} />
                  <span className="text-xs font-semibold text-foreground">{dist.rating}</span>
                </div>
                <div className="flex-1">
                  <Progress 
                    value={dist.percentage} 
                    className={cn(
                      "h-3",
                      dist.rating >= 4 && "[&>div]:bg-emerald-500",
                      dist.rating === 3 && "[&>div]:bg-blue-500",
                      dist.rating === 2 && "[&>div]:bg-amber-500",
                      dist.rating === 1 && "[&>div]:bg-red-500"
                    )}
                  />
                </div>
                <div className="text-right w-20">
                  <span className="text-xs font-semibold text-foreground">{dist.count}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    ({dist.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">Son Şikayetler</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customers/complaints')}
              className="gap-1.5 h-7 text-xs"
            >
              Tümü
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentComplaints.length > 0 ? (
              recentComplaints.slice(0, 3).map((complaint) => {
                const statusConfig = {
                  open: { label: 'Açık', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', icon: AlertTriangle },
                  resolved: { label: 'Çözüldü', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', icon: Star },
                  pending: { label: 'Bekliyor', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', icon: Clock }
                };
                const status = statusConfig[complaint.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={complaint.id}
                    onClick={() => navigate(`/customers/complaints?id=${complaint.id}`)}
                    className="group p-2.5 rounded-lg border border-border hover:border-primary/30 transition-all duration-200 cursor-pointer hover:shadow-sm bg-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {complaint.customer}
                          </p>
                          <Badge className={cn("h-4 px-1.5 text-[9px]", status.color)}>
                            <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {complaint.issue}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center border border-border/50 rounded-lg bg-muted/30">
                <MessageSquare className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Şikayet bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {openComplaints > 0 && (
              <span className="text-red-600 font-semibold">{openComplaints} açık şikayet var!</span>
            )}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customers/satisfaction')}
            className="gap-1.5 h-7 text-xs"
          >
            Detaylı Rapor
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

CustomerSatisfaction.displayName = "CustomerSatisfaction";

