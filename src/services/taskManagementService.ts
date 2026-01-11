import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  company_id: string;
  user_id: string;
  conversation_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: Date;
  assigned_to?: string;
  completed_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface TaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: Date;
  assigned_to?: string;
  metadata?: Record<string, any>;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to?: string;
  due_before?: Date;
  due_after?: Date;
}

/**
 * Get current user's company_id
 */
const getCurrentCompanyId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    return profile?.company_id || null;
  } catch {
    return null;
  }
};

/**
 * Create a new task
 */
export const createTask = async (input: TaskInput, conversationId?: string): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Şirket bilgisi bulunamadı');

  const taskData = {
    company_id: companyId,
    user_id: user.id,
    conversation_id: conversationId,
    title: input.title,
    description: input.description,
    priority: input.priority || 'medium',
    due_date: input.due_date?.toISOString(),
    assigned_to: input.assigned_to,
    status: 'pending' as TaskStatus,
    metadata: input.metadata || {}
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) {
    logger.error('Task creation error:', error);
    throw new Error(`Görev oluşturulamadı: ${error.message}`);
  }

  return data as Task;
};

/**
 * List tasks with optional filters
 */
export const listTasks = async (filters: TaskFilters = {}): Promise<Task[]> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Şirket bilgisi bulunamadı');

  let query = supabase
    .from('tasks')
    .select('*')
    ;

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.priority && filters.priority.length > 0) {
    query = query.in('priority', filters.priority);
  }

  if (filters.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }

  if (filters.due_before) {
    query = query.lte('due_date', filters.due_before.toISOString());
  }

  if (filters.due_after) {
    query = query.gte('due_date', filters.due_after.toISOString());
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    logger.error('Task list error:', error);
    throw new Error(`Görevler yüklenemedi: ${error.message}`);
  }

  return (data || []) as Task[];
};

/**
 * Get a single task by ID
 */
export const getTask = async (taskId: string): Promise<Task | null> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Şirket bilgisi bulunamadı');

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    
    .single();

  if (error) {
    logger.error('Task get error:', error);
    return null;
  }

  return data as Task;
};

/**
 * Update task status
 */
export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus
): Promise<Task> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Şirket bilgisi bulunamadı');

  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    
    .select()
    .single();

  if (error) {
    logger.error('Task status update error:', error);
    throw new Error(`Görev durumu güncellenemedi: ${error.message}`);
  }

  return data as Task;
};

/**
 * Update entire task
 */
export const updateTask = async (
  taskId: string,
  updates: Partial<TaskInput>
): Promise<Task> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Şirket bilgisi bulunamadı');

  const updateData: any = {};
  
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.due_date !== undefined) updateData.due_date = updates.due_date?.toISOString();
  if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to;
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    
    .select()
    .single();

  if (error) {
    logger.error('Task update error:', error);
    throw new Error(`Görev güncellenemedi: ${error.message}`);
  }

  return data as Task;
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Şirket bilgisi bulunamadı');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    
    .eq('user_id', user.id);

  if (error) {
    logger.error('Task delete error:', error);
    throw new Error(`Görev silinemedi: ${error.message}`);
  }

  return true;
};

/**
 * Get task statistics
 */
export const getTaskStatistics = async (): Promise<{
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}> => {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('Şirket bilgisi bulunamadı');

  const { data, error } = await supabase
    .from('tasks')
    .select('status, due_date')
    ;

  if (error) {
    logger.error('Task statistics error:', error);
    return { total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 };
  }

  const now = new Date();
  const stats = {
    total: data.length,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0
  };

  data.forEach(task => {
    if (task.status === 'pending') stats.pending++;
    if (task.status === 'in_progress') stats.in_progress++;
    if (task.status === 'completed') stats.completed++;
    
    if (task.due_date && new Date(task.due_date) < now && task.status !== 'completed') {
      stats.overdue++;
    }
  });

  return stats;
};

