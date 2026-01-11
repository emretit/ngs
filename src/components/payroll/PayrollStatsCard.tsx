import { Users, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PayrollStatsCardProps {
  totalEmployees: number;
  calculatedThisMonth: number;
  pendingApprovals: number;
  totalCost: number;
}

export const PayrollStatsCard = ({
  totalEmployees,
  calculatedThisMonth,
  pendingApprovals,
  totalCost,
}: PayrollStatsCardProps) => {
  const stats = [
    {
      label: "Toplam Çalışan",
      value: totalEmployees,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Hesaplanan Bordro",
      value: calculatedThisMonth,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Bekleyen Onay",
      value: pendingApprovals,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: "Toplam Maliyet",
      value: new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(totalCost),
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      isCompact: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.isCompact ? stat.value : stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
