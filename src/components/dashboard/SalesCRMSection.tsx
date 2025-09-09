import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Target, 
  Users, 
  TrendingUp, 
  Phone,
  Mail,
  Calendar,
  Star,
  Award
} from "lucide-react";

interface PipelineStageProps {
  stage: string;
  count: number;
  value: string;
  color: string;
  percentage: number;
}

const PipelineStage: React.FC<PipelineStageProps> = ({
  stage,
  count,
  value,
  color,
  percentage
}) => {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900">{stage}</h4>
        <Badge variant="secondary" className="text-xs">
          {count} fırsat
        </Badge>
      </div>
      <div className="text-lg font-bold text-gray-900 mb-2">{value}</div>
      <Progress value={percentage} className={`h-2 ${color}`} />
    </div>
  );
};

interface TopCustomerProps {
  name: string;
  company: string;
  value: string;
  avatar?: string;
  trend: "up" | "down" | "stable";
}

const TopCustomer: React.FC<TopCustomerProps> = ({
  name,
  company,
  value,
  avatar,
  trend
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-sm text-gray-600">{company}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{value}</div>
        <div className="text-xs text-gray-500">
          {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"} Bu ay
        </div>
      </div>
    </div>
  );
};

export const SalesCRMSection: React.FC = () => {
  const pipelineData = [
    {
      stage: "Prospect",
      count: 45,
      value: "₺ 2,100,000",
      color: "bg-blue-500",
      percentage: 100
    },
    {
      stage: "Qualified",
      count: 28,
      value: "₺ 1,650,000",
      color: "bg-yellow-500",
      percentage: 78
    },
    {
      stage: "Proposal",
      count: 15,
      value: "₺ 890,000",
      color: "bg-orange-500",
      percentage: 54
    },
    {
      stage: "Negotiation",
      count: 8,
      value: "₺ 450,000",
      color: "bg-purple-500",
      percentage: 32
    },
    {
      stage: "Won",
      count: 12,
      value: "₺ 680,000",
      color: "bg-green-500",
      percentage: 40
    }
  ];

  const topCustomers = [
    {
      name: "Ahmet Yılmaz",
      company: "ABC Teknoloji",
      value: "₺ 245,000",
      trend: "up" as const
    },
    {
      name: "Fatma Kaya",
      company: "XYZ Holding",
      value: "₺ 198,500",
      trend: "up" as const
    },
    {
      name: "Mehmet Demir",
      company: "DEF Sanayi",
      value: "₺ 156,200",
      trend: "stable" as const
    },
    {
      name: "Ayşe Şahin",
      company: "GHI Ticaret",
      value: "₺ 134,800",
      trend: "down" as const
    }
  ];

  const salesMetrics = [
    {
      title: "Conversion Rate",
      value: "24.8%",
      change: "+3.2%",
      icon: <Target className="h-4 w-4" />
    },
    {
      title: "Avg. Deal Size",
      value: "₺ 45,600",
      change: "+12.5%",
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      title: "Sales Cycle",
      value: "28 gün",
      change: "-4 gün",
      icon: <Calendar className="h-4 w-4" />
    },
    {
      title: "Win Rate",
      value: "68%",
      change: "+5%",
      icon: <Award className="h-4 w-4" />
    }
  ];

  const recentActivities = [
    {
      type: "call",
      title: "Ahmet Yılmaz ile görüşme",
      time: "2 saat önce",
      icon: <Phone className="h-4 w-4 text-blue-500" />
    },
    {
      type: "email",
      title: "Teklif gönderildi - XYZ Holding",
      time: "5 saat önce",
      icon: <Mail className="h-4 w-4 text-green-500" />
    },
    {
      type: "meeting",
      title: "Demo planlandı - DEF Sanayi",
      time: "1 gün önce",
      icon: <Calendar className="h-4 w-4 text-purple-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Satış & CRM Özeti</h2>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Bu Ay: ₺ 2,847,250
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Satış Pipeline'ı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {pipelineData.map((stage, index) => (
                <PipelineStage key={index} {...stage} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Satış Metrikleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {salesMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {metric.icon}
                  <div>
                    <div className="font-medium">{metric.title}</div>
                    <div className="text-sm text-gray-600">{metric.value}</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {metric.change}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              En Değerli Müşteriler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCustomers.map((customer, index) => (
              <TopCustomer key={index} {...customer} />
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{activity.title}</div>
                  <div className="text-sm text-gray-600">{activity.time}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesCRMSection;
