import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Target, Users, Calendar, DollarSign, ChevronRight, Bot, Sparkles, ChevronDown } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AIAgentPanel } from "@/components/dashboard/AIAgentPanel";

const Dashboard = () => {
  const { financialData, crmStats, hrStats, isLoading } = useDashboardData();
  const navigate = useNavigate();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dashboard Header */}
      <DashboardHeader 
        financialData={financialData}
        crmStats={crmStats}
        hrStats={hrStats}
      />

      {/* Collapsible AI Agent Panel */}
      <Collapsible open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-12 px-4 bg-gradient-to-r from-primary/5 to-transparent border-primary/20 hover:border-primary/40 hover:bg-primary/10 group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <span className="font-medium text-sm">AI Agent ile Analiz</span>
                <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                  Doğal dille veri sorgulama
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 rounded-full hidden sm:inline">
                Yeni
              </span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${aiPanelOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <AIAgentPanel />
        </CollapsibleContent>
      </Collapsible>

      {/* KPI Metrics Grid */}
      <MetricsGrid
        financialData={financialData}
        crmStats={crmStats}
      />

      {/* Main Content Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 md:p-6">

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Recent Activities Timeline */}
            <RecentActivitiesTimeline />

            {/* Cash Flow Card */}
            <Card className="group hover:shadow-md transition-all duration-300 border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                      <DollarSign className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Nakit Akışı</CardTitle>
                      <p className="text-xs text-muted-foreground">Finansal durum</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/cashflow")}
                    className="text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    Tümünü Gör
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700 block mb-1">Günlük Gelir</span>
                  <span className="text-sm font-bold text-emerald-600">₺{(financialData?.cashFlow || 0).toLocaleString("tr-TR")}</span>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <span className="text-xs font-medium text-amber-700 block mb-1">Bekleyen Tahsilat</span>
                  <span className="text-sm font-bold text-amber-600">₺{(financialData?.receivables || 0).toLocaleString("tr-TR")}</span>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <span className="text-xs font-medium text-red-700 block mb-1">Bekleyen Ödeme</span>
                  <span className="text-sm font-bold text-red-600">₺{(financialData?.payables || 0).toLocaleString("tr-TR")}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-4 md:space-y-6">
            {/* CRM Quick Stats */}
            <Card className="group hover:shadow-md transition-all duration-300 border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">CRM Özeti</CardTitle>
                      <p className="text-xs text-muted-foreground">Güncel durum</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/opportunities")}
                    className="text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                  <span className="text-xs font-medium text-blue-700">Aktif Fırsatlar</span>
                  <span className="text-sm font-bold text-blue-600">{crmStats?.opportunities || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-violet-50/50 border border-violet-100">
                  <span className="text-xs font-medium text-violet-700">Bekleyen Teklifler</span>
                  <span className="text-sm font-bold text-violet-600">{crmStats?.proposals || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <span className="text-xs font-medium text-indigo-700">Aktiviteler</span>
                  <span className="text-sm font-bold text-indigo-600">{crmStats?.activities || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* HR Quick Stats */}
            <Card className="group hover:shadow-md transition-all duration-300 border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">İK Özeti</CardTitle>
                      <p className="text-xs text-muted-foreground">Personel durumu</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/employees")}
                    className="text-xs text-muted-foreground hover:text-foreground h-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-teal-50/50 border border-teal-100">
                  <span className="text-xs font-medium text-teal-700">Toplam Çalışan</span>
                  <span className="text-sm font-bold text-teal-600">{hrStats?.totalEmployees || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-50/50 border border-cyan-100">
                  <span className="text-xs font-medium text-cyan-700">İzinli</span>
                  <span className="text-sm font-bold text-cyan-600">{hrStats?.onLeave || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700">Aktif</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {(hrStats?.totalEmployees || 0) - (hrStats?.onLeave || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Quick Access */}
            <Card 
              className="group hover:shadow-md transition-all duration-300 border-gray-200 cursor-pointer hover:border-purple-200"
              onClick={() => navigate("/calendar")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Genel Takvim</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      Aktiviteler, siparişler ve teslimatlar
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Dashboard);

