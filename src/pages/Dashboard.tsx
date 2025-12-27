import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { CriticalAlertsBanner } from "@/components/dashboard/CriticalAlertsBanner";
import { WorkflowPipeline } from "@/components/dashboard/workflow/WorkflowPipeline";
import { CashflowPipeline } from "@/components/dashboard/workflow/CashflowPipeline";
import { TodaysTasks } from "@/components/dashboard/workflow/TodaysTasks";
import { PendingApprovals } from "@/components/dashboard/workflow/PendingApprovals";
import { QuickActions } from "@/components/dashboard/workflow/QuickActions";
import { CashflowSummaryWidget } from "@/components/dashboard/workflow/CashflowSummaryWidget";
import { useWorkflowPipeline } from "@/hooks/useWorkflowPipeline";
import { useTodaysTasks } from "@/hooks/useTodaysTasks";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import BalanceSheetWidget from "@/components/dashboard/widgets/BalanceSheetWidget";
import RecentActivitiesTimeline from "@/components/dashboard/RecentActivitiesTimeline";
import MonthlyTurnoverWidget from "@/components/dashboard/widgets/MonthlyTurnoverWidget";
import TotalReceivablesWidget from "@/components/dashboard/widgets/TotalReceivablesWidget";
import OverdueReceivablesWidget from "@/components/dashboard/widgets/OverdueReceivablesWidget";
import UpcomingChecksWidget from "@/components/dashboard/widgets/UpcomingChecksWidget";
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
    totalReceivables,
    overdueReceivables,
    upcomingChecks,
    assets,
    liabilities,
    isLoading: widgetsLoading,
    isAssetsLoading,
    isLiabilitiesLoading
  } = useDashboardWidgets();

  const handleStageClick = (stageId: string) => {
    const routes: Record<string, string> = {
      'opportunities': '/crm/opportunities',
      'proposals': '/proposals',
      'orders': '/sales/orders',
      'deliveries': '/sales/deliveries',
      'invoices': '/sales/invoices'
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
    // TODO: Implement approval logic
  };

  const handleReject = (id: string) => {
    toast.info("Red işlemi başarılı");
    // TODO: Implement rejection logic
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Welcome + Daily Summary */}
      <DashboardHeader />

      {/* Critical Alerts Banner */}
      <CriticalAlertsBanner />

      {/* Quick Actions Bar */}
      <QuickActions compact />

      {/* Main Workflow Pipeline */}
      <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {pipelineLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-32 flex-1" />
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

      {/* Cashflow Pipeline - NEW */}
      <Card className="bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <CashflowPipeline />
        </CardContent>
      </Card>

      {/* Main Content Grid - 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Today's Tasks */}
        <Card className="lg:col-span-1 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 h-[400px]">
            {tasksLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-2 w-full" />
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

        {/* Middle Column - Pending Approvals */}
        <Card className="lg:col-span-1 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 h-[400px]">
            {approvalsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <PendingApprovals 
                approvals={approvals || []}
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDetails={(id) => navigate(`/approvals/${id}`)}
              />
            )}
          </CardContent>
        </Card>

        {/* Right Column - Cashflow Summary (NEW) */}
        <div className="lg:col-span-1 h-[400px]">
          <CashflowSummaryWidget />
        </div>
      </div>

      {/* Financial Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MonthlyTurnoverWidget 
          value={monthlyTurnover || 0} 
          isLoading={widgetsLoading} 
        />
        <TotalReceivablesWidget 
          totalReceivables={totalReceivables || 0}
          isLoading={widgetsLoading} 
        />
        <OverdueReceivablesWidget 
          receivables={overdueReceivables || []} 
          isLoading={widgetsLoading} 
        />
        <UpcomingChecksWidget 
          checks={upcomingChecks || []} 
          isLoading={widgetsLoading} 
        />
      </div>

      {/* Bottom Row - Balance Sheet & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Balance Sheet Widget - 1 Column */}
        <div className="lg:col-span-1">
          <BalanceSheetWidget 
            assets={assets}
            liabilities={liabilities}
            isLoading={isAssetsLoading || isLiabilitiesLoading}
          />
        </div>

        {/* Activities Timeline - 2 Columns */}
        <Card className="lg:col-span-2 bg-card border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivitiesTimeline />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default memo(Dashboard);
