import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { LeaveSummaryStats } from "./types";

interface LeaveSummaryCardsProps {
  stats: LeaveSummaryStats;
  isLoading?: boolean;
}

export const LeaveSummaryCards = ({ stats, isLoading = false }: LeaveSummaryCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-l-4 border-l-gray-300">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Bugün İzinde */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            Bugün İzinde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {stats.todayOnLeave}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Çalışan bugün izinde
          </div>
        </CardContent>
      </Card>

      {/* Onay Bekleyen */}
      <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Onay Bekleyen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.pendingApprovals}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Bekleyen onay talebi
          </div>
        </CardContent>
      </Card>

      {/* Yaklaşan (7 gün) */}
      <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-purple-500" />
            Yaklaşan (7 gün)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {stats.upcoming7Days}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Önümüzdeki 7 gün içinde
          </div>
        </CardContent>
      </Card>

      {/* Bu Ay Toplam Talep */}
      <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Bu Ay Toplam Talep
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.thisMonthTotal}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Bu ay oluşturulan talep
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

