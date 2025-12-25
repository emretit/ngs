import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface OpportunitiesValueWidgetProps {
  totalValue: number | undefined;
  count: number | undefined;
  isLoading: boolean;
}

const OpportunitiesValueWidget = ({ totalValue, count, isLoading }: OpportunitiesValueWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Satış Fırsatları</CardTitle>
        <Target className="h-4 w-4 text-purple-600" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold text-purple-600">
            ₺{(totalValue || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {count !== undefined ? `${count} aktif fırsat` : 'Yükleniyor...'}
        </p>
      </CardContent>
    </Card>
  );
};

export default OpportunitiesValueWidget;

