/**
 * SSH 类工具（2026-07-21 拆分）
 * - ssh-exec: SSH 命令执行
 * - view-file: 查看文件内容
 *
 * 安全设计：详见 ADR-023 SSH 命令注入修复——全部命令通过 safeCommandBuilder.ts 包装器执行
 */
import {
  sshViewFile,
  sshRunShell,
} from '../safeCommandBuilder';
import { agentToolRegistry } from '../agentToolRegistry';

export function registerSshTools(): void {
  // 1. SSH 命令执行工具
  agentToolRegistry.register({
    id: 'ssh-exec',
    name: 'SSH Command Execution',
    description: 'Execute whitelisted commands on remote servers (e.g., cat/ls/df/journalctl/systemctl, etc.)',
    category: 'ssh',
    riskLevel: 'high',
    auditEnabled: true,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
        commandName: { type: 'string', description: 'Whitelisted command name (cat/ls/df/journalctl/systemctl, etc.)' },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Command parameters (validated against whitelist, shell metacharacters prohibited)',
        },
      },
      required: ['serverId', 'commandName'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const commandName = args.commandName as string;
      const commandArgs = Array.isArray(args.args) ? args.args as string[] : [];
      const result = await sshRunShell(serverId, commandName, commandArgs);
      return `
执行结果 (${result.success ? '✅ Success' : '❌ Failure'})
输出:
${result.stdout}
${result.stderr ? `错误:
${result.stderr}` : ''}
`.trim();
    },
  });

  // 2. 查看文件内容工具
  agentToolRegistry.register({
    id: 'view-file',
    name: 'View file content',
    description: 'View remote file content',
    category: 'ssh',
    riskLevel: 'low',
    auditEnabled: true,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
        filePath: { type: 'string', description: 'File Path' },
        lines: { type: 'number', description: 'Tail Lines', default: 100 },
      },
      required: ['serverId', 'filePath'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const filePath = args.filePath as string;
      const lines = (args.lines as number) || 100;
      // 2026-07-21 修复 SSH 命令注入：改用 sshViewFile 安全包装器
      const result = await sshViewFile(serverId, filePath, lines);

      return `
文件: ${filePath}
${result.stdout}
${result.stderr ? `Error: ${result.stderr}` : ''}
`.trim();
    },
  });
}