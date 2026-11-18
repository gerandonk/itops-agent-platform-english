/**
 * agents/databaseAdminAgent.ts — 数据库运维 Agent
 *
 * 调用 dbskiter 执行数据库诊断/监控/安全/锁分析
 */

import { dbConnectionRepository } from '../../../../repositories';
import { logger } from '../../../../utils/logger';
import { executeAgentWithLLM } from '../llm/llmService';
import { decrypt } from '../../../auth/services/encryptionService';
import {
  executeDbskiter,
  inferDatabaseOperation,
  formatResultToMarkdown,
} from '../../../database/services/dbskiterService';
import type { AgentExecutionContext } from './agentCore';

/**
 * 数据库运维 Agent：调用 dbskiter 执行数据库诊断/监控/安全/锁分析
 *
 * 参数说明：
 * - input: [string] 用户输入
 * - context: [AgentExecutionContext] 上下文，可能包含 databaseId（数据库连接ID）
 */
export async function executeDatabaseAdminAgent(
  agentId: string,
  input: string,
  context?: AgentExecutionContext
): Promise<string> {
  logger.info('🗄️ executeDatabaseAdminAgent called with:', { input, context });

  // 从上下文中获取 databaseId
  const databaseId = context?.databaseId as string | undefined;

  // 如果没有 databaseId，返回错误提示
  if (!databaseId) {
    return '## Database Ops Execution Failed\\n\\n**Error**: No database connection selected. Please configure a database in Database Connection Management first, then select the target database during testing.';
  }

  // 查询数据库连接信息
  const dbConn = dbConnectionRepository.getById(databaseId);

  if (!dbConn) {
    return '## Database Ops Execution Failed\\n\\n**Error**: Specified database connection not found. Please check if the database connection ID is correct.';
  }

  if (!dbConn.enabled) {
    return `## Database Ops Execution Failed\\n\\n**Error**: Database connection "${dbConn.name}" has been disabled.`;
  }

  // 解密密码
  let decryptedPassword: string;
  try {
    decryptedPassword = decrypt(dbConn.password);
  } catch (_e) {
    decryptedPassword = dbConn.password; // 兼容未加密存储的历史数据
  }

  // 构建 dbskiter 连接对象
  const connection = {
    dialect: dbConn.db_type,
    host: dbConn.host,
    port: dbConn.port,
    user: dbConn.username,
    password: decryptedPassword,
    database: dbConn.database,
  };

  // 推断运维意图
  let options = inferDatabaseOperation(input, connection);

  // 如果无法推断，兜底：默认健康检查
  if (!options) {
    logger.warn('Unable to infer database ops intent from input, using default health check');
    options = { connection, operation: 'monitor', subCommand: 'health' };
  }

  logger.info('🗄️ Inferred database ops operation:', { operation: options.operation, subCommand: options.subCommand });

  // 执行 dbskiter
  const result = await executeDbskiter(options);

  // 如果 dbskiter 执行失败，直接返回错误信息
  if (!result.success) {
    const operationLabel = `${options.operation}${options.subCommand ? ' ' + options.subCommand : ''}`;
    return formatResultToMarkdown(result, operationLabel);
  }

  // 构建 LLM 分析提示
  const rawData = typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.stdout;
  const prompt = `[Database Ops Raw Data]\\n\\nUser Request: ${input}\\n\\nDatabase: ${dbConn.name} (${dbConn.db_type}://${dbConn.host}:${dbConn.port}/${dbConn.database})\\n\\nOperation: ${options.operation} ${options.subCommand || ''}\\n\\nRaw Collected Data:\\n\\\`\\\`\\\`json\\n${rawData.substring(0, 12000)}\\n\\\`\\\`\\\`\\n\\nPlease provide a professional database ops analysis report to the user based on the raw data above. Requirements:\\n1. Describe the current database status in natural language\\n2. Point out key metrics and potential issues\\n3. Provide specific optimization suggestions or handling solutions\\n4. Keep the report structure clear, including three sections: Summary, Detailed Analysis, and Recommendations\\n`;

  try {
    logger.info('🤖 Calling LLM to analyze dbskiter raw data...');
    const analysis = await executeAgentWithLLM(agentId, prompt);
    return analysis;
  } catch (error) {
    logger.error('LLM analysis failed, returning raw data:', error);
    const operationLabel = `${options.operation}${options.subCommand ? ' ' + options.subCommand : ''}`;
    return formatResultToMarkdown(result, operationLabel);
  }
}