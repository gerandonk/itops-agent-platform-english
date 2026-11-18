import { randomUUID } from 'crypto';
import { getIOInstance } from '../../../../shared/websocket/io';
import { logger } from '../../../../utils/logger';
import { approvalsRepo, tasksRepo } from '../../../../repositories';
import { executeAgentNode, getThinkingSteps } from '../../../ai/services/agents/agentExecutor';
import { notificationService } from '../../../notification/services/notificationService';
import { addTaskLog, delay } from './helpers';
import type { NodeHandlerCtx, NodeHandlerResult, PersistedExecutionState } from './types';

// ---------------------------------------------------------------------------
// approval 节点：暂停工作流等待人工审批
// ---------------------------------------------------------------------------
export async function handleApprovalNode(ctx: NodeHandlerCtx): Promise<NodeHandlerResult> {
  const { taskId, nodeId, node, workflow, nodeResults, executionContext, initialInput, index, executionOrder, nodes, edges } = ctx;
  const io = getIOInstance();

  logger.info(`🛑 Approval node ${nodeId} (${node.data.label}) reached, pausing workflow`);

  const approvalConfig = node.data.approvalConfig || {
    description: node.data.label,
    timeout: 3600,
    timeoutAction: 'reject' as const,
    approvers: ['admin']
  };

  const approvalId = randomUUID();
  const timeoutAt = approvalConfig.timeout > 0
    ? new Date(Date.now() + approvalConfig.timeout * 1000).toISOString()
    : null;

  approvalsRepo.create({
    id: approvalId,
    task_id: taskId,
    node_id: nodeId,
    node_label: node.data.label,
    description: approvalConfig.description,
    timeout_at: timeoutAt,
    timeout_action: approvalConfig.timeoutAction,
  });

  const persistedState: PersistedExecutionState = {
    workflowId: workflow.id,
    workflowName: workflow.name,
    initialInput,
    executionOrder,
    nodes,
    edges,
    nodeResults: { ...nodeResults },
    executionContext: {
      ...executionContext,
      previousResults: [...executionContext.previousResults],
      metadata: { ...executionContext.metadata }
    },
    pausedAtIndex: index
  };
  tasksRepo.updateStatusWithNodeContext(taskId, 'waiting_approval', nodeId, JSON.stringify(persistedState));

  io?.to(`task:${taskId}`).emit('task:node:started', { nodeId, nodeName: node.data.label });
  io?.to(`task:${taskId}`).emit('task:approval:requested', {
    taskId, approvalId, nodeId,
    nodeLabel: node.data.label,
    description: approvalConfig.description,
    timeout: approvalConfig.timeout,
    timeoutAt
  });
  io?.emit('approval:new', {
    approvalId, taskId,
    nodeLabel: node.data.label,
    description: approvalConfig.description
  });

  addTaskLog(taskId, { type: 'output', content: `⏸️ Waiting for Approval: ${node.data.label} — ${approvalConfig.description}`, nodeId });

  try {
    await notificationService.sendNotification({
      type: 'approval_request',
      title: `⏸️ Workflow Approval Request: ${node.data.label}`,
      content: `**Workflow**: ${workflow.name}\\n**Node**: ${node.data.label}\\n**Description**: ${approvalConfig.description}\\n**Timeout**: ${approvalConfig.timeout}s\\n**Task ID**: ${taskId}\\n**Approval ID**: ${approvalId}\\n\\nPlease log in to the system and go to the Approval Center to process`,
      related_task_id: taskId,
    });
    logger.info('✅ Approval notification sent');
  } catch (notifyError) {
    logger.warn('⚠️ Failed to send approval notification (non-fatal error):', notifyError);
  }

  logger.info(`✅ Approval request ${approvalId} created for task ${taskId}`);
  return 'paused';
}

// ---------------------------------------------------------------------------
// agent 节点：调用 AI Agent 执行任务
// ---------------------------------------------------------------------------
export async function handleAgentNode(ctx: NodeHandlerCtx): Promise<NodeHandlerResult> {
  const { taskId, nodeId, node, nodeResults, executionContext, initialInput, executionDepth } = ctx;
  const io = getIOInstance();

  logger.info(`🤖 Processing node ${nodeId}:`, node.data);

  io?.to(`task:${taskId}`).emit('task:node:started', {
    nodeId,
    nodeName: node.data.label
  });

  try {
    const previousResults = Object.values(nodeResults).map((r) => r.output).filter(Boolean).join('\n\n');
    let input = previousResults || initialInput || 'Please start executing the task';

    // 将 context 中的告警/任务数据注入到 Agent 的输入中
    const contextEntries = Object.entries(executionContext.variables || {})
      .filter(([_, v]) => v !== undefined && v !== null && v !== '');
    if (contextEntries.length > 0) {
      const contextStr = contextEntries
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      input = `[Context Information]\\n${contextStr}\\n\\n[Task]\\n${input}`;
    }

    executionContext.metadata.currentNodeId = nodeId;
    executionContext.metadata.executionDepth = executionDepth;
    executionContext.previousResults.push({
      nodeId,
      status: 'running',
      output: undefined,
      error: undefined
    });

    const thinkingProcess = getThinkingSteps(node.data.label);
    for (const step of thinkingProcess) {
      await delay(300);
      io?.to(`task:${taskId}`).emit('task:node:thinking', {
        taskId,
        nodeId,
        content: step
      });
      addTaskLog(taskId, { type: 'thinking', content: step, nodeId });
    }

    logger.info(`🤖 Calling executeAgentNode with agentId: ${node.data.agentId} context:`, executionContext.variables);

    if (!node.data.agentId) {
      throw new Error(`Node ${nodeId} is missing agentId`);
    }

    const output = await executeAgentNode(node.data.agentId, input, executionContext.variables);

    nodeResults[nodeId] = {
      status: 'success',
      output,
      metadata: {
        thinkingProcess: thinkingProcess.join('\n'),
        executionTime: Date.now()
      }
    };

    const lastResultIdx = executionContext.previousResults.findIndex(r => r.nodeId === nodeId && r.status === 'running');
    if (lastResultIdx !== -1) {
      executionContext.previousResults[lastResultIdx] = {
        nodeId,
        status: 'success',
        output
      };
    }

    io?.to(`task:${taskId}`).emit('task:node:output', { taskId, nodeId, output });
    io?.to(`task:${taskId}`).emit('task:node:completed', { taskId, nodeId, status: 'success', output });
    addTaskLog(taskId, { type: 'output', content: output, nodeId });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    nodeResults[nodeId] = {
      status: 'failed',
      error: errorMessage
    };

    io?.to(`task:${taskId}`).emit('task:node:completed', {
      taskId,
      nodeId,
      status: 'failed',
      error: errorMessage
    });
    addTaskLog(taskId, { type: 'error', content: errorMessage, nodeId });

    if (!node.data.allowFailure) {
      throw error;
    }
  }
  return 'continue';
}
