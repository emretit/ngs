import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { WorkflowPipeline } from "@/components/dashboard/workflow/WorkflowPipeline";
import { TodaysTasks } from "@/components/dashboard/workflow/TodaysTasks";
import { PendingApprovals } from "@/components/dashboard/workflow/PendingApprovals";
import { QuickActions } from "@/components/dashboard/workflow/QuickActions";
import { useWorkflowPipeline } from "@/hooks/useWorkflowPipeline";
import { useTodaysTasks } from "@/hooks/useTodaysTasks";
import { usePendingApprovals } from "@/hooks/usePendingApprovals";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import AIAssistantWidget from "@/components/dashboard/widgets/AIAssistantWidget";
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
    isLoading: widgetsLoading
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
    <div className="space-y-6">
      {/* Header */}
      <DashboardHeader />

      {/* Quick Actions Bar */}
      <QuickActions compact />

      {/* Main Workflow Pipeline */}
      <Card className="bg-white border-gray-200 shadow-sm">
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Today's Tasks */}
        <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4 h-[420px]">
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
        <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4 h-[420px]">
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

        {/* Right Column - AI Assistant */}
        <Card className="lg:col-span-1 bg-white border-gray-200 shadow-sm">
          <CardContent className="p-4 h-[420px]">
            <AIAssistantWidget />
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Bottom Row - Activities Timeline */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivitiesTimeline />
        </CardContent>
      </Card>

      {/* Full Quick Actions (for reference) */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <QuickActions />
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(Dashboard);
