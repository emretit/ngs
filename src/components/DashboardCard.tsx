
import { Card } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const DashboardCard = ({ title, value, icon, trend }: DashboardCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-secondary">{icon}</div>
        {trend && (
          <div
            className={`text-xs ${
              trend.isPositive ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend.isPositive ? "+" : "-"}{trend.value}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className="text-xl font-bold mt-1">{value}</p>
      </div>
    </Card>
  );
};

export default DashboardCard;
