import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import GlobalSearchBar from "@/components/dashboard/GlobalSearchBar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel";
import { Target, Users, LayoutGrid, FileText, Activity, Calendar, CheckCircle, DollarSign, ChevronRight } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { financialData, crmStats, hrStats, isLoading } = useDashboardData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Dashboard Header */}
      <DashboardHeader 
        financialData={financialData}
        crmStats={crmStats}
        hrStats={hrStats}
      />

      {/* Global Search Bar */}
      <div className="mt-4">
        <GlobalSearchBar />
      </div>

      {/* AI Insights Panel - Ayrı kart olarak */}
      <div className="mt-4">
        <AIInsightsPanel />
      </div>

      {/* Main Content Container */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* KPI Metrics Grid */}
        <MetricsGrid
          financialData={financialData}
          crmStats={crmStats}
        />

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activities Timeline */}
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <RecentActivitiesTimeline />
            </div>

            {/* Cash Flow Card */}
            <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Nakit Akışı
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Finansal durum</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/cashflow")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Tümünü Gör
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Günlük Gelir</span>
                  <span className="text-sm font-bold text-green-600">₺{(financialData?.cashFlow || 0).toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Bekleyen Tahsilat</span>
                  <span className="text-sm font-bold text-orange-600">₺{(financialData?.receivables || 0).toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Bekleyen Ödeme</span>
                  <span className="text-sm font-bold text-red-600">₺{(financialData?.payables || 0).toLocaleString("tr-TR")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* CRM Quick Stats */}
            <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        CRM Özeti
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Güncel durum</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/opportunities")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Tümünü Gör
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Aktif Fırsatlar</span>
                  <span className="text-sm font-bold text-foreground">{crmStats?.opportunities || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Bekleyen Teklifler</span>
                  <span className="text-sm font-bold text-foreground">{crmStats?.proposals || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Aktiviteler</span>
                  <span className="text-sm font-bold text-foreground">{crmStats?.activities || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* HR Quick Stats */}
            <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        İK Özeti
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Personel durumu</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/employees")}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Tümünü Gör
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Toplam Çalışan</span>
                  <span className="text-sm font-bold text-foreground">{hrStats?.totalEmployees || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">İzinli</span>
                  <span className="text-sm font-bold text-foreground">{hrStats?.onLeave || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">Aktif</span>
                  <span className="text-sm font-bold text-foreground">
                    {(hrStats?.totalEmployees || 0) - (hrStats?.onLeave || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Quick Access */}
            <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 cursor-pointer"
                  onClick={() => navigate("/calendar")}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Genel Takvim
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Tüm etkinlikler</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/calendar");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Aç
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Aktiviteler, siparişler ve teslimatlarınızı takvim görünümünde görüntüleyin
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(Dashboard);

