
import { SummaryCard } from "@/components/shared";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  onClick?: () => void;
}

const DashboardCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue',
  onClick 
}: DashboardCardProps) => {
  return (
    <SummaryCard
      title={title}
      value={value}
      icon={icon}
      color={color}
      trend={trend ? {
        value: Math.abs(trend.value),
        label: trend.isPositive ? "artış" : "azalış",
        direction: trend.isPositive ? "up" : "down"
      } : undefined}
      onClick={onClick}
    />
  );
};

export default DashboardCard;
