
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
    <Card className="bg-gradient-to-br from-card to-card/50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:bg-primary/20 transition-colors duration-300">
            {icon}
          </div>
          {trend && (
            <div className="flex items-center gap-1">
              <div
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  trend.isPositive 
                    ? "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30" 
                    : "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30"
                }`}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </div>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20"></div>
    </Card>
  );
};

export default DashboardCard;
