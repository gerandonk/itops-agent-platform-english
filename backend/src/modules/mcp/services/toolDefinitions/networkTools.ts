import { z } from 'zod';
import { type RegisteredTool } from '../types';
import { textResult, jsonResult, READONLY } from './shared';
import { networkDeviceRepository } from '../../../../repositories';

export const networkTools: RegisteredTool[] = [
  {
    name: 'network.device.list',
    title: 'Query Network Device List',
    description: 'Query all network devices (switches, routers, firewalls, etc.), including model, firmware, port count, and management IP.',
    domain: 'network_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      deviceType: z.string().optional().describe('Device Type'),
      vendor: z.string().optional().describe('Vendor'),
      status: z.enum(['online', 'offline', 'unknown']).optional().describe('Online Status'),
      limit: z.number().min(1).max(100).default(50).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const devices = networkDeviceRepository.listWithFilters({
          deviceType: args.deviceType,
          vendor: args.vendor,
          status: args.status,
          limit: args.limit || 50,
        });
        return jsonResult(devices, `Found ${(devices as unknown[])?.length || 0} network devices`);
      } catch (err) {
        return textResult(`Failed to query network devices: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'network.topology',
    title: 'Query Network Topology',
    description: 'Query network topology structure and inter-device connections.',
    domain: 'network_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      rootDeviceId: z.string().optional().describe('Root Device ID (returns full topology if omitted)'),
      depth: z.number().min(1).max(5).default(2).describe('Topology Depth'),
    }),
    handler: async (args) => {
      try {
        const { topologyService } = await import('../../../../modules/network/services/topologyService');
        const topology = await (topologyService as any).getTopology?.(
          args.rootDeviceId,
          args.depth
        );
        return jsonResult(topology || { message: 'Topology data is being collected' }, 'Network Topology');
      } catch (err) {
        return textResult(`Failed to query topology: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },
];