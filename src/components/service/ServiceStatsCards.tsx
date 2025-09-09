import React from "react";
import { Card } from "@/components/ui/card";
import { 
  CalendarDays, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users 
} from "lucide-react";

interface ServiceStats {
  total: number;
  new: number;
  inProgress: number;
  completed: number;
  urgent: number;
  unassigned: number;
  assigned?: number;
  high?: number;
  medium?: number;
  low?: number;
}

interface ServiceStatsCardsProps {
  stats: ServiceStats;
  viewType?: "calendar" | "list";
}

const ServiceStatsCards = ({ stats, viewType = "calendar" }: ServiceStatsCardsProps) => {
  // Her iki görünüm için aynı kartlar
  const cards = [
    {
      title: "Toplam Talep",
      value: stats.total,
      icon: CalendarDays,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-gray-900"
    },
    {
      title: "Yeni",
      value: stats.new,
      icon: AlertCircle,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
      textColor: "text-gray-900"
    },
    {
      title: "Devam Ediyor",
      value: stats.inProgress,
      icon: Clock,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      textColor: "text-gray-900"
    },
    {
      title: "Tamamlandı",
      value: stats.completed,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      textColor: "text-gray-900"
    },
    {
      title: "Acil",
      value: stats.urgent,
      icon: AlertCircle,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      textColor: "text-red-600"
    },
    {
      title: "Atanmamış",
      value: stats.unassigned,
      icon: XCircle,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
      textColor: "text-orange-600"
    }
  ];

  const gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-6";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="p-4 bg-white border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className={`p-2 ${card.bgColor} rounded-lg`}>
                <IconComponent className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ServiceStatsCards;
