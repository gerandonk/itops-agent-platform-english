import { z } from 'zod';
import { type RegisteredTool } from '../types';
import { textResult, jsonResult, READONLY } from './shared';
import { racksRepo } from '../../../../repositories';
import { devicesRepo } from '../../../../repositories';
import { workflowsRepo } from '../../../../repositories';
import { tasksRepo } from '../../../../repositories';
import { dbConnectionRepository } from '../../../../repositories';
import { scriptsRepo } from '../../../../repositories';
import { backupRepository } from '../../../../repositories';
import { userRepository } from '../../../../repositories';
import { serversRepo } from '../../../../repositories';
import { alertRepository } from '../../../../repositories';

export const infraTools: RegisteredTool[] = [
  {
    name: 'dc.rack.list',
    title: 'Query Rack List',
    description: 'Query data center rack list, including location, capacity, power consumption, and temperature.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      roomId: z.string().optional().describe('Data Room ID'),
      status: z.enum(['active', 'maintenance', 'offline']).optional().describe('Rack Status'),
      limit: z.number().min(1).max(100).default(50).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const racks = racksRepo.list({
          roomId: args.roomId,
          status: args.status,
          limit: args.limit || 50,
        });
        return jsonResult(racks, `Found ${racks.length} racks`);
      } catch (err) {
        return textResult(`Failed to query racks: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'dc.device.list',
    title: 'Query Data Center Equipment',
    description: 'Query data center equipment inventory (servers, switches, PDUs, etc.), including rack location and power consumption.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      rackId: z.string().optional().describe('Rack ID'),
      deviceType: z.string().optional().describe('Device Type'),
      limit: z.number().min(1).max(200).default(100).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const devices = devicesRepo.listDcDevices({
          rackId: args.rackId,
          deviceType: args.deviceType,
          limit: args.limit || 100,
        });
        return jsonResult(devices, `Found ${(devices as unknown[])?.length || 0} devices`);
      } catch (err) {
        return textResult(`Failed to query data center equipment: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'workflow.list',
    title: 'Query Workflow List',
    description: 'Query all workflow definitions, including steps, triggers, and status.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      status: z.enum(['active', 'inactive', 'draft']).optional().describe('Workflow Status'),
      limit: z.number().min(1).max(50).default(20).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const workflows = workflowsRepo.listWithFilters({
          status: args.status,
          limit: args.limit || 20,
        });
        return jsonResult(workflows, `Found ${workflows.length} workflows`);
      } catch (err) {
        return textResult(`Failed to query workflows: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'workflow.task.list',
    title: 'Query Task List',
    description: 'Query task list in the task center, including execution status, host, and duration.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      status: z.enum(['pending', 'running', 'success', 'failed']).optional().describe('Task Status'),
      hostId: z.string().optional().describe('Host ID'),
      limit: z.number().min(1).max(100).default(20).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const tasks = tasksRepo.list({
          status: args.status,
          hostId: args.hostId,
          limit: args.limit || 20,
        });
        return jsonResult(tasks, `Found ${tasks.length} tasks`);
      } catch (err) {
        return textResult(`Failed to query tasks: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'database.list',
    title: 'Query Database List',
    description: 'Query managed database instance list, including type, version, and connection info.',
    domain: 'database_operation',
    annotations: READONLY,
    inputSchema: z.object({
      dbType: z.string().optional().describe('Database type (mysql/postgresql/redis, etc.)'),
      limit: z.number().min(1).max(50).default(20).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const databases = dbConnectionRepository.listWithFilters({
          dbType: args.dbType,
          limit: args.limit || 20,
        });
        return jsonResult(databases, `Found ${(databases as unknown[])?.length || 0} databases`);
      } catch (err) {
        return textResult(`Failed to query databases: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'infra.script.list',
    title: 'Query Script List',
    description: 'Query O&M script library, including script name, type, and execution environment.',
    domain: 'document_generation',
    annotations: READONLY,
    inputSchema: z.object({
      scriptType: z.string().optional().describe('Script type (shell/python/ansible, etc.)'),
      search: z.string().optional().describe('Search by name'),
      limit: z.number().min(1).max(50).default(20).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const scripts = scriptsRepo.listForMcp({
          scriptType: args.scriptType,
          search: args.search,
          limit: args.limit || 20,
        });
        return jsonResult(scripts, `Found ${(scripts as unknown[])?.length || 0} scripts`);
      } catch (err) {
        return textResult(`Failed to query scripts: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'infra.backup.list',
    title: 'Query Backup Records',
    description: 'Query configuration and data backup records, including backup type, time, and size.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      backupType: z.string().optional().describe('Backup Type'),
      limit: z.number().min(1).max(50).default(20).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const backups = backupRepository.list({
          backupType: args.backupType,
          limit: args.limit || 20,
        });
        return jsonResult(backups, `Found ${(backups as unknown[]).length} backup records`);
      } catch (err) {
        return textResult(`Failed to query backups: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'auth.user.list',
    title: 'Query User List',
    description: 'Query system user list (read-only), including username, role, and status.',
    domain: 'compliance_check',
    annotations: READONLY,
    inputSchema: z.object({
      role: z.string().optional().describe('Role Filter'),
      status: z.enum(['active', 'disabled']).optional().describe('User Status'),
      limit: z.number().min(1).max(50).default(20).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const users = userRepository.listWithFilters({
          role: args.role,
          status: args.status,
          limit: args.limit || 20,
        });
        return jsonResult(users, `Found ${users.length} users`);
      } catch (err) {
        return textResult(`Failed to query users: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'database.info',
    title: 'Database Statistics',
    description: 'Get database statistics (server count / alert count / user count)',
    domain: 'database',
    inputSchema: z.object({}),
    annotations: READONLY,
    handler: async (_args, _ctx) => {
      try {
        const serverCount = serversRepo.countAll();
        const alertCount = alertRepository.countAll();
        const userCount = userRepository.countAll();
        return jsonResult(
          { serverCount, alertCount, userCount },
          `Database Statistics:\\n- Server Count: ${serverCount}\\n- Alert Count: ${alertCount}\\n- User Count: ${userCount}`
        );
      } catch (err) {
        return textResult(`Failed to get database statistics: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },
];