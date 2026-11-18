import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../../../utils/logger';
import type { Provider, ProviderResult } from './types';
import { getErrorMessage } from '../../../../utils/errorHelpers';
import type { ProviderRegistry } from './ProviderRegistry';

/**
 * HTTP Provider
 */
export const httpProvider: Provider = {
  name: 'http',
  description: 'HTTP Request Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'get',
      description: 'Send GET request',
      inputs: [
        { name: 'url', type: 'string', description: 'Request URL', required: true },
        { name: 'headers', type: 'object', description: 'Request Headers' },
        { name: 'params', type: 'object', description: 'URL Parameters' }
      ],
      outputs: [
        { name: 'status', type: 'number' },
        { name: 'data', type: 'any' },
        { name: 'headers', type: 'object' }
      ],
      examples: [
        {
          title: 'Get JSON data',
          inputs: { url: 'https://api.example.com/data' }
        }
      ]
    },
    {
      name: 'post',
      description: 'Send POST request',
      inputs: [
        { name: 'url', type: 'string', description: 'Request URL', required: true },
        { name: 'data', type: 'any', description: 'Request Body' },
        { name: 'headers', type: 'object', description: 'Request Headers' }
      ],
      outputs: [
        { name: 'status', type: 'number' },
        { name: 'data', type: 'any' }
      ],
      examples: []
    }
  ]
};

// 实现 HTTP Provider 方法
export const httpMethods = {
  async get(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const response = await fetch(params.url as string, {
        method: 'GET',
        headers: (params.headers as Record<string, string>) || {}
      });
      const data = await response.json() as unknown;

      return {
        success: true,
        data: {
          status: response.status,
          data,
          headers: Object.fromEntries(response.headers.entries())
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  async post(params: Record<string, unknown>): Promise<ProviderResult> {
    try {
      const response = await fetch(params.url as string, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(params.headers as Record<string, string> || {})
        },
        body: JSON.stringify(params.data)
      });
      const data = await response.json() as unknown;

      return {
        success: true,
        data: {
          status: response.status,
          data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

/**
 * 通知 Provider
 */
export const notifyProvider: Provider = {
  name: 'notify',
  description: 'Notification Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'send',
      description: 'Send Notification',
      inputs: [
        { name: 'channel', type: 'string', description: 'Notification Channels: slack, webhook, email', required: true },
        { name: 'title', type: 'string', description: 'Title', required: true },
        { name: 'message', type: 'string', description: 'Message Content', required: true },
        { name: 'level', type: 'string', description: 'Level: info, warning, error' }
      ],
      outputs: [
        { name: 'sent', type: 'boolean' }
      ],
      examples: [
        {
          title: 'Send error notification',
          inputs: {
            channel: 'webhook',
            title: 'System Alert',
            message: 'Anomaly Detected',
            level: 'error'
          }
        }
      ]
    }
  ]
};

// 通知方法实现
export const notifyMethods = {
  async send(params: Record<string, unknown>): Promise<ProviderResult> {
    logger.info(`[NotifyProvider] Sending notification: ${params.title}`);
    // 简化实现，实际应该集成通知服务
    return {
      success: true,
      data: { sent: true }
    };
  }
};

/**
 * 脚本执行 Provider
 */
export const scriptProvider: Provider = {
  name: 'script',
  description: 'Script Execution Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'exec',
      description: 'Execute command/script',
      inputs: [
        { name: 'command', type: 'string', description: 'Command to Execute', required: true },
        { name: 'args', type: 'array', description: 'Command parameters' },
        { name: 'cwd', type: 'string', description: 'Working directory' },
        { name: 'timeout', type: 'number', description: 'Timeout (ms)' }
      ],
      outputs: [
        { name: 'stdout', type: 'string' },
        { name: 'stderr', type: 'string' },
        { name: 'code', type: 'number' }
      ],
      examples: []
    }
  ]
};

// 脚本方法实现
export const scriptMethods = {
  async exec(params: Record<string, unknown>): Promise<ProviderResult> {
    const execPromise = promisify(exec);

    try {
      const { stdout, stderr } = await execPromise(
        params.command as string,
        {
          cwd: params.cwd as string | undefined,
          timeout: params.timeout as number | undefined
        }
      );

      return {
        success: true,
        data: { stdout, stderr, code: 0 }
      };
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; code?: number };
      return {
        success: false,
        error: getErrorMessage(error),
        data: {
          stdout: execError.stdout,
          stderr: execError.stderr,
          code: execError.code
        }
      };
    }
  }
};

/**
 * 数据库 Provider
 */
export const databaseProvider: Provider = {
  name: 'database',
  description: 'Database Operation Provider',
  version: '1.0.0',
  methods: [
    {
      name: 'query',
      description: 'Execute SQL query',
      inputs: [
        { name: 'connectionId', type: 'string', description: 'Database Connection ID', required: true },
        { name: 'query', type: 'string', description: 'SQL Query Statement', required: true },
        { name: 'params', type: 'array', description: 'Query Parameters' }
      ],
      outputs: [
        { name: 'rows', type: 'array' },
        { name: 'columns', type: 'array' }
      ],
      examples: []
    }
  ]
};

// 数据库方法实现
export const databaseMethods = {
  async query(_params: Record<string, unknown>): Promise<ProviderResult> {
    // 简化实现
    return {
      success: true,
      data: {
        rows: [],
        columns: []
      }
    };
  }
};

/**
 * 注册所有内置 Provider
 */
export function registerBuiltinProviders(registry: ProviderRegistry): void {
  registry.register(httpProvider, httpMethods);
  registry.register(notifyProvider, notifyMethods);
  registry.register(scriptProvider, scriptMethods);
  registry.register(databaseProvider, databaseMethods);
}
