import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Wallet, Building2, Receipt, Package } from "lucide-react";

interface AssetsWidgetProps {
  assets?: {
    bank: number;
    cash: number;
    receivables: number;
    checks: number;
    stock: number;
    total: number;
  };
  isLoading?: boolean;
}

const AssetsWidget = ({ assets, isLoading }: AssetsWidgetProps) => {
  if (isLoading || !assets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VARLIKLAR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(assets.bank, assets.cash, assets.receivables, assets.checks, assets.stock, 1);

  const assetItems = [
    { label: "Banka", value: assets.bank, icon: Building2, color: "bg-blue-500" },
    { label: "Nakit", value: assets.cash, icon: Wallet, color: "bg-green-500" },
    { label: "Açık Hesap (Alacaklar)", value: assets.receivables, icon: Receipt, color: "bg-emerald-500" },
    { label: "Çek", value: assets.checks, icon: Receipt, color: "bg-amber-500" },
    { label: "Stok", value: assets.stock, icon: Package, color: "bg-indigo-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-emerald-600" />
          VARLIKLAR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {assetItems.map((item) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-emerald-600">
                  ₺{item.value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Toplam</span>
            <span className="text-lg font-bold text-emerald-600">
              ₺{assets.total.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssetsWidget;

