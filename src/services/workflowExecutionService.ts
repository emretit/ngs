import { supabase } from '@/integrations/supabase/client';
import { sendMessageToGemini } from './geminiService';
import { logger } from '@/utils/logger';

/**
 * Workflow Step Types
 */
export type WorkflowStepType =
  | 'DataQuery'      // Query database
  | 'AIAnalysis'     // AI analysis of data
  | 'FunctionCall'   // Call a function (create Excel, send email, etc.)
  | 'Approval'       // Wait for user approval
  | 'Notification'   // Send notification
  | 'Condition';     // Conditional branching

/**
 * Workflow Step Definition
 */
export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  name: string;
  config: Record<string, any>;
  next_step_id?: string;
  on_success?: string;  // Next step on success
  on_failure?: string;  // Next step on failure
}

/**
 * Workflow Definition
 */
export interface Workflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  trigger_type: 'manual' | 'scheduled' | 'event';
  trigger_config: Record<string, any>;
  steps: WorkflowStep[];
  is_active: boolean;
  approval_required: boolean;
  permissions: string[];
}

/**
 * Workflow Execution
 */
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  company_id: string;
  triggered_by: string;
  trigger_source: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'awaiting_approval' | 'cancelled';
  current_step_index: number;
  step_results: StepResult[];
  error_log?: string;
  started_at: string;
  completed_at?: string;
}

/**
 * Step Execution Result
 */
export interface StepResult {
  step_id: string;
  step_name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration_ms?: number;
  executed_at?: string;
}

/**
 * Workflow Execution Service
 */
export class WorkflowExecutionService {
  private executionId: string;
  private workflow: Workflow;
  private execution: WorkflowExecution;
  private userId: string;
  private companyId: string;

  constructor(
    executionId: string,
    workflow: Workflow,
    userId: string,
    companyId: string
  ) {
    this.executionId = executionId;
    this.workflow = workflow;
    this.userId = userId;
    this.companyId = companyId;
    this.execution = {
      id: executionId,
      workflow_id: workflow.id,
      company_id: companyId,
      triggered_by: userId,
      trigger_source: 'manual',
      status: 'pending',
      current_step_index: 0,
      step_results: [],
      started_at: new Date().toISOString()
    };
  }

  /**
   * Execute workflow
   */
  async execute(): Promise<WorkflowExecution> {
    try {
      logger.info('Starting workflow execution', {
        executionId: this.executionId,
        workflowId: this.workflow.id,
        workflowName: this.workflow.name
      });

      // Update status to running
      await this.updateExecutionStatus('running');

      // Execute steps sequentially
      for (let i = 0; i < this.workflow.steps.length; i++) {
        const step = this.workflow.steps[i];

        logger.info('Executing workflow step', {
          executionId: this.executionId,
          stepIndex: i,
          stepId: step.id,
          stepType: step.type
        });

        // Update current step
        this.execution.current_step_index = i;
        await this.updateExecutionProgress();

        // Execute step
        const stepResult = await this.executeStep(step);
        this.execution.step_results.push(stepResult);

        // Check if step failed
        if (stepResult.status === 'failed') {
          logger.error('Workflow step failed', {
            executionId: this.executionId,
            stepId: step.id,
            error: stepResult.error
          });

          // If step has on_failure, continue to that step
          if (step.on_failure) {
            const failureStepIndex = this.workflow.steps.findIndex(s => s.id === step.on_failure);
            if (failureStepIndex !== -1) {
              i = failureStepIndex - 1; // -1 because loop will increment
              continue;
            }
          }

          // Otherwise, fail the workflow
          this.execution.status = 'failed';
          this.execution.error_log = stepResult.error;
          this.execution.completed_at = new Date().toISOString();
          await this.updateExecutionProgress();
          return this.execution;
        }

        // Check if step requires approval
        if (step.type === 'Approval') {
          this.execution.status = 'awaiting_approval';
          await this.updateExecutionProgress();

          logger.info('Workflow awaiting approval', {
            executionId: this.executionId,
            stepId: step.id
          });

          // Workflow will be resumed after approval
          return this.execution;
        }

        // Save progress
        await this.updateExecutionProgress();
      }

      // All steps completed
      this.execution.status = 'completed';
      this.execution.completed_at = new Date().toISOString();
      await this.updateExecutionProgress();

      logger.info('Workflow execution completed', {
        executionId: this.executionId,
        duration: Date.now() - new Date(this.execution.started_at).getTime()
      });

      return this.execution;
    } catch (error: any) {
      logger.error('Workflow execution error', {
        executionId: this.executionId,
        error: error.message
      });

      this.execution.status = 'failed';
      this.execution.error_log = error.message;
      this.execution.completed_at = new Date().toISOString();
      await this.updateExecutionProgress();

      throw error;
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: WorkflowStep): Promise<StepResult> {
    const startTime = Date.now();
    const result: StepResult = {
      step_id: step.id,
      step_name: step.name,
      status: 'running',
      executed_at: new Date().toISOString()
    };

    try {
      switch (step.type) {
        case 'DataQuery':
          result.result = await this.executeDataQuery(step);
          break;

        case 'AIAnalysis':
          result.result = await this.executeAIAnalysis(step);
          break;

        case 'FunctionCall':
          result.result = await this.executeFunctionCall(step);
          break;

        case 'Approval':
          result.result = await this.executeApproval(step);
          break;

        case 'Notification':
          result.result = await this.executeNotification(step);
          break;

        case 'Condition':
          result.result = await this.executeCondition(step);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      result.status = 'success';
      result.duration_ms = Date.now() - startTime;
    } catch (error: any) {
      logger.error('Step execution error', {
        executionId: this.executionId,
        stepId: step.id,
        error: error.message
      });

      result.status = 'failed';
      result.error = error.message;
      result.duration_ms = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Execute DataQuery step - Query database
   */
  private async executeDataQuery(step: WorkflowStep): Promise<any> {
    const { table, filters, select, limit = 100 } = step.config;

    if (!table) {
      throw new Error('DataQuery step requires table name');
    }

    let query = supabase
      .from(table)
      .select(select || '*')
      ;

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle operators like {gt: 10}, {gte: 5}, {lt: 20}, etc.
          const [operator, operatorValue] = Object.entries(value)[0];
          query = (query as any)[operator](key, operatorValue);
        } else {
          query = query.eq(key, value);
        }
      });
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`DataQuery failed: ${error.message}`);
    }

