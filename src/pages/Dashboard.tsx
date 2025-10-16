import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import { Target, Users } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const { financialData, crmStats, hrStats, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Modern Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Gösterge Paneli
            </h1>
            <p className="text-muted-foreground mt-1">
              İş süreçlerinizi takip edin ve yönetin
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Güncel</span>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="mb-8">
        <MetricsGrid
          financialData={financialData}
          crmStats={crmStats}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activities Timeline */}
          <RecentActivitiesTimeline />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* CRM Quick Stats */}
          <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    CRM Özeti
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Güncel durum</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Aktif Fırsatlar</span>
                <span className="text-sm font-bold text-foreground">{crmStats?.opportunities || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Bekleyen Teklifler</span>
                <span className="text-sm font-bold text-foreground">{crmStats?.proposals || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Aktiviteler</span>
                <span className="text-sm font-bold text-foreground">{crmStats?.activities || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* HR Quick Stats */}
          <Card className="group hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    İK Özeti
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Personel durumu</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Toplam Çalışan</span>
                <span className="text-sm font-bold text-foreground">{hrStats?.totalEmployees || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">İzinli</span>
                <span className="text-sm font-bold text-foreground">{hrStats?.onLeave || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground">Aktif</span>
                <span className="text-sm font-bold text-foreground">
                  {(hrStats?.totalEmployees || 0) - (hrStats?.onLeave || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
