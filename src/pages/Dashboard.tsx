
import React, { useState } from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExchangeRateCard from "@/components/dashboard/ExchangeRateCard";
import DashboardCard from "@/components/DashboardCard";
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Target, 
  Settings,
  Bell,
  RefreshCw,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Activity,
  Clock,
  FileText
} from "lucide-react";

interface DashboardProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Dashboard = ({ isCollapsed, setIsCollapsed }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdated(new Date());
    // Burada veri yenileme işlemi yapılacak
  };

  const quickStats = [
    { 
      title: "Bugün", 
      value: "₺45,200", 
      icon: <DollarSign className="h-5 w-5" />,
      trend: { value: 12, isPositive: true }
    },
    { 
      title: "Bu Hafta", 
      value: "₺324,800", 
      icon: <BarChart3 className="h-5 w-5" />,
      trend: { value: 8, isPositive: true }
    },
    { 
      title: "Bu Ay", 
      value: "₺2,847,250", 
      icon: <TrendingUp className="h-5 w-5" />,
      trend: { value: 15, isPositive: true }
    },
    { 
      title: "Yıllık", 
      value: "₺28,450,000", 
      icon: <Target className="h-5 w-5" />,
      trend: { value: 23, isPositive: true }
    }
  ];

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="İşletme Kontrol Paneli"
      subtitle="İşletmenizin tüm operasyonlarını tek bakışta görün ve yönetin"
    >
      <div className="max-w-[1800px] mx-auto space-y-8 animate-fade-in">
        {/* Header with Quick Stats */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Kontrol Paneli</h1>
              <p className="text-muted-foreground mt-1">İşletmenizin günlük performansına göz atın</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-sm px-3 py-1.5 bg-background/50">
                <Clock className="h-3 w-3 mr-1" />
                {lastUpdated.toLocaleTimeString('tr-TR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Yenile
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Rapor
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => (
              <DashboardCard
                key={index}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                trend={stat.trend}
              />
            ))}
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Financial Overview */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-0 shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                    Finansal Durum
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-2">
                    Detaylar <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Nakit Akışı</p>
                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">₺150,000</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Bu ay</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Alacaklar</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">₺325,000</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Toplam</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Borçlar</p>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">₺185,000</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400">Toplam</p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-orange-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Net Durum</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">₺290,000</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">Genel Bakiye</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CRM & Sales */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-0 shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Target className="h-6 w-6 text-emerald-600" />
                    </div>
                    Satış Performansı
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-2">
                    CRM'ye Git <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">24</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Aktif Fırsatlar</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl">
                    <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">18</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Bekleyen Görevler</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                    <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">12</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Hazır Teklifler</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Exchange Rates */}
            <ExchangeRateCard />

            {/* HR Summary */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  İnsan Kaynakları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Toplam Çalışan</span>
                  </div>
                  <span className="font-bold">127</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm font-medium">İzinli Personel</span>
                  </div>
                  <span className="font-bold">8</span>
                </div>
              </CardContent>
            </Card>

            {/* Operations */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Settings className="h-5 w-5 text-orange-600" />
                  </div>
                  Operasyonlar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">Servis Talepleri</span>
                  </div>
                  <span className="font-bold">45</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm font-medium">Açık Projeler</span>
                  </div>
                  <span className="font-bold">12</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="bg-gradient-to-br from-card to-card/50 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  Son Aktiviteler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Yeni müşteri eklendi</p>
                    <p className="text-xs text-muted-foreground">ABC Şirketi • 2s önce</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Fatura gönderildi</p>
                    <p className="text-xs text-muted-foreground">#2024-001 • 4s önce</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Görev atandı</p>
                    <p className="text-xs text-muted-foreground">Proje analizi • 1g önce</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Dashboard;
