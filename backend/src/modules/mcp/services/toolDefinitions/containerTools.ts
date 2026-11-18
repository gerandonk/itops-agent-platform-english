import { z } from 'zod';
import { type RegisteredTool } from '../types';
import { textResult, jsonResult, READONLY } from './shared';
import { dockerService } from '../../../../modules/containers/services/dockerService';
import { containerRepository } from '../../../../repositories';
import { virtualMachineRepository } from '../../../../repositories';

export const containerTools: RegisteredTool[] = [
  {
    name: 'container.list',
    title: 'Query container list',
    description: 'Query Docker container list, including running status, images, port mappings, and resource usage.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      hostId: z.string().optional().describe('Docker Host ID'),
      status: z.enum(['running', 'stopped', 'paused']).optional().describe('Container Status'),
      limit: z.number().min(1).max(100).default(50).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const containers = containerRepository.list({
          dockerHostId: args.hostId,
          status: args.status,
          limit: args.limit || 50,
        });
        return jsonResult(containers, `Found ${(containers as unknown[])?.length || 0} containers`);
      } catch (err) {
        return textResult(`Failed to query containers: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'vm.list',
    title: 'Query Virtual Machine List',
    description: 'Query virtual machine list, including CPU, memory, disk, status, and parent host.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      status: z.enum(['running', 'stopped', 'paused', 'unknown']).optional().describe('VM Status'),
      hostId: z.string().optional().describe('Host ID'),
      limit: z.number().min(1).max(100).default(50).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const vms = virtualMachineRepository.list({
          status: args.status,
          hostId: args.hostId,
          limit: args.limit || 50,
        });
        return jsonResult(vms, `Found ${vms.length} virtual machines`);
      } catch (err) {
        return textResult(`Failed to query virtual machines: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'k8s.cluster.summary',
    title: 'Query K8s Cluster Summary',
    description: 'Query Kubernetes cluster summary info, including node count, Pod count, namespace count, and resource utilization.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      clusterId: z.string().optional().describe('Cluster ID (returns all clusters if omitted)'),
    }),
    handler: async (args) => {
      try {
        const { kubernetesService } = await import(
          '../../../../modules/kubernetes/services/kubernetesService'
        );
        const summary = await (kubernetesService as any).getClusterSummary?.(args.clusterId);
        return jsonResult(summary || { message: 'K8s cluster data is syncing' }, 'K8s Cluster Summary');
      } catch (err) {
        return textResult(`Failed to query K8s cluster: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'k8s.pod.list',
    title: 'Query K8s Pod List',
    description: 'Query Kubernetes Pod list, including status, restart count, and resource usage. Supports filtering by namespace and workload.',
    domain: 'system_inspection',
    annotations: READONLY,
    inputSchema: z.object({
      clusterId: z.string().optional().describe('Cluster ID'),
      namespace: z.string().optional().describe('Namespace'),
      labelSelector: z.string().optional().describe('Label Selector'),
      limit: z.number().min(1).max(200).default(50).describe('Limit / Return Count'),
    }),
    handler: async (args) => {
      try {
        const { kubernetesService } = await import(
          '../../../../modules/kubernetes/services/kubernetesService'
        );
        const pods = await (kubernetesService as any).listPods?.(
          args.clusterId,
          args.namespace,
          args.labelSelector,
          args.limit
        );
        return jsonResult(pods || [], `Pod List`);
      } catch (err) {
        return textResult(`Failed to query Pods: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'docker.container.list',
    title: 'Docker Container List',
    description: 'List all Docker containers',
    domain: 'containers',
    inputSchema: z.object({
      all: z.boolean().optional().default(false).describe('Whether to show all containers (including stopped ones)'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const containers = await dockerService.listContainers(Boolean(args.all));
        return jsonResult(
          containers,
          `Docker Container List (Total ${containers.length}):\\n${containers.map((c) => `• ${(c as unknown as Record<string, unknown>).name} (${(c as unknown as Record<string, unknown>).state}) ${(c as unknown as Record<string, unknown>).image}`).join('\n')}`
        );
      } catch (err) {
        return textResult(`Failed to get container list: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'docker.image.list',
    title: 'Docker Image List',
    description: 'List all Docker images',
    domain: 'containers',
    inputSchema: z.object({}),
    annotations: READONLY,
    handler: async (_args, _ctx) => {
      try {
        const images = await dockerService.listImages();
        return jsonResult(
          images,
          `Docker Image List (Total ${images.length}):\\n${images.map((img: any) => `• ${img.tags?.join(', ') || 'untagged'} (${img.size} bytes)`).join('\n')}`
        );
      } catch (err) {
        return textResult(`Failed to get image list: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'docker.container.logs',
    title: 'Docker Container Logs',
    description: 'Get logs for the specified Docker container',
    domain: 'containers',
    inputSchema: z.object({
      containerId: z.string().describe('Container ID'),
      tail: z.number().optional().default(100).describe('Tail Lines'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const logs = await dockerService.getContainerLogs(args.containerId as string, Number(args.tail) || 100);
        return textResult(`Container ${args.containerId} logs (last ${args.tail || 100} lines):\\n${logs}`);
      } catch (err) {
        return textResult(`Failed to get container logs: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'docker.container.stats',
    title: 'Docker Container Stats',
    description: 'Get Docker container resource usage statistics',
    domain: 'containers',
    inputSchema: z.object({
      containerId: z.string().describe('Container ID'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const stats = await dockerService.getContainerStats(args.containerId as string);
        return jsonResult(stats, `Container ${args.containerId} resource stats`);
      } catch (err) {
        return textResult(`Failed to get container stats: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'docker.container.info',
    title: 'Docker Container Details',
    description: 'Get Docker container configuration and status details',
    domain: 'containers',
    inputSchema: z.object({
      containerId: z.string().describe('Container ID'),
    }),
    annotations: READONLY,
    handler: async (args, _ctx) => {
      try {
        const info = await dockerService.getContainer(args.containerId as string);
        return jsonResult(info, `Container ${args.containerId} detailed info`);
      } catch (err) {
        return textResult(`Failed to get container details: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'docker.system.info',
    title: 'Docker System Info',
    description: 'Get Docker Engine system information',
    domain: 'containers',
    inputSchema: z.object({}),
    annotations: READONLY,
    handler: async (_args, _ctx) => {
      try {
        const info = await dockerService.getSystemInfo();
        return jsonResult(info, 'Docker System Info');
      } catch (err) {
        return textResult(`Failed to get Docker system info: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'docker.volume.list',
    title: 'Docker Volume List',
    description: 'List all Docker volumes',
    domain: 'containers',
    inputSchema: z.object({}),
    annotations: READONLY,
    handler: async (_args, _ctx) => {
      try {
        const volumes = await dockerService.listVolumes();
        return jsonResult(
          volumes,
          `Docker Volume List (Total ${volumes.length}):\\n${volumes.map((v: any) => `• ${v.name} (${v.driver})`).join('\n')}`
        );
      } catch (err) {
        return textResult(`Failed to get volume list: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },

  {
    name: 'docker.network.list',
    title: 'Docker Network List',
    description: 'List all Docker networks',
    domain: 'containers',
    inputSchema: z.object({}),
    annotations: READONLY,
    handler: async (_args, _ctx) => {
      try {
        const networks = await dockerService.listNetworks();
        return jsonResult(
          networks,
          `Docker Network List (Total ${networks.length}):\\n${networks.map((n) => `• ${n.name} (${n.driver})`).join('\n')}`
        );
      } catch (err) {
        return textResult(`Failed to get network list: ${(err as Error).message}`, true);
      }
    },
    enabled: true,
  },
];