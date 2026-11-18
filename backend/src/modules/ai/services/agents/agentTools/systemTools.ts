/**
 * System 类工具（2026-07-21 拆分）
 * - system-info:        系统信息查询（CPU/内存/磁盘/网络）
 * - list-servers:       获取服务器列表
 * - host-load:          主机负载信息（uptime / free / df / iostat / vmstat）
 * - host-processes:     主机进程列表
 * - find-large-files:   查找大文件
 * - system-logs:        系统日志查询（journalctl）
 * - service-status:     服务状态检查
 * - network-status:     网络状态检查
 */
import { sshFindLargeFiles, sshSystemLogs, sshServiceStatus, sshRunShell } from '../safeCommandBuilder';
import { executeCommand as executeSsh } from '../../../../servers/services/sshService';
import { serverInfoCollector } from '../../../../servers/services/serverInfoCollector';
import { serversRepo } from '../../../../../repositories';
import { agentToolRegistry } from '../agentToolRegistry';

export function registerSystemTools(): void {
  // 3. 系统信息查询工具
  agentToolRegistry.register({
    id: 'system-info',
    name: 'System Info Query',
    description: 'Get server info (CPU, memory, disk, network)',
    category: 'system',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
      },
      required: ['serverId'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const info = await serverInfoCollector.collectServerInfo(serverId);
      if (!info.success || !info.data) {
        return `Failed to get system info: ${info.error}`;
      }

      const metrics = await serverInfoCollector.collectServerMetrics(serverId);

      return `
服务器系统信息:
- 操作系统: ${info.data.os}
- CPU 核心数: ${info.data.cpu_cores}
- 内存总容量: ${info.data.memory_gb} GB
- 磁盘总容量: ${info.data.disk_gb} GB
- IP 地址: ${info.data.ip_address}
${metrics.data ? `
实时指标:
- CPU 使用率: ${metrics.data.cpu_usage}%
- 内存使用率: ${metrics.data.memory_usage}% (${metrics.data.memory_used_gb}/${metrics.data.memory_total_gb} GB)
- 磁盘使用率: ${metrics.data.disk_usage}% (${metrics.data.disk_used_gb}/${metrics.data.disk_total_gb} GB)
- 网络入: ${metrics.data.network_in_mbps} mbps
- 网络出: ${metrics.data.network_out_mbps} mbps
- 负载: ${metrics.data.load_1min}/${metrics.data.load_5min}/${metrics.data.load_15min}
- 运行时间: ${metrics.data.uptime_seconds} 秒
` : ''}
`.trim();
    },
  });

  // 4. 获取服务器列表工具
  agentToolRegistry.register({
    id: 'list-servers',
    name: 'Get server list',
    description: 'Get all configured servers',
    category: 'system',
    riskLevel: 'readonly',
    auditEnabled: true,
    schema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const servers = serversRepo.list();
      return `服务器列表 (共${servers.length}个):\n${
        servers.map(s => `• ${s.name} (${s.hostname}) ${s.enabled ? '✅ Online' : '❌ Offline'}`).join('\n')
      }`;
    },
  });

  // 5. 主机负载信息工具
  agentToolRegistry.register({
    id: 'host-load',
    name: 'Host Load Info',
    description: 'Get host load info (CPU, memory, disk, uptime)',
    category: 'system',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
      },
      required: ['serverId'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const commands = [
        'uptime', 'free -h', 'df -h', 'iostat -x 1 1', 'vmstat 1 1'
      ].join(' && echo -e "\\n---\\n" && ');

      const result = await executeSsh(serverId, commands);
      return result.stdout;
    },
  });

  // 6. 主机进程信息工具
  agentToolRegistry.register({
    id: 'host-processes',
    name: 'Host Process Info',
    description: 'Get host process list (sortable by CPU or memory)',
    category: 'system',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
        sortBy: { type: 'string', description: 'Sort By', enum: ['cpu', 'mem'], default: 'cpu' },
        limit: { type: 'number', description: 'Display Count', default: 20 },
      },
      required: ['serverId'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const sortBy = (args.sortBy as string) || 'cpu';
      const limit = (args.limit as number) || 20;
      // 2026-07-21 修复 SSH 命令注入：sortFlag 强制白名单 + 字符校验
      const sortFlag = sortBy === 'cpu' ? '-%cpu' : sortBy === 'mem' ? '-%mem' : '-%cpu';
      const result = await sshRunShell(serverId, 'ps', ['aux', '--sort=' + sortFlag, 'head', `-${limit}`]);
      return result.stdout;
    },
  });

  // 7. 网络状态工具
  agentToolRegistry.register({
    id: 'network-status',
    name: 'Network Status Check',
    description: 'Check network status (ports, connections, routes)',
    category: 'network',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
      },
      required: ['serverId'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const commands = [
        'ip addr show', 'ss -tuln', 'ip route show', 'ping -c 4 8.8.8.8'
      ].join(' && echo -e "\\n---\\n" && ');

      const result = await executeSsh(serverId, commands);
      return result.stdout;
    },
  });

  // 8. 进程列表查找大文件工具
  agentToolRegistry.register({
    id: 'find-large-files',
    name: 'Find Large Files',
    description: 'Find large files in specified directory',
    category: 'system',
    riskLevel: 'low',
    auditEnabled: true,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
        directory: { type: 'string', description: 'Search Directory', default: '/' },
        minSizeMB: { type: 'number', description: 'Minimum File Size (MB)', default: 100 },
        limit: { type: 'number', description: 'Display Count', default: 10 },
      },
      required: ['serverId'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const directory = (args.directory as string) || '/';
      const minSizeMB = (args.minSizeMB as number) || 100;
      const limit = (args.limit as number) || 10;

      // 2026-07-21 修复 SSH 命令注入：改用 sshFindLargeFiles 安全包装器
      const result = await sshFindLargeFiles(serverId, directory, minSizeMB, limit);

      return `
查找目录: ${directory}
最小文件大小: ${minSizeMB} MB
显示数量: ${limit}
${result.stdout}
`.trim();
    },
  });

  // 9. 系统日志查询工具
  agentToolRegistry.register({
    id: 'system-logs',
    name: 'System Log Query',
    description: 'Query system logs (journalctl)',
    category: 'system',
    riskLevel: 'low',
    auditEnabled: true,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
        unit: { type: 'string', description: 'Service Unit' },
        since: { type: 'string', description: 'Start Time', default: '1 hour ago' },
        lines: { type: 'number', description: 'Tail Lines', default: 100 },
        level: { type: 'string', description: 'Log Level', enum: ['emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug'] },
      },
      required: ['serverId'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const unit = args.unit as string;
      const since = (args.since as string) || '1 hour ago';
      const lines = (args.lines as number) || 100;
      const level = args.level as string;

      // 2026-07-21 修复 SSH 命令注入：改用 sshSystemLogs 安全包装器
      const result = await sshSystemLogs(serverId, unit, since, lines, level);

      return `
系统日志查询结果:
- 服务单元: ${unit || 'All'}
- 起始时间: 1 day ago
- 显示行数: ${lines}
${result.stdout}
`.trim();
    },
  });

  // 10. 服务状态检查工具
  agentToolRegistry.register({
    id: 'service-status',
    name: 'Service Status Check',
    description: 'Check system service status',
    category: 'system',
    riskLevel: 'low',
    auditEnabled: true,
    schema: {
      type: 'object',
      properties: {
        serverId: { type: 'string', description: 'Server ID' },
        unit: { type: 'string', description: 'Service Unit Name' },
        listAll: { type: 'boolean', description: 'List All Services', default: false },
      },
      required: ['serverId'],
    },
    execute: async (args) => {
      const serverId = args.serverId as string;
      const unit = args.unit as string;
      const listAll = Boolean(args.listAll);

      // 2026-07-21 修复 SSH 命令注入：改用 sshServiceStatus 安全包装器
      const result = await sshServiceStatus(serverId, unit, listAll);

      return `
服务状态检查结果:
${result.stdout}
`.trim();
    },
  });
}