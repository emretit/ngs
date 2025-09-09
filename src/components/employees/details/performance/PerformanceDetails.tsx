
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Star, Target } from "lucide-react";
import { PerformanceRecord } from "./types";

interface PerformanceDetailsProps {
  latestScores: PerformanceRecord | null;
}

export const PerformanceDetails = ({ latestScores }: PerformanceDetailsProps) => {
  if (!latestScores) return null;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            Güçlü Yönleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{latestScores.strengths || "Belirtilmemiş"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            Geliştirilmesi Gereken Alanlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{latestScores.areas_for_improvement || "Belirtilmemiş"}</p>
        </CardContent>
      </Card>
    </div>
  );
};
