
// @ts-nocheck
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

const TasksSummary = () => {
  const { data: taskStats, isLoading } = useQuery({
    queryKey: ["task-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: totalTasks, error: totalError } = await supabase
        .from("activities")
        .select("status", { count: "exact" });
        
      const { data: overdueTasks, error: overdueError } = await supabase
        .from("activities")
        .select("id")
        .lt("due_date", today.toISOString())
        .neq("status", "completed");
      
      if (totalError || overdueError) {
        console.error("Error fetching task stats:", totalError || overdueError);
        throw totalError || overdueError;
      }
      
      return {
        total: totalTasks?.length || 0,
        overdue: overdueTasks?.length || 0,
        completed: totalTasks?.filter(t => t.status === "completed")?.length || 0,
        inProgress: totalTasks?.filter(t => t.status === "in_progress")?.length || 0,
        todo: totalTasks?.filter(t => t.status === "todo")?.length || 0,
      };
    }
  });
  
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Toplam:</span>
        <span className="font-medium">{taskStats?.total || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Tamamlanan:</span>
        <span className="text-green-600 font-medium">{taskStats?.completed || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Devam Eden:</span>
        <span className="text-blue-600 font-medium">{taskStats?.inProgress || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Yapılacak:</span>
        <span className="text-yellow-600 font-medium">{taskStats?.todo || 0}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Geciken:</span>
        <span className="text-red-600 font-medium">{taskStats?.overdue || 0}</span>
      </div>
    </div>
  );
};

export default TasksSummary;
