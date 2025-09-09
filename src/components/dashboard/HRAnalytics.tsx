import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserCheck, 
  Calendar,
  Clock,
  Award,
  TrendingUp,
  Building,
  AlertCircle,
  UserPlus,
  UserMinus
} from "lucide-react";

interface DepartmentStatsProps {
  name: string;
  employeeCount: number;
  performance: number;
  color: string;
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({
  name,
  employeeCount,
  performance,
  color
}) => {
  return (
    <div className="p-4 bg-white border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <Badge variant="secondary" className="text-xs">
          {employeeCount} kişi
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Performans</span>
          <span className="font-medium">{performance}%</span>
        </div>
        <Progress value={performance} className={`h-2 ${color}`} />
      </div>
    </div>
  );
};

interface TopPerformerProps {
  name: string;
  position: string;
  department: string;
  score: number;
  avatar?: string;
}

const TopPerformer: React.FC<TopPerformerProps> = ({
  name,
  position,
  department,
  score,
  avatar
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-sm text-gray-600">{position}</div>
          <div className="text-xs text-gray-500">{department}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center space-x-1">
          <Award className="h-4 w-4 text-yellow-500" />
          <span className="font-bold text-yellow-600">{score}</span>
        </div>
        <div className="text-xs text-gray-500">Performance Score</div>
      </div>
    </div>
  );
};

export const HRAnalytics: React.FC = () => {
  const hrMetrics = [
    {
      title: "Toplam Çalışan",
      value: "247",
      change: "+12",
      trend: "up" as const,
      icon: <Users className="h-5 w-5" />,
      description: "Bu ayki değişim"
    },
    {
      title: "Devam Oranı",
      value: "%94.2",
      change: "+2.1%",
      trend: "up" as const,
      icon: <UserCheck className="h-5 w-5" />,
      description: "Aylık ortalama"
    },
    {
      title: "Çalışan Memnuniyeti",
      value: "4.6/5",
      change: "+0.2",
      trend: "up" as const,
      icon: <Award className="h-5 w-5" />,
      description: "Anket sonuçları"
    },
    {
      title: "Ortalama Çalışma Saati",
      value: "42.5h",
      change: "-1.2h",
      trend: "down" as const,
      icon: <Clock className="h-5 w-5" />,
      description: "Haftalık ortalama"
    }
  ];

  const departmentStats = [
    { name: "Satış", employeeCount: 45, performance: 92, color: "bg-blue-500" },
    { name: "Pazarlama", employeeCount: 28, performance: 87, color: "bg-green-500" },
    { name: "Teknik", employeeCount: 67, performance: 89, color: "bg-purple-500" },
    { name: "İK", employeeCount: 15, performance: 94, color: "bg-yellow-500" },
    { name: "Finans", employeeCount: 23, performance: 91, color: "bg-red-500" },
    { name: "Operasyon", employeeCount: 69, performance: 85, color: "bg-indigo-500" }
  ];

  const topPerformers = [
    {
      name: "Ayşe Yılmaz",
      position: "Senior Developer",
      department: "Teknik",
      score: 98
    },
    {
      name: "Mehmet Kaya",
      position: "Sales Manager",
      department: "Satış",
      score: 96
    },
    {
      name: "Fatma Demir",
      position: "Marketing Lead",
      department: "Pazarlama",
      score: 94
    },
    {
      name: "Ali Şahin",
      position: "Product Owner",
      department: "Teknik",
      score: 93
    }
  ];

  const recentHREvents = [
    {
      type: "hire",
      title: "3 yeni işe alım",
      description: "Teknik departmanına",
      time: "2 gün önce",
      icon: <UserPlus className="h-4 w-4 text-green-500" />
    },
    {
      type: "leave",
      title: "İzin talebi onaylandı",
      description: "Ahmet Özkan - 5 gün",
      time: "1 gün önce",
      icon: <Calendar className="h-4 w-4 text-blue-500" />
    },
    {
      type: "resignation",
      title: "İstifa bildirimi",
      description: "Marketing departmanından",
      time: "3 gün önce",
      icon: <UserMinus className="h-4 w-4 text-red-500" />
    },
    {
      type: "alert",
      title: "Performans değerlendirmesi",
      description: "Q1 döneminde tamamlanacak",
      time: "1 hafta önce",
      icon: <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">İnsan Kaynakları Analizi</h2>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Toplam Maaş: ₺ 8,450,000/ay
        </Badge>
      </div>

      {/* HR Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hrMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className="h-8 w-8 text-blue-600">
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={metric.trend === "up" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {metric.trend === "up" ? "↗" : "↘"} {metric.change}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              Departman Performansı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departmentStats.map((dept, index) => (
                <DepartmentStats key={index} {...dept} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              En İyi Performans Gösterenler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPerformers.map((performer, index) => (
              <TopPerformer key={index} {...performer} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent HR Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Son İK Aktiviteleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentHREvents.map((event, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {event.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRAnalytics;
