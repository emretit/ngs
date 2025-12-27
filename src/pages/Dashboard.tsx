import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CriticalAlertsBanner } from "@/components/dashboard/CriticalAlertsBanner";
import { WorkflowPipeline } from "@/components/dashboard/workflow/WorkflowPipeline";
import { CashflowPipeline } from "@/components/dashboard/workflow/CashflowPipeline";
import { TodaysTasks } from "@/components/dashboard/workflow/TodaysTasks";
import { PendingApprovals } from "@/components/dashboard/workflow/PendingApprovals";
import { GradientStatCards } from "@/components/dashboard/widgets/GradientStatCards";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { FinancialDistributionChart } from "@/components/dashboard/charts/FinancialDistributionChart";
import { useWorkflowPipeline } from "@/hooks/useWorkflowPipeline";
import { useTodaysTasks } from "@/hooks/useTodaysTasks";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { useRevenueTrend } from "@/hooks/useRevenueTrend";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  
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

  // Revenue trend data
  const { data: revenueTrendData, isLoading: revenueTrendLoading } = useRevenueTrend();

  // Calculate turnover trend
  const turnoverTrend = previousMonthSales > 0 
    ? ((monthlyTurnover - previousMonthSales) / previousMonthSales) * 100 
    : undefined;

  const handleStageClick = (stageId: string) => {
    const routes: Record<string, string> = {
      'opportunities': '/opportunities',
      'proposals': '/proposals',
      'orders': '/orders/list',
      'deliveries': '/deliveries',
      'invoices': '/invoices'
    };
    if (routes[stageId]) {
      navigate(routes[stageId]);
    }
  };

  const handleTaskClick = (taskId: string) => {
    navigate(`/activities?taskId=${taskId}`);
  };

  const handleAddTask = () => {
    navigate('/activities?action=new');
  };

  const handleApprove = (id: string) => {
    toast.success("Onay işlemi başarılı");
  };

  const handleReject = (id: string) => {
    toast.info("Red işlemi başarılı");
  };

  return (
    <div className="space-y-5">
      {/* Header - Welcome + AI Button + Stats */}
      <DashboardHeader />

      {/* Critical Alerts Banner */}
      <CriticalAlertsBanner />

      {/* Revenue Trend Chart - Above stat cards */}
      <RevenueTrendChart 
        data={revenueTrendData} 
        isLoading={revenueTrendLoading} 
      />

      {/* Gradient Stat Cards - Like reference images */}
      <GradientStatCards 
        monthlyTurnover={monthlyTurnover}
        totalReceivables={totalReceivables}
        monthlyExpenses={monthlyExpenses}
        stockValue={stockValue}
        turnoverTrend={turnoverTrend}
        isLoading={widgetsLoading}
      />

      {/* Financial Distribution Chart */}
      <FinancialDistributionChart 
        assets={assets}
        liabilities={liabilities}
        isLoading={isAssetsLoading || isLiabilitiesLoading}
      />

      {/* Workflow Pipelines */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            {pipelineLoading ? (
              <div className="space-y-4">
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
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <CashflowPipeline />
          </CardContent>
        </Card>
      </div>

      {/* Tasks & Approvals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Tasks */}
        <Card className="lg:col-span-1 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 h-[380px]">
            {tasksLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
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
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="lg:col-span-1 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 h-[380px]">
            {approvalsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <PendingApprovals 
                approvals={approvals || []}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDetails={(id) => {
                  // Approval type'a göre route yönlendirmesi yapılabilir
                  // Şimdilik sadece toast gösteriyoruz
                  toast.info("Detay sayfası yakında eklenecek");
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-1 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent className="h-[330px] overflow-auto">
            <RecentActivitiesTimeline />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(Dashboard);
