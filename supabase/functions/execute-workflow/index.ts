import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  next_step_id?: string;
  on_success?: string;
  on_failure?: string;
}

interface Workflow {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  steps: WorkflowStep[];
  is_active: boolean;
  approval_required: boolean;
  permissions: string[];
}

interface StepResult {
  step_id: string;
  step_name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  duration_ms?: number;
  executed_at?: string;
}

/**
 * Execute a workflow step
 */
async function executeStep(
  step: WorkflowStep,
  executionId: string,
  companyId: string,
  supabase: any,
  previousResults: StepResult[]
): Promise<StepResult> {
  const startTime = Date.now();
  const result: StepResult = {
    step_id: step.id,
    step_name: step.name,
    status: 'running',
    executed_at: new Date().toISOString()
  };

  try {
    console.log(`Executing step: ${step.type} - ${step.name}`);

    switch (step.type) {
      case 'DataQuery':
        result.result = await executeDataQuery(step, companyId, supabase);
        break;

      case 'AIAnalysis':
        result.result = await executeAIAnalysis(step, previousResults);
        break;

      case 'FunctionCall':
        result.result = await executeFunctionCall(step, companyId, supabase);
        break;

      case 'Approval':
        result.result = await executeApproval(step, executionId, supabase);
        break;

      case 'Notification':
        result.result = await executeNotification(step, companyId, supabase);
        break;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }

    result.status = 'success';
    result.duration_ms = Date.now() - startTime;
    console.log(`Step completed: ${step.name} in ${result.duration_ms}ms`);
  } catch (error: any) {
    console.error(`Step failed: ${step.name}`, error);
    result.status = 'failed';
    result.error = error.message;
    result.duration_ms = Date.now() - startTime;
  }

  return result;
}

/**
 * Execute DataQuery step
 */
async function executeDataQuery(
  step: WorkflowStep,
  companyId: string,
  supabase: any
): Promise<any> {
  const { table, filters, select, limit = 100, orderBy } = step.config;

  if (!table) {
    throw new Error('DataQuery requires table name');
  }

  let query = supabase
    .from(table)
    .select(select || '*')
    .eq('company_id', companyId);

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]: [string, any]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle operators: {gt: 10}, {gte: 5}, {lt: 20}, {lte: 15}
        const [operator, operatorValue] = Object.entries(value)[0];
        switch (operator) {
          case 'gt':
            query = query.gt(key, operatorValue);
            break;
          case 'gte':
            query = query.gte(key, operatorValue);
            break;
          case 'lt':
            query = query.lt(key, operatorValue);
            break;
          case 'lte':
            query = query.lte(key, operatorValue);
            break;
          case 'eq':
            query = query.eq(key, operatorValue);
            break;
          case 'neq':
            query = query.neq(key, operatorValue);
            break;
          case 'like':
            query = query.like(key, operatorValue);
            break;
          case 'ilike':
            query = query.ilike(key, operatorValue);
            break;
          case 'is':
            query = query.is(key, operatorValue);
            break;
          case 'in':
            query = query.in(key, operatorValue);
            break;
        }
      } else {
        query = query.eq(key, value);
      }
    });
  }

  // Order by
  if (orderBy) {
    const { column, ascending = true } = orderBy;
    query = query.order(column, { ascending });
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    throw new Error(`DataQuery failed: ${error.message}`);
  }

  console.log(`DataQuery: ${table} returned ${data?.length || 0} rows`);

  return {
    table,
    rowCount: data?.length || 0,
    data
  };
}

/**
 * Execute AIAnalysis step
 */
async function executeAIAnalysis(
  step: WorkflowStep,
  previousResults: StepResult[]
): Promise<any> {
  const { prompt, previousStepData } = step.config;

  if (!prompt) {
    throw new Error('AIAnalysis requires prompt');
  }

  // Get data from previous step
  let dataContext = '';
  if (previousStepData) {
    const prevResult = previousResults.find(r => r.step_id === previousStepData);
    if (prevResult?.result?.data) {
      dataContext = `\n\nDATA:\n${JSON.stringify(prevResult.result.data, null, 2)}`;
    }
  }

  const fullPrompt = `${prompt}${dataContext}`;

  // TODO: Call Gemini API directly here
  // For now, return a placeholder
  console.log('AIAnalysis: Analyzing data...');

  return {
    prompt,
    analysis: 'AI Analysis placeholder - integrate with Gemini API'
  };
}

