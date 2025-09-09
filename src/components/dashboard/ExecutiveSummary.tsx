import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
  subtitle: string;
  target?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  subtitle,
  target
}) => {
  const getTrendIcon = () => {
    switch (changeType) {
      case "increase":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />;
      case "decrease":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600 bg-green-50";
      case "decrease":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <Badge 
              variant="secondary" 
              className={`${getTrendColor()} text-xs font-medium px-2 py-1`}
            >
              {Math.abs(change)}%
            </Badge>
          </div>
          {target && (
            <div className="text-xs text-gray-500">
              Hedef: {target}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

export const ExecutiveSummary: React.FC = () => {
  const kpiData = [
    {
      title: "Toplam Gelir",
      value: "₺ 2,847,250",
      change: 12.5,
      changeType: "increase" as const,
      icon: <DollarSign className="h-4 w-4" />,
      subtitle: "Bu ay vs geçen ay",
      target: "₺ 3,000,000"
    },
    {
      title: "Net Kâr Marjı",
      value: "%18.4",
      change: 2.3,
      changeType: "increase" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      subtitle: "Geçen aya göre artış",
      target: "%20"
    },
    {
      title: "Aktif Müşteriler",
      value: "1,247",
      change: 8.1,
      changeType: "increase" as const,
      icon: <Users className="h-4 w-4" />,
      subtitle: "Bu ayki aktif müşteri sayısı"
    },
    {
      title: "Ortalama Sipariş Tutarı",
      value: "₺ 3,450",
      change: -5.2,
      changeType: "decrease" as const,
      icon: <ShoppingCart className="h-4 w-4" />,
      subtitle: "Geçen aya göre değişim"
    },
    {
      title: "Sales Conversion",
      value: "%24.8",
      change: 3.7,
      changeType: "increase" as const,
      icon: <Target className="h-4 w-4" />,
      subtitle: "Lead to customer dönüşüm oranı",
      target: "%30"
    },
    {
      title: "Müşteri Memnuniyeti",
      value: "4.7/5",
      change: 0,
      changeType: "neutral" as const,
      icon: <TrendingUp className="h-4 w-4" />,
      subtitle: "Ortalama müşteri puanı"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
          <p className="text-gray-600">İşletmenizin ana performans göstergelerine genel bakış</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Son güncelleme: {new Date().toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>
    </div>
  );
};

export default ExecutiveSummary;
