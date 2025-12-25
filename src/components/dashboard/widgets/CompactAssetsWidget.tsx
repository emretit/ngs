import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CompactAssetsWidgetProps {
  totalAssets: number | undefined;
  isLoading: boolean;
}

const CompactAssetsWidget = ({ totalAssets, isLoading }: CompactAssetsWidgetProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Toplam Varlıklar</CardTitle>
        <Wallet className="h-4 w-4 text-emerald-600" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-3/4" />
        ) : (
          <div className="text-2xl font-bold text-emerald-600">
            ₺{(totalAssets || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Banka, Nakit, Alacaklar, Stok
        </p>
      </CardContent>
    </Card>
  );
};

export default CompactAssetsWidget;

