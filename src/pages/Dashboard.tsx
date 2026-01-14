import { memo, useMemo, useCallback, lazy, Suspense, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CriticalAlertsBanner } from "@/components/dashboard/CriticalAlertsBanner";
import { GradientStatCards } from "@/components/dashboard/widgets/GradientStatCards";
import { ProactiveInsightsWidget } from "@/components/dashboard/ProactiveInsightsWidget";
import { TimePeriodCard } from "@/components/dashboard/v2/TimePeriodCard";
import { useWorkflowPipeline } from "@/hooks/useWorkflowPipeline";
import { useTodaysTasks } from "@/hooks/useTodaysTasks";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { useCompany } from "@/hooks/useCompany";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

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
  const { companyId } = useCompany();
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

      {/* AI Proactive Insights Widget */}
      {companyId && (
        <ProactiveInsightsWidget companyId={companyId} maxInsights={3} />
      )}

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
          <CardContent className="p-2.5 h-[280px]">
            <Suspense fallback={
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            }>
              {tasksLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
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
          <CardContent className="p-2.5 h-[280px]">
            <Suspense fallback={
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            }>
              {approvalsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-14 w-full" />
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
          <CardHeader className="pb-1.5 px-2.5 pt-2.5">
            <CardTitle className="text-sm font-semibold">Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px] overflow-auto px-2.5">
            <Suspense fallback={
              <div className="space-y-1.5">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
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
