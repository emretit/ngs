
import { formatDateOffset } from './utils';
import { logger } from '@/utils/logger';
import { mockCrmService, mockTasksAPI } from '@/services/mockCrm';
import { TaskStatus } from '@/types/task';

interface AssignTaskParams {
  title: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: string;
  related_item_id?: string;
  related_item_type?: string;
  related_item_title?: string;
}

export const taskWorkflow = {
  /**
   * Create a new follow-up task
   */
  createFollowUpTask: async (params: AssignTaskParams) => {
    try {
      const task = {
        title: params.title,
        description: params.description || 'Takip gerekli',
        status: 'todo' as TaskStatus,
        assignee_id: params.assigned_to,
        due_date: params.due_date || formatDateOffset(3),
        related_item_id: params.related_item_id,
        related_item_type: params.related_item_type,
        related_item_title: params.related_item_title
      };
      
      // Create the task
      const { error } = await mockTasksAPI.createTask(task);
      
      if (error) {
        logger.error("Error creating follow-up task:", error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      logger.error("Error in createFollowUpTask:", error);
      return { success: false, error };
    }
  },
  
  /**
   * Assign a task to a user when a new opportunity is created
   */
  assignOpportunityCreatedTask: async (opportunityId: string, opportunityTitle: string, assigneeId?: string) => {
    try {
      const task = {
        title: `İnceleme: ${opportunityTitle}`,
        description: 'Yeni oluşturulan fırsatı inceleyiniz.',
        status: 'todo' as TaskStatus,
        assignee_id: assigneeId,
        due_date: formatDateOffset(1),
        related_item_id: opportunityId,
        related_item_type: 'opportunity',
        related_item_title: opportunityTitle
      };
      
      const { error } = await mockTasksAPI.createTask(task);
      
      if (error) {
        logger.error("Error creating opportunity task:", error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      logger.error("Error in assignOpportunityCreatedTask:", error);
      return { success: false, error };
    }
  }
};
