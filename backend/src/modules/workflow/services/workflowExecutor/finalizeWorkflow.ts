import { randomUUID } from 'crypto';
import { getIOInstance } from '../../../../shared/websocket/io';
import { logger } from '../../../../utils/logger';
import { knowledgeRepository, tasksRepo, reportsRepo, aiRemediationRepository } from '../../../../repositories';
import { executeAgentNode } from '../../../ai/services/agents/agentExecutor';
import { reportService } from '../../../monitor/services/reportService';
import { notificationService } from '../../../notification/services/notificationService';
import { createAuditLog } from '../../../audit/services/auditService';
import type {
  WorkflowNode,
  NodeResult,
  WorkflowParsed,
} from '../../../../types';
import { addTaskLog, isDuplicateKnowledgeBase } from './helpers';

export async function finalizeWorkflow(
  taskId: string,
  workflow: WorkflowParsed,
  nodes: WorkflowNode[],
  nodeResults: Record<string, NodeResult>,
  executionOrder: string[],
  status: 'completed' | 'failed',
  errorMessage?: string
) {
  const io = getIOInstance();

  tasksRepo.finalizeTask(taskId, status, JSON.stringify(nodeResults));

  // 故障案例自动存入知识库
  try {
    const failedNodes = Object.entries(nodeResults)
      .filter(([_, result]) => result.status === 'failed')
      .map(([nodeId, result]) => {
        const node = nodes.find((n) => n.id === nodeId);
        return { ...result, nodeId, node };
      });

    if (failedNodes.length > 0) {
      failedNodes.forEach((nodeResult) => {
        const title = `${workflow.name} - Incident Case`;
        const content = `**Failed Node**: ${nodeResult.node?.data?.label || nodeResult.nodeId}\\n**Error**: ${nodeResult.error}\\n**Analysis Time**: ${new Date().toISOString()}`;

        const duplicateId = isDuplicateKnowledgeBase(content);
        if (duplicateId) {
          logger.info(`ℹ️ Skipped duplicate incident case, similar entry already exists: ${duplicateId}`);
          return;
        }

        knowledgeRepository.createMinimal({
          id: randomUUID(),
          title,
          category: 'Incident Handling',
          content,
        });
      });
      logger.info('✅ Incident case automatically saved to knowledge base');
    }
  } catch (insertError) {
    logger.error('Failed to insert into knowledge_base:', insertError);
  }

  try {
    await generateWorkflowExecutionReport(taskId, workflow, nodes, nodeResults, executionOrder, status, errorMessage);
  } catch (reportError) {
    logger.error('Failed to generate workflow report:', reportError);
  }

  // ── 验证失败时自动回滚 ──
  const verificationNode = nodes.find(n =>
    n.data?.label?.includes('Verification') && n.type === 'agent'
  );
  const verificationFailed = verificationNode &&
    nodeResults[verificationNode.id]?.status === 'failed';

  if (verificationFailed) {
    logger.warn(`⚠️ Verification node "${verificationNode.data.label}" failed, attempting automatic rollback...`);
    const rollbackNode = nodes.find(n =>
      n.data?.label?.includes('Rollback') && n.type === 'agent'
    );

    if (rollbackNode) {
      try {
        addTaskLog(taskId, {
          type: 'output',
          content: '⚠️ Verification failed, executing automatic rollback...',
          nodeId: rollbackNode.id,
        });
        io?.to(`task:${taskId}`).emit('task:node:started', {
          taskId, nodeId: rollbackNode.id, nodeName: rollbackNode.data.label,
        });

        const rollbackOutput = await executeAgentNode(
          rollbackNode.data.agentId || 'server-command-agent',
          rollbackNode.data.prompt || 'Execute Rollback Operation',
          {}
        );

        nodeResults[rollbackNode.id] = {
          status: 'success',
          output: rollbackOutput,
          metadata: { executionTime: Date.now() },
        };

        io?.to(`task:${taskId}`).emit('task:node:output', {
          taskId, nodeId: rollbackNode.id, output: rollbackOutput,
        });
        io?.to(`task:${taskId}`).emit('task:node:completed', {
          taskId, nodeId: rollbackNode.id, status: 'success', output: rollbackOutput,
        });
        addTaskLog(taskId, {
          type: 'output',
          content: `✅ Automatic rollback completed: ${rollbackOutput.substring(0, 200)}`,
          nodeId: rollbackNode.id,
        });

        try {
          const ctxJson = tasksRepo.getContext(taskId);
          const ctx = ctxJson ? JSON.parse(ctxJson) : {};
          if (ctx.remediation_id) {
            aiRemediationRepository.updateStatusFields(
              ctx.remediation_id,
              'failed',
              JSON.stringify({ verification: 'failed', rollback: 'executed', rollback_output: rollbackOutput.substring(0, 500) })
            );
          }
        } catch { /* ai_remediations 表可能不存在 */ }

        logger.info(`✅ Automatic rollback execution completed (task: ${taskId})`);
      } catch (rollbackError) {
        const rollbackErrMsg = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
        nodeResults[rollbackNode.id] = {
          status: 'failed',
          error: rollbackErrMsg,
          metadata: { executionTime: Date.now() },
        };
        addTaskLog(taskId, {
          type: 'error',
          content: `❌ Automatic rollback failed: ${rollbackErrMsg}`,
          nodeId: rollbackNode.id,
        });
        logger.error(`❌ Automatic rollback execution failed: ${rollbackErrMsg}`);

        try {
          const ctxJson = tasksRepo.getContext(taskId);
          const ctx = ctxJson ? JSON.parse(ctxJson) : {};
          if (ctx.remediation_id) {
            aiRemediationRepository.updateStatusFields(
              ctx.remediation_id,
              'failed',
              undefined,
              `Verification failed and rollback failed: ${rollbackErrMsg}`
            );
          }
        } catch { /* ai_remediations 表可能不存在 */ }
      }

      tasksRepo.updateNodeResults(taskId, JSON.stringify(nodeResults));
    }
  }

  // ── 反馈通知 ──
  const successCount = Object.values(nodeResults).filter(r => r.status === 'success').length;
  const failedCount = Object.values(nodeResults).filter(r => r.status === 'failed').length;

  try {
    await notificationService.sendTaskNotification(
      { id: taskId, name: workflow.name, workflow_id: workflow.id },
      status
    );
  } catch (notifyError) {
    logger.warn('⚠️ Failed to send workflow completion notification (non-fatal error):', notifyError);
  }

  if (verificationFailed) {
    try {
      await notificationService.sendNotification({
        type: 'remediation_rollback',
        title: `⚠️ AI repair verification failed and rolled back: ${workflow.name}`,
        content: `**Workflow**: ${workflow.name}\\n**Verification Result**: Failed\\n**Rollback Operation**: Automatically Executed\\n**Task ID**: ${taskId}\\n\\nPlease log in to the system to view details`,
        related_task_id: taskId,
      });
    } catch (notifyError) {
      logger.warn('⚠️ Failed to send rollback notification:', notifyError);
    }
  }

  // ── 审计日志 ──
  createAuditLog({
    action: status === 'completed' ? 'workflow_completed' : 'workflow_failed',
    resource_type: 'task',
    resource_id: taskId,
    details: {
      workflowName: workflow.name,
      workflowId: workflow.id,
      successCount: String(successCount),
      failedCount: String(failedCount),
      verificationFailed: String(!!verificationFailed),
      errorMessage: errorMessage ?? '',
    },
  });

  if (verificationFailed) {
    createAuditLog({
      action: 'remediation_rollback_triggered',
      resource_type: 'task',
      resource_id: taskId,
      details: {
        workflowName: workflow.name,
        reason: 'Verification node execution failed, automatically triggering rollback',
        rollbackResult: nodeResults[nodes.find(n => n.data?.label?.includes('Rollback'))?.id || '']?.status || 'unknown',
      },
    });
  }

  if (status === 'completed') {
    io?.to(`task:${taskId}`).emit('task:completed', { taskId, status: 'completed', nodeResults });
  }
}

