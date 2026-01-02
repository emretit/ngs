import { memo, useMemo, useCallback, lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CriticalAlertsBanner } from "@/components/dashboard/CriticalAlertsBanner";
import { GradientStatCards } from "@/components/dashboard/widgets/GradientStatCards";
import { TimePeriodCard } from "@/components/dashboard/v2/TimePeriodCard";
import { useWorkflowPipeline } from "@/hooks/useWorkflowPipeline";
import { useTodaysTasks } from "@/hooks/useTodaysTasks";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Bot, ArrowRight } from "lucide-react";

// Lazy load heavy components for better performance
const WorkflowPipeline = lazy(() => import("@/components/dashboard/workflow/WorkflowPipeline").then(m => ({ default: m.WorkflowPipeline })));
const CashflowPipeline = lazy(() => import("@/components/dashboard/workflow/CashflowPipeline").then(m => ({ default: m.CashflowPipeline })));
const TodaysTasks = lazy(() => import("@/components/dashboard/workflow/TodaysTasks").then(m => ({ default: m.TodaysTasks })));
const PendingApprovals = lazy(() => import("@/components/dashboard/workflow/PendingApprovals").then(m => ({ default: m.PendingApprovals })));
const FinancialAnalysisChart = lazy(() => import("@/components/dashboard/charts/FinancialAnalysisChart").then(m => ({ default: m.FinancialAnalysisChart })));
const AdvancedFinancialCharts = lazy(() => import("@/components/dashboard/v2/AdvancedFinancialCharts").then(m => ({ default: m.AdvancedFinancialCharts })));
const FinancialDistributionChart = lazy(() => import("@/components/dashboard/charts/FinancialDistributionChart").then(m => ({ default: m.FinancialDistributionChart })));
const RecentActivitiesTimeline = lazy(() => import("@/components/dashboard/RecentActivitiesTimeline"));

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  
  // Workflow data
  const { data: pipelineStages, isLoading: pipelineLoading } = useWorkflowPipeline();
  const { tasks, isLoading: tasksLoading, completeTask } = useTodaysTasks();
  const { data: approvals, isLoading: approvalsLoading } = usePendingApprovals();
  
  // Financial widgets
  const {
    monthlyTurnover,
    monthlyExpenses,
    stockValue,
    totalReceivables,
    assets,
    liabilities,
    previousMonthSales,
    isLoading: widgetsLoading,
    isAssetsLoading,
    isLiabilitiesLoading
  } = useDashboardWidgets();

  // Calculate turnover trend - memoized
  const turnoverTrend = useMemo(() => 
    previousMonthSales > 0 
      ? ((monthlyTurnover - previousMonthSales) / previousMonthSales) * 100 
      : undefined,
    [monthlyTurnover, previousMonthSales]
  );

  // Stage routes mapping - memoized
  const stageRoutes = useMemo(() => ({
    'opportunities': '/opportunities',
    'proposals': '/proposals',
    'orders': '/orders/list',
    'deliveries': '/deliveries',
    'invoices': '/invoices'
  }), []);

  // Callback handlers - optimized with useCallback
  const handleStageClick = useCallback((stageId: string) => {
    const route = stageRoutes[stageId];
    if (route) {
      navigate(route);
    }
  }, [navigate, stageRoutes]);

  const handleTaskClick = useCallback((taskId: string) => {
    navigate(`/activities?taskId=${taskId}`);
  }, [navigate]);

  const handleAddTask = useCallback(() => {
    navigate('/activities?action=new');
  }, [navigate]);

  const handleApprove = useCallback((id: string) => {
    toast.success("Onay işlemi başarılı");
  }, []);

  const handleReject = useCallback((id: string) => {
    toast.info("Red işlemi başarılı");
  }, []);

  const handleViewDetails = useCallback((id: string) => {
    toast.info("Detay sayfası yakında eklenecek");
  }, []);

  return (
    <div className="space-y-3">
      {/* Dashboard Header */}
      <DashboardHeader />

      {/* Critical Alerts Banner */}
      <CriticalAlertsBanner />

      {/* Zaman Periyodu Seçici */}
      <TimePeriodCard
        selectedPeriod={selectedTimePeriod}
        onPeriodChange={setSelectedTimePeriod}
      />

      {/* Gradient Stat Cards - Zaman Periyodu Altında */}
      <GradientStatCards 
        monthlyTurnover={monthlyTurnover}
        totalReceivables={totalReceivables}
        monthlyExpenses={monthlyExpenses}
        stockValue={stockValue}
        turnoverTrend={turnoverTrend}
        isLoading={widgetsLoading}
      />

      {/* AI Asistan Kartı */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-background border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">AI Asistan</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Yapay zeka destekli iş asistanınız
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/ai-assistant')}
              className="gap-2"
            >
              Sohbet Başlat
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <h4 className="font-medium text-sm">Akıllı Öneriler</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  İşletmeniz için özelleştirilmiş öneriler alın
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <h4 className="font-medium text-sm">Hızlı Raporlar</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Sorularınıza anında rapor ve analiz üretin
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <span className="text-lg">🎯</span>
              </div>
              <div>
                <h4 className="font-medium text-sm">Görev Yönetimi</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Yapılacaklar ve öncelikler konusunda yardım alın
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Finansal Analiz Chart - Bağımsız Kart */}
      <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
        <FinancialAnalysisChart />
      </Suspense>

      {/* Financial Distribution Chart */}
      <Suspense fallback={<Skeleton className="h-[260px] w-full rounded-lg" />}>
        <FinancialDistributionChart 
          assets={assets}
          liabilities={liabilities}
          isLoading={isAssetsLoading || isLiabilitiesLoading}
        />
      </Suspense>

      {/* Workflow Pipelines */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <Suspense fallback={
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-24 flex-1" />
                  ))}
                </div>
              </div>
            }>
              {pipelineLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-24 flex-1" />
                    ))}
                  </div>
                </div>
              ) : (
                <WorkflowPipeline 
                  stages={pipelineStages || []} 
                  onStageClick={handleStageClick}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <CashflowPipeline />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Tasks & Approvals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Today's Tasks */}
        <Card className="lg:col-span-1 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 h-[350px]">
            <Suspense fallback={
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            }>
              {tasksLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (
                <TodaysTasks 
                  tasks={tasks}
                  onTaskComplete={completeTask}
                  onTaskClick={handleTaskClick}
                  onAddTask={handleAddTask}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="lg:col-span-1 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 h-[350px]">
            <Suspense fallback={
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-18 w-full" />
                ))}
              </div>
            }>
              {approvalsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-18 w-full" />
                  ))}
                </div>
              ) : (
                <PendingApprovals 
                  approvals={approvals || []}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onViewDetails={handleViewDetails}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-1 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-semibold">Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent className="h-[310px] overflow-auto px-3">
            <Suspense fallback={
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            }>
              <RecentActivitiesTimeline />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(Dashboard);
