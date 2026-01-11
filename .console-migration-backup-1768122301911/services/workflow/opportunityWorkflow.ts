
import { taskWorkflow } from './taskWorkflow';
import { mockCrmService, mockTasksAPI } from '@/services/mockCrm';
import { formatDateOffset } from './utils';
import { TaskStatus } from '@/types/task';

/**
 * Handle opportunity creation workflow
 * - Create follow-up tasks
 * - Update related entities if needed
 */
export const handleOpportunityCreation = async (opportunity: any) => {
  try {
    // Create a task for the opportunity owner to follow up
    await taskWorkflow.assignOpportunityCreatedTask(
      opportunity.id,
      opportunity.title || opportunity.name,
      opportunity.assigned_to || opportunity.owner_id
    );
    
    return { success: true };
  } catch (error) {
    console.error("Error in opportunity creation workflow:", error);
    return { success: false, error };
  }
};

/**
 * Handle opportunity status change workflow
 * - Create appropriate tasks based on new status
 * - Update related customer or deal records if needed
 */
export const handleOpportunityStatusChange = async (
  opportunityId: string,
  opportunityTitle: string,
  oldStatus: string,
  newStatus: string,
  assigneeId?: string
) => {
  try {
    // Different workflows based on the new status
    switch (newStatus) {
      case 'qualified':
        // Create task to prepare a proposal
        await createProposalTask(opportunityId, opportunityTitle, assigneeId);
        break;
        
      case 'negotiation':
        // Create task to prepare for negotiation
        await createNegotiationTask(opportunityId, opportunityTitle, assigneeId);
        break;
        
      case 'closed_won':
        // Create onboarding tasks
        await createOnboardingTask(opportunityId, opportunityTitle, assigneeId);
        break;
        
      case 'closed_lost':
        // Create task for loss analysis
        await createLossAnalysisTask(opportunityId, opportunityTitle, assigneeId);
        break;
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error in opportunity status change workflow:", error);
    return { success: false, error };
  }
};

// Helper functions to create specific tasks

const createProposalTask = async (opportunityId: string, opportunityTitle: string, assigneeId?: string) => {
  return await mockTasksAPI.createTask({
    title: `Teklif Hazırla: ${opportunityTitle}`,
    description: 'Müşteri fırsatı için teklif hazırlamanız gerekiyor.',
    status: 'todo' as TaskStatus,
    assignee_id: assigneeId,
    due_date: formatDateOffset(2),
    related_item_id: opportunityId,
    related_item_type: 'opportunity',
    related_item_title: opportunityTitle
  });
};

const createNegotiationTask = async (opportunityId: string, opportunityTitle: string, assigneeId?: string) => {
  return await mockTasksAPI.createTask({
    title: `Müzakere Hazırlığı: ${opportunityTitle}`,
    description: 'Müzakere toplantısı için hazırlık yapınız.',
    status: 'todo' as TaskStatus,
    assignee_id: assigneeId,
    due_date: formatDateOffset(1),
    related_item_id: opportunityId,
    related_item_type: 'opportunity',
    related_item_title: opportunityTitle
  });
};

const createOnboardingTask = async (opportunityId: string, opportunityTitle: string, assigneeId?: string) => {
  return await mockTasksAPI.createTask({
    title: `Müşteri Başlangıcı: ${opportunityTitle}`,
    description: 'Yeni müşteri için başlangıç süreçlerini başlatınız.',
    status: 'todo' as TaskStatus,
    assignee_id: assigneeId,
    due_date: formatDateOffset(3),
    related_item_id: opportunityId,
    related_item_type: 'opportunity',
    related_item_title: opportunityTitle
  });
};

const createLossAnalysisTask = async (opportunityId: string, opportunityTitle: string, assigneeId?: string) => {
  return await mockTasksAPI.createTask({
    title: `Kayıp Analizi: ${opportunityTitle}`,
    description: 'Kaybedilen fırsatın neden kaybedildiğini analiz ediniz.',
    status: 'todo' as TaskStatus,
    assignee_id: assigneeId,
    due_date: formatDateOffset(5),
    related_item_id: opportunityId,
    related_item_type: 'opportunity',
    related_item_title: opportunityTitle
  });
};
