import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Users, PieChart, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  description?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  description
}) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
            <span className={
              trend === "up" ? "text-green-500" : 
              trend === "down" ? "text-red-500" : 
              "text-muted-foreground"
            }>
              {change}
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const SimpleDashboardCards: React.FC = () => {
  // Mock data - in real app this would come from props or hooks
  const dashboardData = [
    {
      title: "Toplam Gelir",
      value: "₺ 1,245,800",
      change: "+12.5% geçen ay",
      trend: "up" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Bu ayki toplam gelir"
    },
    {
      title: "Toplam Masraf",
      value: "₺ 856,200",
      change: "+8.2% geçen ay",
      trend: "up" as const,
      icon: <TrendingDown className="h-4 w-4" />,
      description: "Bu ayki toplam masraf"
    },
    {
      title: "Net Kar",
      value: "₺ 389,600",
      change: "+15.1% geçen ay",
      trend: "up" as const,
      icon: <DollarSign className="h-4 w-4" />,
      description: "Bu ayki net kar"
    },
    {
      title: "Aktif Çalışanlar",
      value: "24",
      change: "+2 yeni işe alım",
      trend: "up" as const,
      icon: <Users className="h-4 w-4" />,
      description: "Toplam aktif personel"
    },
    {
      title: "Nakit Akışı",
      value: "₺ 523,400",
      change: "+6.8% geçen ay",
      trend: "up" as const,
      icon: <PieChart className="h-4 w-4" />,
      description: "Mevcut nakit pozisyonu"
    },
    {
      title: "Bu Ay Faturalar",
      value: "42",
      change: "18 beklemede",
      trend: "neutral" as const,
      icon: <Calendar className="h-4 w-4" />,
      description: "Toplam fatura sayısı"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {dashboardData.map((item, index) => (
        <DashboardCard
          key={index}
          title={item.title}
          value={item.value}
          change={item.change}
          trend={item.trend}
          icon={item.icon}
          description={item.description}
        />
      ))}
    </div>
  );
};

export default SimpleDashboardCards;