    logger.info('DataQuery executed', {
      executionId: this.executionId,
      stepId: step.id,
      table,
      rowCount: data?.length || 0
    });

    return {
      table,
      rowCount: data?.length || 0,
      data
    };
  }

  /**
   * Execute AIAnalysis step - Analyze data with AI
   */
  private async executeAIAnalysis(step: WorkflowStep): Promise<any> {
    const { prompt, previousStepData, aiRole = 'general' } = step.config;

    if (!prompt) {
      throw new Error('AIAnalysis step requires prompt');
    }

    // Get data from previous step if specified
    let dataContext = '';
    if (previousStepData) {
      const prevStepIndex = this.execution.step_results.findIndex(
        r => r.step_id === previousStepData
      );
      if (prevStepIndex !== -1) {
        const prevResult = this.execution.step_results[prevStepIndex];
        if (prevResult.result?.data) {
          dataContext = `\n\nDATA:\n${JSON.stringify(prevResult.result.data, null, 2)}`;
        }
      }
    }

    // Call AI with prompt + data
    const fullPrompt = `${prompt}${dataContext}`;

    const response = await sendMessageToGemini(
      fullPrompt,
      [],
      undefined,
      undefined,
      aiRole
    );

    logger.info('AIAnalysis executed', {
      executionId: this.executionId,
      stepId: step.id,
      responseLength: response.length
    });

    return {
      prompt,
      analysis: response
    };
  }

  /**
   * Execute FunctionCall step - Call a specific function
   */
  private async executeFunctionCall(step: WorkflowStep): Promise<any> {
    const { functionName, parameters } = step.config;

    if (!functionName) {
      throw new Error('FunctionCall step requires functionName');
    }

    logger.info('FunctionCall executed', {
      executionId: this.executionId,
      stepId: step.id,
      functionName
    });

    // TODO: Implement function registry and call the function
    // For now, return a placeholder
    return {
      functionName,
      parameters,
      result: 'Function call placeholder - to be implemented'
    };
  }

  /**
   * Execute Approval step - Create approval request
   */
  private async executeApproval(step: WorkflowStep): Promise<any> {
    const { approverIds, approvalData } = step.config;

    if (!approverIds || approverIds.length === 0) {
      throw new Error('Approval step requires approverIds');
    }

    // Create approval record
    const { data: approval, error } = await supabase
      .from('ai_workflow_approvals')
      .insert({
        execution_id: this.executionId,
        approver_id: approverIds[0], // For now, single approver
        status: 'pending',
        approval_data: approvalData || {}
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Approval creation failed: ${error.message}`);
    }

    logger.info('Approval created', {
      executionId: this.executionId,
      stepId: step.id,
      approvalId: approval.id
    });

    return {
      approvalId: approval.id,
      status: 'pending'
    };
  }

  /**
   * Execute Notification step - Send notification
   */
  private async executeNotification(step: WorkflowStep): Promise<any> {
    const { recipientIds, title, message, type = 'info' } = step.config;

    if (!recipientIds || recipientIds.length === 0) {
      throw new Error('Notification step requires recipientIds');
    }

    logger.info('Notification sent', {
      executionId: this.executionId,
      stepId: step.id,
      recipientCount: recipientIds.length
    });

    // TODO: Implement notification system
    return {
      recipientIds,
      title,
      message,
      type,
      status: 'sent'
    };
  }

  /**
   * Execute Condition step - Conditional branching
   */
  private async executeCondition(step: WorkflowStep): Promise<any> {
    const { condition, previousStepData } = step.config;

    if (!condition) {
      throw new Error('Condition step requires condition expression');
    }

    // Get data from previous step
    let conditionResult = false;
    if (previousStepData) {
      const prevStepIndex = this.execution.step_results.findIndex(
        r => r.step_id === previousStepData
      );
      if (prevStepIndex !== -1) {
        const prevResult = this.execution.step_results[prevStepIndex];
        // TODO: Evaluate condition against prevResult.result
        // For now, return false
        conditionResult = false;
      }
    }

    logger.info('Condition evaluated', {
      executionId: this.executionId,
      stepId: step.id,
      result: conditionResult
    });

    return {
      condition,
      result: conditionResult
    };
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(
    status: WorkflowExecution['status']
  ): Promise<void> {
    this.execution.status = status;
    await this.updateExecutionProgress();
  }

  /**
   * Update execution progress in database
   */
  private async updateExecutionProgress(): Promise<void> {
    const { error } = await supabase
      .from('ai_workflow_executions')
      .update({
        status: this.execution.status,
        current_step_index: this.execution.current_step_index,
        step_results: this.execution.step_results,
        error_log: this.execution.error_log,
        completed_at: this.execution.completed_at
      })
      .eq('id', this.executionId);

    if (error) {
      logger.error('Failed to update execution progress', {
        executionId: this.executionId,
        error: error.message
      });
    }
  }
}

/**
 * Start a workflow execution
 */
export async function startWorkflowExecution(
  workflowId: string,
  userId: string,
  companyId: string,
  triggerSource: string = 'manual'
): Promise<WorkflowExecution> {
  // Fetch workflow
  const { data: workflow, error: workflowError } = await supabase
    .from('ai_workflows')
    .select('*')
    .eq('id', workflowId)
    
    .eq('is_active', true)
    .single();

  if (workflowError || !workflow) {
    throw new Error('Workflow not found or inactive');
  }

  // Create execution record
  const { data: execution, error: executionError } = await supabase
    .from('ai_workflow_executions')
    .insert({
      workflow_id: workflowId,
      company_id: companyId,
      triggered_by: userId,
      trigger_source: triggerSource,
      status: 'pending',
      current_step_index: 0,
      step_results: []
    })
    .select()
    .single();

  if (executionError || !execution) {
    throw new Error('Failed to create execution record');
  }

  // Start execution
  const service = new WorkflowExecutionService(
    execution.id,
    workflow as Workflow,
    userId,
    companyId
  );

  return await service.execute();
}

/**
 * Resume a workflow execution after approval
 */
export async function resumeWorkflowExecution(
  executionId: string,
  userId: string,
  companyId: string
): Promise<WorkflowExecution> {
  // Fetch execution
  const { data: execution, error: executionError } = await supabase
    .from('ai_workflow_executions')
    .select('*, ai_workflows(*)')
    .eq('id', executionId)
    
    .single();

  if (executionError || !execution) {
    throw new Error('Execution not found');
  }

  // Fetch workflow
  const workflow = (execution as any).ai_workflows as Workflow;

  // Resume from current step
  const service = new WorkflowExecutionService(
    executionId,
    workflow,
    userId,
    companyId
  );

  service['execution'] = execution as WorkflowExecution;

  return await service.execute();
}
