import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import GlobalSearchBar from "@/components/dashboard/GlobalSearchBar";
import { Target, Users, LayoutGrid, FileText, Activity, Calendar, CheckCircle } from "lucide-react";
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

      {/* Global Search Bar */}
      <GlobalSearchBar />

      {/* Main Content Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
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
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* CRM Quick Stats */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        CRM Özeti
                      </CardTitle>
                      <p className="text-sm text-blue-600 font-medium">Güncel durum</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {crmStats?.opportunities + crmStats?.proposals + crmStats?.activities || 0}
                    </div>
                    <div className="text-xs text-blue-500">Toplam</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/70 hover:bg-white/90 transition-colors cursor-pointer group/item">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Aktif Fırsatlar</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{crmStats?.opportunities || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/70 hover:bg-white/90 transition-colors cursor-pointer group/item">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Bekleyen Teklifler</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{crmStats?.proposals || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/70 hover:bg-white/90 transition-colors cursor-pointer group/item">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Aktiviteler</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{crmStats?.activities || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* HR Quick Stats */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        İK Özeti
                      </CardTitle>
                      <p className="text-sm text-green-600 font-medium">Personel durumu</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {hrStats?.totalEmployees || 0}
                    </div>
                    <div className="text-xs text-green-500">Toplam</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/70 hover:bg-white/90 transition-colors cursor-pointer group/item">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Toplam Çalışan</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{hrStats?.totalEmployees || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/70 hover:bg-white/90 transition-colors cursor-pointer group/item">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">İzinli</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{hrStats?.onLeave || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/70 hover:bg-white/90 transition-colors cursor-pointer group/item">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Aktif</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">
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
