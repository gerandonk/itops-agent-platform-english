import { z } from 'zod';
import { type RegisteredTool, RiskLevel } from '../types';
import { textResult, jsonResult, READONLY } from './shared';
import { executeCommand } from '../../../../modules/servers/services/sshService';
import { serversRepo } from '../../../../repositories';

export const serverTools: RegisteredTool[] = [
  {
    name: 'server.list',
    title: 'Query Server List',
    description: 'Query all managed server lists, including basic info (hostname, IP, status, group).',
    domain: 'server_operation',
    annotations: READONLY,
    inputSchema: z.object({
      groupId: z.string().optional().describe('Server Group ID'),
      status: z.enum(['online', 'offline', 'unknown']).optional().describe('Online Status'),
      search: z.string().optional().describe('Search Keyword (Hostname/IP)'),
      limit: z.number().min(1).max(100).default(50).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const servers = serversRepo.listWithFilters({
          groupId: args.groupId,
          status: args.status,
          search: args.search,
          limit: args.limit || 50,
        });
        return jsonResult(servers, `Found ${(servers as unknown[])?.length || 0} servers`);
      } catch (err) {
        return textResult(`Failed to query servers: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'server.detail',
    title: 'Query Server Details',
    description: 'Query detailed information of the specified server, including configuration, disks, network interfaces, and running services.',
    domain: 'server_operation',
    annotations: READONLY,
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
    }),
    handler: async (args) => {
      try {
        const server = serversRepo.getById(args.serverId as string);
        if (!server) return textResult(`Server ${args.serverId} does not exist`, true);
        return jsonResult(server, `Server ${(server as any).name} Details`);
      } catch (err) {
        return textResult(`Failed to query server details: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'ssh.exec',
    title: 'SSH Command Execution',
    description: 'Execute SSH commands on a remote server',
    domain: 'servers',
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
      command: z.string().describe('Command to Execute'),
    }),
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, riskLevel: RiskLevel.MEDIUM, requiresApproval: true },
    handler: async (args, _ctx) => {
      try {
        const result = await executeCommand(args.serverId as string, args.command as string);
        return textResult(
          `执行结果 (${result.success ? '✅ Success' : '❌ Failure'})\n输出:\n${result.stdout}${result.stderr ? `\n错误:\n${result.stderr}` : ''}\\nDuration: ${result.duration}ms`
        );
      } catch (err) {
        return textResult(`SSH execution failed: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'ssh.viewFile',
    title: 'View Remote File',
    description: 'View file content on remote server (tail)',
    domain: 'servers',
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
      filePath: z.string().describe('File Path'),
      lines: z.number().optional().default(100).describe('Tail Lines'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const command = `tail -n ${args.lines || 100} ${args.filePath}`;
        const result = await executeCommand(args.serverId as string, command);
        return textResult(`File: ${args.filePath}\\n${result.stdout}${result.stderr ?`\n错误: ${result.stderr}` : ''}`);
      } catch (err) {
        return textResult(`Failed to view file: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'server.hostLoad',
    title: 'Host Load Info',
    description: 'Get host load details (uptime/free/df/iostat/vmstat)',
    domain: 'servers',
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const commands = ['uptime', 'free -h', 'df -h', 'iostat -x 1 1', 'vmstat 1 1'].join(' && echo -e "\\n---\\n" && ');
        const result = await executeCommand(args.serverId as string, commands);
        return textResult(result.stdout);
      } catch (err) {
        return textResult(`Failed to get load info: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'server.processes',
    title: 'Host Process List',
    description: 'Get host process list, sortable by CPU or memory',
    domain: 'servers',
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
      sortBy: z.enum(['cpu', 'mem']).optional().default('cpu').describe('Sort By'),
      limit: z.number().optional().default(20).describe('Display Count'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const sortFlag = args.sortBy === 'mem' ? '-%mem' : '-%cpu';
        const command = `ps aux --sort=${sortFlag} | head -${args.limit || 20}`;
        const result = await executeCommand(args.serverId as string, command);
        return textResult(result.stdout);
      } catch (error: unknown) {
        return textResult(`Failed to get process list: ${(error as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'server.networkStatus',
    title: 'Network Status Check',
    description: 'Check server network status (IP/Socket/routing/Ping)',
    domain: 'servers',
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const commands = ['ip addr show', 'ss -tuln', 'ip route show', 'ping -c 4 8.8.8.8'].join(' && echo -e "\\n---\\n" && ');
        const result = await executeCommand(args.serverId as string, commands);
        return textResult(result.stdout);
      } catch (err) {
        return textResult(`Network check failed: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'server.findLargeFiles',
    title: 'Find Large Files',
    description: 'Find large files on the server (directory and minimum size can be specified)',
    domain: 'servers',
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
      directory: z.string().optional().default('/').describe('Search Directory'),
      minSizeMB: z.number().optional().default(100).describe('Minimum File Size (MB)'),
      limit: z.number().optional().default(10).describe('Display Count'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const command = `find ${args.directory || '/'} -type f -size +${args.minSizeMB || 100}M -exec ls -lh {} \\; 2>/dev/null | head -${args.limit || 10}`;
        const result = await executeCommand(args.serverId as string, command);
        return textResult(`Search Directory: ${args.directory || '/'}\\nMinimum File Size: ${args.minSizeMB || 100} MB\\n${result.stdout}`);
      } catch (err) {
        return textResult(`Failed to find large files: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'server.logs',
    title: 'System Log Query',
    description: 'Query server system logs (journalctl)',
    domain: 'servers',
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
      unit: z.string().optional().describe('Service Unit Name'),
      since: z.string().optional().default('1 hour ago').describe('Start Time'),
      lines: z.number().optional().default(100).describe('Tail Lines'),
      level: z.enum(['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug']).optional().describe('Log Level'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        let command = 'journalctl';
        if (args.unit) command += ` -u ${args.unit}`;
        if (args.level) command += ` -p ${args.level}`;
        command += ` --since '${args.since || '1 hour ago'}' -n ${args.lines || 100}`;
        const result = await executeCommand(args.serverId as string, command);
        return textResult(`System Logs (${args.unit || 'All units'}, ${args.since || '1 hour ago'}):\\n${result.stdout}`);
      } catch (err) {
        return textResult(`Failed to query logs: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'server.services',
    title: 'Service Status Check',
    description: 'Check systemd service status on the server',
    domain: 'servers',
    inputSchema: z.object({
      serverId: z.string().describe('Server ID'),
      unit: z.string().optional().describe('Service Unit Name'),
      listAll: z.boolean().optional().default(false).describe('List All Services'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        let command = 'systemctl';
        if (args.listAll) {
          command += ' list-units --type=service';
        } else if (args.unit) {
          command += ` status ${args.unit}`;
        } else {
          command += ' --failed --type=service';
        }
        const result = await executeCommand(args.serverId as string, command);
        return textResult(`Service Status:\\n${result.stdout}`);
      } catch (err) {
        return textResult(`Service check failed: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },
];