/**
 * Execute FunctionCall step
 */
async function executeFunctionCall(
  step: WorkflowStep,
  companyId: string,
  supabase: any
): Promise<any> {
  const { functionName, parameters } = step.config;

  if (!functionName) {
    throw new Error('FunctionCall requires functionName');
  }

  console.log(`FunctionCall: ${functionName}`);

  // Built-in functions
  switch (functionName) {
    case 'create_excel':
      return await createExcelReport(parameters, supabase);

    case 'send_email':
      return await sendEmailNotification(parameters);

    case 'create_purchase_order':
      return await createPurchaseOrder(parameters, companyId, supabase);

    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

/**
 * Execute Approval step
 */
async function executeApproval(
  step: WorkflowStep,
  executionId: string,
  supabase: any
): Promise<any> {
  const { approverIds, approvalData } = step.config;

  if (!approverIds || approverIds.length === 0) {
    throw new Error('Approval requires approverIds');
  }

  // Create approval record
  const { data: approval, error } = await supabase
    .from('ai_workflow_approvals')
    .insert({
      execution_id: executionId,
      approver_id: approverIds[0],
      status: 'pending',
      approval_data: approvalData || {}
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Approval creation failed: ${error.message}`);
  }

  console.log(`Approval created: ${approval.id}`);

  return {
    approvalId: approval.id,
    status: 'pending'
  };
}

/**
 * Execute Notification step
 */
async function executeNotification(
  step: WorkflowStep,
  companyId: string,
  supabase: any
): Promise<any> {
  const { recipientIds, title, message, type = 'info' } = step.config;

  if (!recipientIds || recipientIds.length === 0) {
    throw new Error('Notification requires recipientIds');
  }

  console.log(`Notification sent to ${recipientIds.length} recipients`);

  // TODO: Integrate with notification system
  return {
    recipientIds,
    title,
    message,
    type,
    status: 'sent'
  };
}

/**
 * Built-in function: Create Excel Report
 */
async function createExcelReport(
  parameters: any,
  supabase: any
): Promise<any> {
  console.log('Creating Excel report...');
  // TODO: Implement Excel generation
  return {
    filename: 'report.xlsx',
    status: 'generated'
  };
}

/**
 * Built-in function: Send Email
 */
async function sendEmailNotification(parameters: any): Promise<any> {
  console.log('Sending email...');
  // TODO: Implement email sending
  return {
    status: 'sent',
    recipient: parameters.to
  };
}

/**
 * Built-in function: Create Purchase Order
 */
async function createPurchaseOrder(
  parameters: any,
  companyId: string,
  supabase: any
): Promise<any> {
  console.log('Creating purchase order...');

  const { supplierId, items, notes } = parameters;

  if (!supplierId || !items || items.length === 0) {
    throw new Error('Purchase order requires supplierId and items');
  }

  // TODO: Implement PO creation
  return {
    status: 'draft',
    orderId: 'PO-' + Date.now()
  };
}

/**
 * Execute a complete workflow
 */
async function executeWorkflow(
  workflow: Workflow,
  executionId: string,
  supabase: any
): Promise<any> {
  console.log(`Starting workflow execution: ${workflow.name}`);

  const stepResults: StepResult[] = [];
  let currentStepIndex = 0;

  // Update execution status to running
  await supabase
    .from('ai_workflow_executions')
    .update({
      status: 'running',
      current_step_index: 0
    })
    .eq('id', executionId);

  try {
    // Execute steps sequentially
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      currentStepIndex = i;

      console.log(`Executing step ${i + 1}/${workflow.steps.length}: ${step.name}`);

      // Execute step
      const stepResult = await executeStep(
        step,
        executionId,
        workflow.company_id,
        supabase,
        stepResults
      );

      stepResults.push(stepResult);

      // Update progress
      await supabase
        .from('ai_workflow_executions')
        .update({
          current_step_index: i,
          step_results: stepResults
        })
        .eq('id', executionId);

      // Check if step failed
      if (stepResult.status === 'failed') {
        console.error(`Step failed: ${step.name}`);

        // If step has on_failure, continue to that step
        if (step.on_failure) {
          const failureStepIndex = workflow.steps.findIndex(s => s.id === step.on_failure);
          if (failureStepIndex !== -1) {
            i = failureStepIndex - 1; // -1 because loop will increment
            continue;
          }
        }

        // Otherwise, fail the workflow
        throw new Error(`Workflow failed at step: ${step.name} - ${stepResult.error}`);
      }

      // Check if approval is required
      if (step.type === 'Approval') {
        console.log('Workflow awaiting approval');

        await supabase
          .from('ai_workflow_executions')
          .update({
            status: 'awaiting_approval',
            current_step_index: i,
            step_results: stepResults
          })
          .eq('id', executionId);

        return {
          status: 'awaiting_approval',
          message: 'Workflow is awaiting approval',
          executionId
        };
      }
    }

    // All steps completed
    console.log('Workflow completed successfully');

    await supabase
      .from('ai_workflow_executions')
      .update({
        status: 'completed',
        current_step_index: currentStepIndex,
        step_results: stepResults,
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);

    return {
      status: 'completed',
      message: 'Workflow completed successfully',
      executionId,
      results: stepResults
    };
  } catch (error: any) {
    console.error('Workflow execution error:', error);

    await supabase
      .from('ai_workflow_executions')
      .update({
        status: 'failed',
        error_log: error.message,
        step_results: stepResults,
        completed_at: new Date().toISOString()
      })
      .eq('id', executionId);

    throw error;
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { job_type, workflow_id, execution_id } = body;

    console.log('Execute-workflow function called', { job_type, workflow_id, execution_id });

    // Handle different job types
    if (job_type === 'scheduled') {
      // Find and execute scheduled workflows
      const { data: workflows, error } = await supabase
        .from('ai_workflows')
        .select('*')
        .eq('trigger_type', 'scheduled')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      console.log(`Found ${workflows?.length || 0} scheduled workflows`);

      // Execute each workflow
      const results = [];
      for (const workflow of workflows || []) {
        try {
          // Check if workflow should run (based on cron)
          // TODO: Implement cron schedule checking

          // Create execution
          const { data: execution, error: execError } = await supabase
            .from('ai_workflow_executions')
            .insert({
              workflow_id: workflow.id,
              company_id: workflow.company_id,
              triggered_by: workflow.created_by,
              trigger_source: 'scheduled',
              status: 'pending'
            })
            .select()
            .single();

          if (execError) {
            console.error('Failed to create execution:', execError);
            continue;
          }

          // Execute workflow
          const result = await executeWorkflow(workflow, execution.id, supabase);
          results.push(result);
        } catch (error: any) {
          console.error(`Workflow execution failed: ${workflow.name}`, error);
          results.push({
            workflow_id: workflow.id,
            status: 'failed',
            error: error.message
          });
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (job_type === 'manual' && workflow_id) {
      // Manual workflow execution
      const { data: workflow, error: workflowError } = await supabase
        .from('ai_workflows')
        .select('*')
        .eq('id', workflow_id)
        .eq('is_active', true)
        .single();

      if (workflowError || !workflow) {
        throw new Error('Workflow not found or inactive');
      }

      // Get auth token for user context
      const authHeader = req.headers.get('Authorization');
      let userId = workflow.created_by;

      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      }

      // Create execution
      const { data: execution, error: execError } = await supabase
        .from('ai_workflow_executions')
        .insert({
          workflow_id: workflow_id,
          company_id: workflow.company_id,
          triggered_by: userId,
          trigger_source: 'manual',
          status: 'pending'
        })
        .select()
        .single();

      if (execError || !execution) {
        throw new Error('Failed to create execution');
      }

      // Execute workflow
      const result = await executeWorkflow(workflow, execution.id, supabase);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (job_type === 'resume' && execution_id) {
      // Resume workflow after approval
      const { data: execution, error: execError } = await supabase
        .from('ai_workflow_executions')
        .select('*, ai_workflows(*)')
        .eq('id', execution_id)
        .eq('status', 'awaiting_approval')
        .single();

      if (execError || !execution) {
        throw new Error('Execution not found or not awaiting approval');
      }

      const workflow = (execution as any).ai_workflows;

      // Resume workflow from current step
      const result = await executeWorkflow(workflow, execution_id, supabase);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Invalid job_type or missing parameters');
    }
  } catch (error: any) {
    console.error('Execute-workflow error:', error);

    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
