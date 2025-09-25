
import { supabase } from '@/integrations/supabase/client';
import { Task, SubTask } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

// Task service
export const mockCrmTasksService = {
  getTasks: async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id (id, first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as unknown as Task[], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  getTaskById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assignee_id (id, first_name, last_name, avatar_url),
          subtasks (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Convert subtasks to proper format if they exist
      const taskWithSubtasks = {
        ...data,
        subtasks: Array.isArray(data.subtasks) ? data.subtasks as unknown as SubTask[] : []
      } as unknown as Task;
      
      return { data: taskWithSubtasks, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// Task API for CRUD operations
export const mockTasksAPI = {
  createTask: async (taskData: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          id: uuidv4(),
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          type: taskData.type,
          assignee_id: taskData.assignee_id,
          due_date: taskData.due_date,
          related_item_id: taskData.related_item_id,
          related_item_type: taskData.related_item_type,
          related_item_title: taskData.related_item_title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as unknown as Task, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
  
  updateTask: async (id: string, updateData: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as unknown as Task, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};
