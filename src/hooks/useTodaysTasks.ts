import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { format, startOfDay, endOfDay } from "date-fns";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueTime?: string;
  isCompleted: boolean;
  isImportant: boolean;
  assignee?: string;
  relatedTo?: {
    type: 'opportunity' | 'proposal' | 'order' | 'customer';
    title: string;
  };
  type: 'call' | 'meeting' | 'follow_up' | 'task' | 'reminder';
}

export function useTodaysTasks() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();

  const today = new Date();
  const todayStart = startOfDay(today).toISOString();
  const todayEnd = endOfDay(today).toISOString();

  const tasksQuery = useQuery({
    queryKey: ["todays-tasks", companyId, format(today, 'yyyy-MM-dd')],
    queryFn: async (): Promise<Task[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("activities")
        .select(`
          id,
          title,
          description,
          due_date,
          status,
          priority,
          type,
          is_important,
          assignee_id,
          related_item_type,
          related_item_title,
          opportunity_id
        `)
        
        .gte("due_date", todayStart)
        .lte("due_date", todayEnd)
        .order("due_date", { ascending: true })
        .limit(20);

      if (error) {
        logger.error("Error fetching today's tasks:", error);
        return [];
      }

      return (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        dueTime: task.due_date ? format(new Date(task.due_date), 'HH:mm') : undefined,
        isCompleted: task.status === 'completed',
        isImportant: task.is_important || task.priority === 'high',
        type: mapTaskType(task.type),
        relatedTo: task.related_item_title ? {
          type: mapRelatedType(task.related_item_type),
          title: task.related_item_title
        } : undefined
      }));
    },
    enabled: !!companyId,
    staleTime: 30000
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasksQuery.data?.find(t => t.id === taskId);
      const newStatus = task?.isCompleted ? 'todo' : 'completed';
      
      const { error } = await supabase
        .from("activities")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todays-tasks"] });
    }
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    completeTask: (taskId: string) => completeTaskMutation.mutate(taskId)
  };
}

function mapTaskType(type: string): 'call' | 'meeting' | 'follow_up' | 'task' | 'reminder' {
  switch (type) {
    case 'call': return 'call';
    case 'meeting': return 'meeting';
    case 'follow_up': return 'follow_up';
    case 'reminder': return 'reminder';
    default: return 'task';
  }
}

function mapRelatedType(type: string | null): 'opportunity' | 'proposal' | 'order' | 'customer' {
  switch (type) {
    case 'opportunity': return 'opportunity';
    case 'proposal': return 'proposal';
    case 'order': return 'order';
    default: return 'customer';
  }
}
