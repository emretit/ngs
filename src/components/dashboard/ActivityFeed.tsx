import React from "react";
import { logger } from '@/utils/logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, 
  Calendar, 
  FileText, 
  Users, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  MessageSquare,
  Settings,
  Plus
} from "lucide-react";

interface ActivityItemProps {
  type: "notification" | "task" | "transaction" | "meeting" | "system";
  title: string;
  description: string;
  time: string;
  user?: {
    name: string;
    avatar?: string;
  };
  priority?: "high" | "medium" | "low";
  status?: "pending" | "completed" | "cancelled";
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  type,
  title,
  description,
  time,
  user,
  priority,
  status
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case "notification":
        return <Bell className="h-4 w-4 text-blue-500" />;
      case "task":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "transaction":
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      case "meeting":
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case "system":
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50";
      case "medium":
        return "border-l-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-green-500 bg-green-50";
      default:
        return "border-l-gray-300 bg-white";
    }
  };

  return (
    <div className={`flex items-start space-x-3 p-4 border-l-4 rounded-lg ${getPriorityColor()}`}>
      <div className="flex-shrink-0 mt-1">
        {getTypeIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-900 truncate">{title}</p>
          <div className="flex items-center space-x-2">
            {status && (
              <Badge 
                variant={
                  status === "completed" ? "default" : 
                  status === "pending" ? "outline" : "destructive"
                }
                className="text-xs"
              >
                {status === "completed" ? "Tamamlandı" : 
                 status === "pending" ? "Beklemede" : "İptal"}
              </Badge>
            )}
            <span className="text-xs text-gray-500">{time}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        {user && (
          <div className="flex items-center space-x-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-xs">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500">{user.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  onClick,
  color
}) => {
  return (
    <Button
      variant="outline"
      className={`h-auto p-4 flex flex-col items-center text-center space-y-2 ${color} hover:shadow-md transition-all`}
      onClick={onClick}
    >
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-gray-600">{description}</div>
      </div>
    </Button>
  );
};

export const ActivityFeed: React.FC = () => {
  const recentActivities = [
    {
      type: "transaction" as const,
      title: "Yeni fatura oluşturuldu",
      description: "ABC Teknoloji için ₺45,200 tutarında fatura oluşturuldu",
      time: "5 dk önce",
      user: { name: "Ahmet Yılmaz", avatar: "/avatars/ahmet.jpg" },
      priority: "medium" as const,
      status: "completed" as const
    },
    {
      type: "notification" as const,
      title: "Stok uyarısı",
      description: "Toner kartuş stoku kritik seviyede (8 adet kaldı)",
      time: "15 dk önce",
      priority: "high" as const,
      status: "pending" as const
    },
    {
      type: "meeting" as const,
      title: "Haftalık toplantı",
      description: "Pazarlama ekibi ile haftalık değerlendirme toplantısı",
      time: "30 dk önce",
      user: { name: "Fatma Kaya" },
      status: "completed" as const
    },
    {
      type: "task" as const,
      title: "Müşteri ödemesi alındı",
      description: "XYZ Holding ₺28,700 ödeme yaptı",
      time: "1 saat önce",
      user: { name: "Mehmet Demir" },
      priority: "low" as const,
      status: "completed" as const
    },
    {
      type: "system" as const,
      title: "Sistem güncellemesi",
      description: "Fatura modülü v2.1.0 güncellemesi tamamlandı",
      time: "2 saat önce",
      status: "completed" as const
    },
    {
      type: "notification" as const,
      title: "Onay bekleyen işlem",
      description: "Satın alma talebi onayınızı bekliyor (₺12,800)",
      time: "3 saat önce",
      priority: "high" as const,
      status: "pending" as const
    }
  ];

  const quickActions = [
    {
      title: "Yeni Fatura",
      description: "Satış faturası oluştur",
      icon: <FileText className="h-6 w-6" />,
      onClick: () => logger.debug("Navigate to invoice"),
      color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
    },
    {
      title: "Müşteri Ekle",
      description: "Yeni müşteri kaydı",
      icon: <Users className="h-6 w-6" />,
      onClick: () => logger.debug("Navigate to customer"),
      color: "border-green-200 hover:border-green-300 hover:bg-green-50"
    },
    {
      title: "Toplantı Planla",
      description: "Yeni toplantı oluştur",
      icon: <Calendar className="h-6 w-6" />,
      onClick: () => logger.debug("Navigate to calendar"),
      color: "border-purple-200 hover:border-purple-300 hover:bg-purple-50"
    },
    {
      title: "Rapor Al",
      description: "Mali rapor oluştur",
      icon: <TrendingUp className="h-6 w-6" />,
      onClick: () => logger.debug("Generate report"),
      color: "border-orange-200 hover:border-orange-300 hover:bg-orange-50"
    }
  ];

  const systemNotifications = [
    {
      type: "warning",
      message: "3 fatura ödeme tarihi geçti",
      action: "Görüntüle"
    },
    {
      type: "info",
      message: "Yeni sistem güncellemesi mevcut",
      action: "Güncelle"
    },
    {
      type: "success",
      message: "Aylık rapor başarıyla oluşturuldu",
      action: "İndir"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Aktivite & Bildirimler</h2>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Okunmamış: 12
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Son Aktiviteler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions & Notifications */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
                Hızlı İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <QuickAction key={index} {...action} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Sistem Bildirimleri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {systemNotifications.map((notification, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {notification.type === "warning" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    {notification.type === "info" && <Bell className="h-4 w-4 text-blue-500" />}
                    {notification.type === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    <span className="text-sm text-gray-900">{notification.message}</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    {notification.action}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
