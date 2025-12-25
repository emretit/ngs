import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlySalesTrendWidgetProps {
  currentMonth: number | undefined;
  previousMonth: number | undefined;
  isLoading: boolean;
}

const MonthlySalesTrendWidget = ({ currentMonth, previousMonth, isLoading }: MonthlySalesTrendWidgetProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Aylık Satış Trendi</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const current = currentMonth || 0;
  const previous = previousMonth || 0;
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Aylık Satış Trendi</CardTitle>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          ₺{current.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-green-600" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-600" />
          )}
          <p className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(change).toFixed(1)}% {isPositive ? 'artış' : 'azalış'}
          </p>
          <span className="text-xs text-muted-foreground">önceki aya göre</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlySalesTrendWidget;

