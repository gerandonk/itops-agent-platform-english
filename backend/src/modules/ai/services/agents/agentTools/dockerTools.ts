/**
 * Docker 类工具（2026-07-21 拆分）
 * - docker-list-containers / -images / -volumes / -networks
 * - docker-container-logs / -stats / -info
 * - docker-system-info
 *
 * 字段大小写严格对齐 dockerService.ts 的类型定义（name/image/state 等小写驼峰）
 */
import { dockerService } from '../../../../containers/services/dockerService';
import { agentToolRegistry } from '../agentToolRegistry';

export function registerDockerTools(): void {
  // 11. Docker 容器列表工具
  agentToolRegistry.register({
    id: 'docker-list-containers',
    name: 'Docker Container List',
    description: 'List Docker containers',
    category: 'docker',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {
        all: { type: 'boolean', description: 'Include stopped containers', default: false },
      },
    },
    execute: async (args) => {
      const all = Boolean(args.all);
      try {
        const containers = await dockerService.listContainers(all);
        return `Docker 容器列表 (共${containers.length}个):\n${
          containers.map(c => `• ${c.name} (${c.state}) ${c.image}`).join('\n')
        }`;
      } catch (error) {
        return `Failed to get Docker container list: ${(error as Error).message}`;
      }
    },
  });

  // 12. Docker 镜像列表工具
  agentToolRegistry.register({
    id: 'docker-list-images',
    name: 'Docker Image List',
    description: 'List Docker images',
    category: 'docker',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      try {
        const images = await dockerService.listImages();
        return `Docker 镜像列表 (共${images.length}个):\n${
          images.map(img => `• ${img.tags.join(', ')} (${img.size} bytes)`).join('\n')
        }`;
      } catch (error) {
        return `Failed to get Docker image list: ${(error as Error).message}`;
      }
    },
  });

  // 13. Docker 容器日志工具
  agentToolRegistry.register({
    id: 'docker-container-logs',
    name: 'Docker Container Logs',
    description: 'Get Docker container logs',
    category: 'docker',
    riskLevel: 'low',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'Container ID' },
        tail: { type: 'number', description: 'Tail Lines', default: 100 },
      },
      required: ['containerId'],
    },
    execute: async (args) => {
      const containerId = args.containerId as string;
      const tail = (args.tail as number) || 100;
      try {
        const logs = await dockerService.getContainerLogs(containerId, tail);
        return `Logs for container ${containerId} (last ${tail} lines):\\n${logs}`;
      } catch (error) {
        return `Failed to get container logs: ${(error as Error).message}`;
      }
    },
  });

  // 14. Docker 容器统计工具
  agentToolRegistry.register({
    id: 'docker-container-stats',
    name: 'Docker Container Stats',
    description: 'Get Docker container stats',
    category: 'docker',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'Container ID' },
      },
      required: ['containerId'],
    },
    execute: async (args) => {
      const containerId = args.containerId as string;
      try {
        const stats = await dockerService.getContainerStats(containerId);
        return `Stats for container ${containerId}:\\n${JSON.stringify(stats, null, 2)}`;
      } catch (error) {
        return `Failed to get container stats: ${(error as Error).message}`;
      }
    },
  });

  // 15. Docker 容器详情工具
  agentToolRegistry.register({
    id: 'docker-container-info',
    name: 'Docker Container Details',
    description: 'Get Docker container details',
    category: 'docker',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {
        containerId: { type: 'string', description: 'Container ID' },
      },
      required: ['containerId'],
    },
    execute: async (args) => {
      const containerId = args.containerId as string;
      try {
        const containerInfo = await dockerService.getContainer(containerId);
        return `Details for container ${containerId}:\\n${JSON.stringify(containerInfo, null, 2)}`;
      } catch (error) {
        return `Failed to get container details: ${(error as Error).message}`;
      }
    },
  });

  // 16. Docker 系统信息工具
  agentToolRegistry.register({
    id: 'docker-system-info',
    name: 'Docker System Info',
    description: 'Get Docker system info',
    category: 'docker',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      try {
        const info = await dockerService.getSystemInfo();
        return `Docker system info:\\n${JSON.stringify(info, null, 2)}`;
      } catch (error) {
        return `Failed to get Docker system info: ${(error as Error).message}`;
      }
    },
  });

  // 17. Docker 卷列表工具
  agentToolRegistry.register({
    id: 'docker-list-volumes',
    name: 'Docker Volume List',
    description: 'List Docker volumes',
    category: 'docker',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      try {
        const volumes = await dockerService.listVolumes();
        return `Docker 卷列表 (共${volumes.length}个):\n${
          volumes.map(v => `• ${v.name} (${v.driver})`).join('\n')
        }`;
      } catch (error) {
        return `Failed to get Docker volume list: ${(error as Error).message}`;
      }
    },
  });

  // 18. Docker 网络列表工具
  agentToolRegistry.register({
    id: 'docker-list-networks',
    name: 'Docker Network List',
    description: 'List Docker networks',
    category: 'docker',
    riskLevel: 'readonly',
    auditEnabled: false,
    schema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      try {
        const networks = await dockerService.listNetworks();
        return `Docker 网络列表 (共${networks.length}个):\n${
          networks.map(n => `• ${n.name} (${n.driver})`).join('\n')
        }`;
      } catch (error) {
        return `Failed to get Docker network list: ${(error as Error).message}`;
      }
    },
  });
}