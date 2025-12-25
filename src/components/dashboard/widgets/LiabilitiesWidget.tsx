import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Building2, Receipt, FileText } from "lucide-react";

interface LiabilitiesWidgetProps {
  liabilities?: {
    payables: number;
    creditCards: number;
    loans: number;
    einvoices: number;
    total: number;
  };
  isLoading?: boolean;
}

const LiabilitiesWidget = ({ liabilities, isLoading }: LiabilitiesWidgetProps) => {
  if (isLoading || !liabilities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>BORÇLAR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
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

  const maxValue = Math.max(liabilities.payables, liabilities.creditCards, liabilities.loans, liabilities.einvoices, 1);

  const liabilityItems = [
    { label: "Açık Hesap (Borçlar)", value: liabilities.payables, icon: Building2, color: "bg-red-500" },
    { label: "Kredi Kartı", value: liabilities.creditCards, icon: CreditCard, color: "bg-rose-500" },
    { label: "Krediler", value: liabilities.loans, icon: FileText, color: "bg-orange-500" },
    { label: "E-Faturalar", value: liabilities.einvoices, icon: Receipt, color: "bg-amber-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-red-600" />
          BORÇLAR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {liabilityItems.map((item) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="font-bold text-red-600">
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
            <span className="text-lg font-bold text-red-600">
              ₺{liabilities.total.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiabilitiesWidget;

