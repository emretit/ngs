import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

interface MonthlyExpensesWidgetProps {
  value: number;
  isLoading?: boolean;
}

const MonthlyExpensesWidget = ({ value, isLoading }: MonthlyExpensesWidgetProps) => {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-orange-400 rounded w-24 mb-2"></div>
            <div className="h-8 bg-orange-400 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-100 mb-1">Aylık Masraflar</p>
            <p className="text-3xl font-bold">
              ₺{value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3 bg-white/20 rounded-lg">
            <TrendingDown className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyExpensesWidget;

