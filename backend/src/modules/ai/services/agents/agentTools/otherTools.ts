/**
 * 其他类工具（2026-07-21 拆分）
 * - list-alerts:    告警列表
 * - database-info:  数据库信息
 *
 * 注：list-alerts 在 git HEAD 中 category 为 'database'（v2.4 报告声称改为 'alerts'
 *     但 git HEAD 未改——保持与 git 一致，避免误改历史行为）
 */
import { alertRepository, serversRepo, userRepository } from '../../../../../repositories';
import type { AlertFilters } from '../../../../../repositories';
import { agentToolRegistry } from '../agentToolRegistry';

export function registerOtherTools(): void {
  // 19. 告警列表工具（git HEAD: category='database'，注释已说明）
  agentToolRegistry.register({
    id: 'list-alerts',
    name: 'Alert List',
    description: 'Get alert list',
    category: 'database',
    riskLevel: 'readonly',
    auditEnabled: true,
    schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Display Count', default: 20 },
        level: { type: 'string', description: 'Alert Severity', enum: ['critical', 'warning', 'info'] },
        status: { type: 'string', description: 'Status', enum: ['active', 'acknowledged', 'resolved'] },
      },
    },
    execute: async (args) => {
      const limit = (args.limit as number) || 20;
      const level = args.level as string;
      const status = args.status as string;

      const alerts = alertRepository.getAll({
        status: status as AlertFilters['status'],
        severity: level as AlertFilters['severity'],
        limit,
      });

      return `告警列表 (共${alerts.length}条):\n${
        alerts.map(a => `• ${a.title} (${a.severity}) [${a.status}]`).join('\n')
      }`;
    },
  });

  // 20. 数据库信息工具
  agentToolRegistry.register({
    id: 'database-info',
    name: 'Database Info',
    description: 'Get database related info',
    category: 'database',
    riskLevel: 'readonly',
    auditEnabled: true,
    schema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const serverCount = serversRepo.countAll();
      const alertCount = alertRepository.countAll();
      const userCount = userRepository.countAll();

      return `数据库信息统计:
- 服务器数量: ${serverCount}
- 告警数量: ${alertCount}
- 用户数量: ${userCount}
`.trim();
    },
  });
}