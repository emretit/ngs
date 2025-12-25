import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TotalReceivablesWidgetProps {
  totalReceivables: number | undefined;
  isLoading: boolean;
}

const TotalReceivablesWidget = ({ totalReceivables, isLoading }: TotalReceivablesWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Toplam Alacaklar</CardTitle>
        <Receipt className="h-4 w-4 text-amber-600" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold text-amber-600">
            ₺{(totalReceivables || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Ödenmemiş satış faturaları
        </p>
      </CardContent>
    </Card>
  );
};

export default TotalReceivablesWidget;

