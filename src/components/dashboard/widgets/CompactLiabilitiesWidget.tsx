import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CompactLiabilitiesWidgetProps {
  totalLiabilities: number | undefined;
  isLoading: boolean;
}

const CompactLiabilitiesWidget = ({ totalLiabilities, isLoading }: CompactLiabilitiesWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Toplam Borçlar</CardTitle>
        <CreditCard className="h-4 w-4 text-red-600" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold text-red-600">
            ₺{(totalLiabilities || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Açık Hesap, Kredi Kartı, Krediler
        </p>
      </CardContent>
    </Card>
  );
};

export default CompactLiabilitiesWidget;

