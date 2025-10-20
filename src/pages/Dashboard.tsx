import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import { Target, Users, LayoutGrid } from "lucide-react";
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
      {/* Header - aligned with Proposals header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm mb-6">
        {/* Left: Title with icon */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg text-white shadow-lg">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Gösterge Paneli
            </h1>
            <p className="text-xs text-muted-foreground/70">İş süreçlerinizi takip edin ve yönetin.</p>
          </div>
        </div>
        {/* Right: Status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white border border-blue-600 shadow-sm">
          <span className="font-bold">Durum</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">Güncel</span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* KPI Metrics Grid */}
        <MetricsGrid
          financialData={financialData}
          crmStats={crmStats}
        />

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
          <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-primary/20">
            <CardHeader className="pb-3">
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
          <Card className="group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-primary/20">
            <CardHeader className="pb-3">
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
        </div>
        </div>
      </div>
    </>
  );
};

export default memo(Dashboard);
