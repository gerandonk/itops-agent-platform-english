/**
 * agents/inspectionAgent.ts — 自动巡检 Agent
 *
 * 负责真实执行服务器合规检查，支持多台服务器
 */

import { serversRepo } from '../../../../repositories';
import { logger } from '../../../../utils/logger';
import { runComplianceCheck } from '../../../servers/services/sshService';
import type { Server } from '../../../../types';
import type { AgentExecutionContext } from './agentCore';

type ServerRow = Pick<Server, 'id' | 'name' | 'hostname'>;

function getEnabledServers(): ServerRow[] {
  return serversRepo.listEnabled() as unknown as ServerRow[];
}

/**
 * 自动巡检 Agent：真实执行服务器合规检查（支持多台服务器）
 */
export async function executeAutoInspectionAgent(input: string, context?: AgentExecutionContext): Promise<string> {
  logger.info('🔍 executeAutoInspectionAgent called with:', { input, context });
  
  let serverIds: string[] | undefined;
  if (context) {
    if (Array.isArray(context.serverIds)) {
      serverIds = context.serverIds.map(String);
    }
    if (context.serverId) {
      serverIds = [String(context.serverId)];
    }
  }
  
  logger.info('🔍 Selected server IDs for inspection:', serverIds);
  
  const servers = getEnabledServers();
  if (servers.length === 0) {
    return '## Cannot Execute Inspection\\n\\n**Error**: No available servers found. Please add a server in Server Management first.';
  }
  
  if (!serverIds || serverIds.length === 0) {
    serverIds = [servers[0].id];
  }
  
  let totalSuccessChecks = 0;
  let totalFailChecks = 0;
  let report = `## Server Automated Inspection Report\\n\\n**Check Time**: ${new Date().toLocaleString()}\\n**Target Servers**: ${serverIds.length}\\n\\n---\\n`;
  
  for (const serverId of serverIds) {
    const server = servers.find(s => s.id === serverId);
    if (!server) continue;
    
    const { successCount, failCount, detail } = await inspectSingleServer(server);
    totalSuccessChecks += successCount;
    totalFailChecks += failCount;
    report += detail;
  }
  
  report += `\\n**Overall Statistics**: ${totalSuccessChecks} passed, ${totalFailChecks} failed\\n`;
  return report;
}

/**
 * 检查单台服务器并返回结果详情
 */
async function inspectSingleServer(server: ServerRow): Promise<{
  successCount: number;
  failCount: number;
  detail: string;
}> {
  let successCount = 0;
  let failCount = 0;
  let detail = `\n### 🖥️ ${server.name} (${server.hostname})\n\n`;
  
  try {
    logger.info(`🔍 Executing automated inspection on server ${server.name}(${server.hostname})...`);
    const results = await runComplianceCheck(server.id);
    
    for (const [, result] of Object.entries(results)) {
      if (result.success) successCount++;
      else failCount++;
    }
    
    detail += `**Check Results**: ${successCount} ✅, ${failCount} ❌\\n\\n`;
    
    for (const [checkName, result] of Object.entries(results)) {
      detail += `${result.success ? '✅' : '❌'} **${checkName}**: ${result.success ? 'Passed' : 'Failed'}\\n`;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    detail += `**Error**: ${errorMessage}\\n\\n`;
  }
  
  detail += '\n---\n';
  return { successCount, failCount, detail };
}