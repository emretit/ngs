import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskWithOverdue, TaskBoard, TaskFilters, TaskStatus } from '@/types/task';
import { toast } from 'sonner';

const addIsOverdueProp = (tasks: Task[]): TaskWithOverdue[] => {
  return tasks.map(task => ({
    ...task,
    isOverdue: task.due_date ? new Date(task.due_date) < new Date() && task.status !== 'completed' : false
  }));
};

export const useTaskBoard = (filters?: TaskFilters) => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch tasks with type = 'task'
  const { data: tasks = [], error, isLoading: queryLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select(`
          *,
          assignee:employees!assignee_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('type', 'task')
        .order('order_rank', { ascending: true })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.assigneeId && filters.assigneeId.length > 0) {
        query = query.in('assignee_id', filters.assigneeId);
      }

      if (filters?.dueDateRange) {
        query = query
          .gte('due_date', filters.dueDateRange.start.toISOString())
          .lte('due_date', filters.dueDateRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    }
  });

  // Group tasks by status
  const taskBoard: TaskBoard = {
    todo: addIsOverdueProp(tasks.filter(task => task.status === 'todo')),
    in_progress: addIsOverdueProp(tasks.filter(task => task.status === 'in_progress')),
    completed: addIsOverdueProp(tasks.filter(task => task.status === 'completed')),
    postponed: addIsOverdueProp(tasks.filter(task => task.status === 'postponed'))
  };

  // Update task status and order
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status, orderRank }: { id: string; status: TaskStatus; orderRank?: string }) => {
      const updateData: any = { status, updated_at: new Date().toISOString() };
      if (orderRank) {
        updateData.order_rank = orderRank;
      }

      const { data, error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Görev güncellendi');
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error('Görev güncellenemedi');
    }
  });

  // Create new task
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: Partial<Task>) => {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          ...taskData,
          type: 'task',
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Yeni görev oluşturuldu');
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error('Görev oluşturulamadı');
    }
  });

  // Generate order rank between two items
  const generateOrderRank = (beforeRank?: string, afterRank?: string): string => {
    if (!beforeRank && !afterRank) return 'a0';
    if (!beforeRank) return afterRank!.substring(0, 1) + '0';
    if (!afterRank) return beforeRank + '0';
    
    // Simple fractional ranking
    const beforeVal = beforeRank.charCodeAt(0);
    const afterVal = afterRank.charCodeAt(0);
    const midVal = Math.floor((beforeVal + afterVal) / 2);
    return String.fromCharCode(midVal) + '0';
  };

  // Update task order within same status
  const reorderTask = (taskId: string, newIndex: number, status: TaskStatus) => {
    const columnTasks = taskBoard[status];
    const beforeTask = columnTasks[newIndex - 1];
    const afterTask = columnTasks[newIndex];
    
    const newOrderRank = generateOrderRank(beforeTask?.order_rank, afterTask?.order_rank);
    
    updateTaskMutation.mutate({
      id: taskId,
      status,
      orderRank: newOrderRank
    });
  };

  // Move task to different status
  const moveTask = (taskId: string, newStatus: TaskStatus, newIndex?: number) => {
    const newColumnTasks = taskBoard[newStatus];
    const beforeTask = newIndex !== undefined ? newColumnTasks[newIndex - 1] : undefined;
    const afterTask = newIndex !== undefined ? newColumnTasks[newIndex] : undefined;
    
    const newOrderRank = generateOrderRank(beforeTask?.order_rank, afterTask?.order_rank);
    
    updateTaskMutation.mutate({
      id: taskId,
      status: newStatus,
      orderRank: newOrderRank
    });
  };

  // Set up realtime subscription
  useEffect(() => {
    const subscription = supabase
      .channel('task-board-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: 'type=eq.task'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return {
    taskBoard,
    isLoading: queryLoading || isLoading,
    error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    reorderTask,
    moveTask,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending
  };
};