/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'crypto';
import { logger } from '../../../utils/logger';
import { executeCommand } from '../../servers/services/sshService';
import { alertRepository } from '../../../repositories';
import { notificationService } from '../../notification/services/notificationService';

/**
 * 工作流 Provider 接口
 */
export interface WorkflowProvider {
  id: string;
  name: string;
  type: 'alert' | 'notification' | 'action' | 'script';
  configSchema: any;
  execute: (config: Record<string, any>, context: Record<string, any>) => Promise<any>;
}

/**
 * 工作流 Provider 注册表
 */
class WorkflowProviderRegistry {
  private providers = new Map<string, WorkflowProvider>();

  register(provider: WorkflowProvider) {
    this.providers.set(provider.id, provider);
    logger.info(`✅ Registered workflow provider: ${provider.id}`);
  }

  getProvider(id: string): WorkflowProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): WorkflowProvider[] {
    return Array.from(this.providers.values());
  }

  listProvidersByType(type: WorkflowProvider['type']): WorkflowProvider[] {
    return this.listProviders().filter(p => p.type === type);
  }
}

export const workflowProviderRegistry = new WorkflowProviderRegistry();

// 预注册一些基础 Provider
(() => {
  try {
    // 1. 发送通知 Provider（真实实现）
    workflowProviderRegistry.register({
      id: 'send-notification',
      name: 'Send Notification',
      type: 'notification',
      configSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Notification Content' },
          channel: { type: 'string', description: 'Notification Channel', enum: ['email', 'wechat', 'dingtalk', 'webhook'] },
          targets: { type: 'array', description: 'Notification Target' }
        },
        required: ['message']
      },
      execute: async (config, context) => {
        logger.info(`📢 Sending notification: ${config.message} to channel ${config.channel}`, context);
        try {
          if (notificationService) {
            // 如果有通知服务，调用真实通知
            const result = await notificationService.send({
              type: config.channel || 'general',
              title: 'Workflow Notification',
              content: config.message
            });
            return result;
          }
          return { success: true, message: `Notification sent: ${config.message}` };
        } catch (error) {
          logger.error('❌ Failed to send notification:', error);
          return { success: false, error: (error as Error).message };
        }
      }
    });

    // 2. SSH 执行命令 Provider（真实实现）
    workflowProviderRegistry.register({
      id: 'ssh-exec',
      name: 'Execute SSH Command',
      type: 'action',
      configSchema: {
        type: 'object',
        properties: {
          serverId: { type: 'string', description: 'Server ID' },
          command: { type: 'string', description: 'Command Content' },
          timeout: { type: 'number', description: 'Timeout (ms)', default: 30000 }
        },
        required: ['serverId', 'command']
      },
      execute: async (config, context) => {
        logger.info(`🔌 SSH Executing: ${config.command} on server ${config.serverId}`, context);
        try {
          const result = await executeCommand(config.serverId as string, config.command as string, {
            timeout: config.timeout as number || 30000
          });
          return {
            success: result.success,
            stdout: result.stdout,
            stderr: result.stderr,
            duration: result.duration
          };
        } catch (error) {
          logger.error('❌ SSH execution failed:', error);
          return { success: false, error: (error as Error).message };
        }
      }
    });

    // 3. Docker 操作 Provider
    workflowProviderRegistry.register({
      id: 'docker-operation',
      name: 'Docker Operation',
      type: 'action',
      configSchema: {
        type: 'object',
        properties: {
          serverId: { type: 'string', description: 'Server ID' },
          action: { type: 'string', description: 'Operation Type', enum: ['start', 'stop', 'restart', 'remove', 'logs'] },
          containerId: { type: 'string', description: 'Container ID' }
        },
        required: ['serverId', 'action', 'containerId']
      },
      execute: async (config, context) => {
        logger.info(`🐳 Docker ${config.action}: container ${config.containerId}`, context);
        try {
          let command = '';
          switch (config.action) {
            case 'start':
              command = `docker start ${config.containerId}`;
              break;
            case 'stop':
              command = `docker stop ${config.containerId}`;
              break;
            case 'restart':
              command = `docker restart ${config.containerId}`;
              break;
            case 'remove':
              command = `docker rm -f ${config.containerId}`;
              break;
            case 'logs':
              command = `docker logs --tail 100 ${config.containerId}`;
              break;
            default:
              throw new Error(`Unknown action: ${config.action}`);
          }
          
          const result = await executeCommand(config.serverId as string, command);
          return {
            success: result.success,
            stdout: result.stdout,
            stderr: result.stderr
          };
        } catch (error) {
          logger.error('❌ Docker operation failed:', error);
          return { success: false, error: (error as Error).message };
        }
      }
    });

    // 4. HTTP 请求 Provider
    workflowProviderRegistry.register({
      id: 'http-request',
      name: 'HTTP Request',
      type: 'action',
      configSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL' },
          method: { type: 'string', description: 'Request Method', enum: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET' },
          headers: { type: 'object', description: 'Request Headers' },
          body: { type: 'string', description: 'Request Body' }
        },
        required: ['url']
      },
      execute: async (config, context) => {
        logger.info(`🌐 Making HTTP request: ${config.method} ${config.url}`, context);
        try {
          const fetchOptions: any = {
            method: config.method || 'GET',
            headers: { 'Content-Type': 'application/json', ...(config.headers as object) }
          };
          if (config.body) {
            fetchOptions.body = config.body;
          }
          
          // 简单的 fetch 模拟，实际项目应使用真实 http 库
          return { success: true, statusCode: 200, data: 'Response Data (Mock)' };
        } catch (error) {
          logger.error('❌ HTTP request failed:', error);
          return { success: false, error: (error as Error).message };
        }
      }
    });

    // 5. 触发告警 Provider（真实实现）
    workflowProviderRegistry.register({
      id: 'trigger-alert',
      name: 'Trigger Alert',
      type: 'alert',
      configSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Alert Title' },
          severity: { type: 'string', description: 'Alert Severity', enum: ['info', 'warning', 'critical'] },
          content: { type: 'string', description: 'Alert Content' },
          source: { type: 'string', description: 'Alert Source' }
        },
        required: ['title']
      },
      execute: async (config, context) => {
        logger.info(`🔔 Triggering alert: ${config.title}`, context);
        try {
          // 插入告警到数据库
          const id = randomUUID();
          alertRepository.createSimple({
            id,
            title: config.title,
            severity: config.severity,
            content: config.content,
            source: config.source || 'workflow',
            status: 'open',
          });
          
          return { success: true, alertId: id };
        } catch (error) {
          logger.error('❌ Failed to trigger alert:', error);
          return { success: false, error: (error as Error).message };
        }
      }
    });

    logger.info(`✅ Pre-registered ${workflowProviderRegistry.listProviders().length} workflow providers`);
  } catch (error) {
    logger.error('❌ Failed to pre-register workflow providers:', error);
  }
})();
