import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MonthlyTurnoverWidgetProps {
  value: number;
  isLoading?: boolean;
}

const MonthlyTurnoverWidget = ({ value, isLoading }: MonthlyTurnoverWidgetProps) => {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-blue-400 rounded w-24 mb-2"></div>
            <div className="h-8 bg-blue-400 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100 mb-1">Aylık Ciro</p>
            <p className="text-3xl font-bold">
              ₺{value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-lg">
            <TrendingUp className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyTurnoverWidget;

