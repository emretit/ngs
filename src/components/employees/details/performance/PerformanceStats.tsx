
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { PerformanceRecord } from "./types";

interface PerformanceStatsProps {
  latestScores: PerformanceRecord | null;
  performanceTrend: {
    trend: number;
    icon: string | null;
  };
}

export const PerformanceStats = ({ latestScores, performanceTrend }: PerformanceStatsProps) => {
  if (!latestScores) return null;

  const renderScoreCard = (title: string, score: number) => (
    <Card>
      <CardContent className="p-6">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className="flex items-baseline mt-2">
          <div className="text-3xl font-bold">{score.toFixed(1)}</div>
          <div className="ml-1 text-sm text-muted-foreground">/5</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {renderScoreCard("Teknik", latestScores.technical_score)}
      {renderScoreCard("İletişim", latestScores.communication_score)}
      {renderScoreCard("Takım Çalışması", latestScores.teamwork_score)}
      {renderScoreCard("Liderlik", latestScores.leadership_score)}
      
      <Card>
        <CardContent className="p-6">
          <div className="text-sm font-medium text-muted-foreground">Genel Puan</div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline">
              <div className="text-3xl font-bold">{latestScores.overall_score.toFixed(1)}</div>
              <div className="ml-1 text-sm text-muted-foreground">/5</div>
            </div>
            
            {performanceTrend.trend !== 0 && (
              <div className={`flex items-center ${performanceTrend.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {performanceTrend.icon === 'up' ? 
                  <ArrowUpIcon className="h-4 w-4 mr-1" /> : 
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                }
                <span className="text-sm font-medium">{Math.abs(performanceTrend.trend)}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
