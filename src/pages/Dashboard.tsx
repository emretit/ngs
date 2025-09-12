
import React, { useState } from "react";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ExecutiveSummary from "@/components/dashboard/ExecutiveSummary";
import FinancialOverview from "@/components/dashboard/FinancialOverview";
import SalesCRMSection from "@/components/dashboard/SalesCRMSection";
import HRAnalytics from "@/components/dashboard/HRAnalytics";
import OperationsOverview from "@/components/dashboard/OperationsOverview";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import ExchangeRateCard from "@/components/dashboard/ExchangeRateCard";
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
  TrendingDown
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
    { title: "Bugün", value: "₺ 45,200", change: "+12%", color: "text-green-600" },
    { title: "Bu Hafta", value: "₺ 324,800", change: "+8%", color: "text-blue-600" },
    { title: "Bu Ay", value: "₺ 2,847,250", change: "+15%", color: "text-purple-600" },
    { title: "Yıllık", value: "₺ 28,450,000", change: "+23%", color: "text-orange-600" }
  ];

  return (
    <DefaultLayout
      isCollapsed={isCollapsed}
      setIsCollapsed={setIsCollapsed}
      title="İşletme Kontrol Paneli"
      subtitle="İşletmenizin tüm operasyonlarını tek bakışta görün ve yönetin"
    >
      <div className="max-w-[1800px] mx-auto space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="grid grid-cols-4 gap-4">
              {quickStats.map((stat, index) => (
                <Card key={index} className="px-4 py-3">
                  <div className="text-sm text-gray-600">{stat.title}</div>
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className={`text-xs ${stat.color}`}>{stat.change}</div>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-sm px-3 py-1">
              Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Rapor Al
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Ayarlar
            </Button>
          </div>
        </div>

        {/* Dashboard Summary Widgets */}
        <div className="space-y-8">
          {/* Executive Summary Section */}
          <div>
            <ExecutiveSummary />
          </div>
          
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Summary */}
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Finansal Özet
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Nakit Akışı</span>
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold text-blue-600">₺50,000</p>
                    <span className="text-xs text-muted-foreground">Bu ay</span>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Alacaklar</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-xl font-bold text-green-600">₺125,000</p>
                    <span className="text-xs text-muted-foreground">Toplam</span>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Borçlar</span>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-xl font-bold text-red-600">₺75,000</p>
                    <span className="text-xs text-muted-foreground">Toplam</span>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Net Durum</span>
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                    </div>
                    <p className="text-xl font-bold text-purple-600">₺100,000</p>
                    <span className="text-xs text-muted-foreground">Genel Bakiye</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales & CRM Summary */}
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Satış & CRM
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fırsatlar</span>
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xl font-bold">24</p>
                    <span className="text-xs text-muted-foreground">Aktif</span>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Görevler</span>
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xl font-bold">18</p>
                    <span className="text-xs text-muted-foreground">Bekleyen</span>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Teklifler</span>
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                    <p className="text-xl font-bold">12</p>
                    <span className="text-xs text-muted-foreground">Hazırlanıyor</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* HR Summary */}
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  İnsan Kaynakları
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Toplam Çalışan</span>
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xl font-bold">127</p>
                    <span className="text-xs text-muted-foreground">+3 bu ay</span>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">İzinli Personel</span>
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className="text-xl font-bold">8</p>
                    <span className="text-xs text-muted-foreground">Bu hafta</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exchange Rate Card */}
            <ExchangeRateCard />

            {/* Operations Summary */}
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  Operasyonlar
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Servis Talepleri</span>
                      <Settings className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xl font-bold">45</p>
                    <span className="text-xs text-muted-foreground">Aktif</span>
                  </div>
                  
                  <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Açık Projeler</span>
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-xl font-bold">12</p>
                    <span className="text-xs text-muted-foreground">Devam ediyor</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-600" />
                Son Aktiviteler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Yeni müşteri eklendi: ABC Şirketi</p>
                    <p className="text-xs text-muted-foreground">2 saat önce</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Fatura gönderildi: #2024-001</p>
                    <p className="text-xs text-muted-foreground">4 saat önce</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-muted/20 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Yeni görev atandı: Proje analizi</p>
                    <p className="text-xs text-muted-foreground">1 gün önce</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Dashboard;