export async function generateWorkflowExecutionReport(
  taskId: string,
  workflow: WorkflowParsed,
  nodes: WorkflowNode[],
  nodeResults: Record<string, NodeResult>,
  executionOrder: string[],
  status: 'completed' | 'failed',
  errorMessage?: string
) {
  logger.info('📄 Starting to generate workflow execution report...');

  const templates = reportService.getTemplates();
  let workflowTemplate = templates.find(t => t.name.includes('Workflow Execution Report'));

  if (!workflowTemplate) {
    logger.info('📄 Workflow execution report template not found, creating...');
    workflowTemplate = reportService.createTemplate({
      name: 'Workflow Execution Report',
      description: 'Execution report automatically generated after workflow completion',
      type: 'inspection',
      content: `# Workflow Execution Report\\n\\n## Basic Information\\n- **Workflow Name**: {{workflow_name}}\\n- **Execution Task ID**: {{task_id}}\\n- **Execution Status**: {{execution_status}}\\n- **Start Time**: {{start_time}}\\n- **End Time**: {{end_time}}\\n\\n## Execution Order\\n{{execution_order}}\\n\\n## Node Execution Details\\n{{node_details}}\\n\\n## Execution Summary\\n{{execution_summary}}\\n\\n## Error Section\\n{{error_section}}\\n\\n---\\nReport Generated At: {{generated_time}}`,
      variables: ['workflow_name', 'task_id', 'execution_status', 'start_time', 'end_time', 'execution_order', 'node_details', 'execution_summary', 'error_section', 'generated_time'],
      is_preset: true
    });
    logger.info('✅ Workflow execution report template created successfully:', workflowTemplate.id);
  } else {
    logger.info('✅ Using existing workflow execution report template:', workflowTemplate.id);
  }

  const task = tasksRepo.getStartEndTime(taskId);

  const startTime = task?.start_time ?? undefined;
  const endTime = task?.end_time ?? undefined;

  const executionOrderDesc = executionOrder.map((nodeId, index) => {
    const node = nodes.find(n => n.id === nodeId);
    const nodeResult = nodeResults[nodeId];
    const nodeStatus = nodeResult?.status || 'pending';
    return `${index + 1}. ${node?.data?.label || nodeId} (${nodeStatus})`;
  }).join('\n');

  const nodeDetails = executionOrder.map((nodeId, index) => {
    const node = nodes.find(n => n.id === nodeId);
    const nodeResult = nodeResults[nodeId];

    let detail = `### ${index + 1}. ${node?.data?.label || nodeId}\n`;
    detail += `- **Status**: ${nodeResult?.status || 'pending'}\\n`;

    if (nodeResult?.output) {
      detail += `- **Output**: \\n${nodeResult.output.substring(0, 500)}${nodeResult.output.length > 500 ? '...' : ''}\\n`;
    }

    if (nodeResult?.error) {
      detail += `- **Error**: ${nodeResult.error}\\n`;
    }

    return detail;
  }).join('\n\n');

  const successCount = Object.values(nodeResults).filter((r) => r.status === 'success').length;
  const failedCount = Object.values(nodeResults).filter((r) => r.status === 'failed').length;
  const totalCount = Object.keys(nodeResults).length;

  const executionSummary = `Executed ${totalCount} nodes in total, ${successCount} succeeded, ${failedCount} failed.`;

  let errorSection = '';
  if (status === 'failed' && errorMessage) {
    errorSection = `## Error Message\\n\\n${errorMessage}`;
  }

  const variables: Record<string, string> = {
    workflow_name: workflow.name,
    task_id: taskId,
    execution_status: status === 'completed' ? 'Successfully Completed' : 'Execution Failed',
    start_time: startTime ? new Date(startTime).toLocaleString() : '-',
    end_time: endTime ? new Date(endTime).toLocaleString() : '-',
    execution_order: executionOrderDesc,
    node_details: nodeDetails,
    execution_summary: executionSummary,
    error_section: errorSection,
    generated_time: new Date().toLocaleString()
  };

  try {
    logger.info('📄 Generating report using report service...');
    const generatedReport = reportService.generateReport(workflowTemplate.id, variables, 'markdown');
    logger.info('✅ Report generated via service:', generatedReport.id);

    try {
      logger.info('📄 Inserting report into reports table...');
      reportsRepo.create({
        id: generatedReport.id,
        name: generatedReport.name,
        type: 'generated',
        content: generatedReport.content,
        format: 'markdown',
        task_id: taskId,
        created_at: new Date().toISOString(),
      });

      logger.info('📄 Updating report_id field in tasks table:');
      tasksRepo.updateReportId(taskId, generatedReport.id);

      logger.info('✅ Workflow execution report generated and linked to task:', generatedReport.id);

      const savedReport = reportsRepo.getById(generatedReport.id);
      logger.info('✅ Verification: Report read from database:', savedReport ? 'Exists' : 'Does Not Exist');

    } catch (e) {
      logger.error('❌ Report association failed:', e);
    }
  } catch (generateError) {
    logger.error('❌ Error during report generation:', generateError);
  }
}
