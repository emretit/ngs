import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TodaySalesWidgetProps {
  value: number;
  isLoading: boolean;
}

export const TodaySalesWidget = ({ value, isLoading }: TodaySalesWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Bugünkü Satış</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold">
            ₺{value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Bugün onaylanan satış faturaları toplamı
        </p>
      </CardContent>
    </Card>
  );
};

