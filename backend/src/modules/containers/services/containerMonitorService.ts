import Docker from 'dockerode';
import { dockerService } from './dockerService';
import { multiHostDockerService } from './multiHostDockerService';
import { logger } from '../../../utils/logger';
import type { Server as SocketIOServer } from 'socket.io';
import { getErrorMessage } from '../../../utils/errorHelpers';

interface MonitorEntry {
  interval: NodeJS.Timeout;
  endpointId?: string;
}

class ContainerMonitorService {
  private intervals: Map<string, MonitorEntry> = new Map();
  private io: SocketIOServer | null = null;

  setIO(io: SocketIOServer) {
    this.io = io;
  }

  private getDockerClient(endpointId?: string): Docker {
    if (endpointId && endpointId !== 'local') {
      return multiHostDockerService.getDockerClient(endpointId);
    }
    // local: prefer initialized singleton client, fallback to new socket client
    if (dockerService.isAvailable()) return dockerService.docker;
    return new Docker({ socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock' });
  }

  private async getContainerStats(docker: Docker, id: string) {
    const container = docker.getContainer(id);
    const stats = await container.stats({ stream: false }) as any;
    const cpuDelta = (stats.cpu_stats?.cpu_usage?.total_usage || 0) - (stats.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta = (stats.cpu_stats?.system_cpu_usage || 0) - (stats.precpu_stats?.system_cpu_usage || 0);
    const onlineCpus = stats.cpu_stats?.online_cpus || stats.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
    const cpuPercent = systemDelta > 0 && cpuDelta > 0 ? (cpuDelta / systemDelta) * onlineCpus * 100 : 0;
    const memoryUsage = (stats.memory_stats?.usage || 0) - (stats.memory_stats?.stats?.cache || 0);
    const memoryLimit = stats.memory_stats?.limit || 0;
    const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;
    return {
      cpuPercent: cpuPercent.toFixed(2),
      memory: {
        usage: memoryUsage,
        limit: memoryLimit,
        percent: memoryPercent.toFixed(2),
      },
      network: stats.networks,
      pids: stats.pids_stats?.current || 0,
      read: stats.read,
    };
  }

  private async getContainerName(docker: Docker, id: string): Promise<string> {
    const container = docker.getContainer(id);
    const info = await container.inspect();
    return (info.Name || '').replace(/^\//, '') || id.substring(0, 12);
  }

  /**
   * 开始监控指定容器，定期推送统计信息到 WebSocket
   * @param containerId - Docker 容器 ID
   * @param intervalMs - 采集间隔（毫秒），默认 5000
   * @param endpointId - Docker endpoint ID（可选，默认本地）
   */
  startMonitoring(containerId: string, intervalMs = 5000, endpointId?: string): void {
    if (this.intervals.has(containerId)) return;

    logger.info(`📊 Starting container monitoring: ${containerId} (endpoint: ${endpointId || 'local'})`);

    const docker = this.getDockerClient(endpointId);
    const interval = setInterval(async () => {
      try {
        const [stats, name] = await Promise.all([
          this.getContainerStats(docker, containerId),
          this.getContainerName(docker, containerId),
        ]);

        if (this.io) {
          this.io.to(`container:${containerId}`).emit('container:stats', {
            containerId,
            name,
            endpointId: endpointId || 'local',
            ...stats,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: unknown) {
        logger.error(`Monitor error for ${containerId}:`, getErrorMessage(err));
        this.stopMonitoring(containerId);
      }
    }, intervalMs);

    this.intervals.set(containerId, { interval, endpointId });
  }

  /**
   * 停止监控指定容器
   */
  stopMonitoring(containerId: string): void {
    const entry = this.intervals.get(containerId);
    if (entry) {
      clearInterval(entry.interval);
      this.intervals.delete(containerId);
      logger.info(`📊 Stopped container monitoring: ${containerId}`);
    }
  }

  /**
   * 停止所有监控
   */
  stopAll(): void {
    this.intervals.forEach((entry) => clearInterval(entry.interval));
    this.intervals.clear();
  }

  /**
   * 获取正在监控的容器列表
   */
  getMonitoredContainers(): string[] {
    return Array.from(this.intervals.keys());
  }

  /**
   * 获取所有运行中容器的摘要统计（一次性快照）
   */
  async getClusterSnapshot(endpointId?: string): Promise<unknown> {
    try {
      const docker = this.getDockerClient(endpointId);
      const containers = await docker.listContainers({ all: true });
      const running = containers.filter((c: any) => c.State === 'running');
      const statsPromises = running
        .slice(0, 50)
        .map(async (c: any) => {
          try {
            const stats = await this.getContainerStats(docker, c.Id);
            const name = (c.Names?.[0] || '').replace(/^\//, '') || c.Id.substring(0, 12);
            return { id: c.Id, name, ...stats };
          } catch { return null; }
        });

      const results = (await Promise.all(statsPromises)).filter(Boolean);

      let totalCpu = 0, totalMemUsage = 0, totalMemLimit = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.forEach((r: any) => {
        totalCpu += parseFloat(r.cpuPercent || 0);
        totalMemUsage += r.memory?.usage || 0;
        totalMemLimit += r.memory?.limit || 0;
      });

      return {
        containerCount: containers.length,
        runningCount: running.length,
        totalContainers: containers.length,
        runningContainers: running.length,
        totalCpuPercent: totalCpu.toFixed(2),
        totalMemUsage,
        totalMemLimit,
        totalMemoryUsage: totalMemUsage,
        totalMemoryLimit: totalMemLimit,
        totalMemPercent: totalMemLimit > 0 ? ((totalMemUsage / totalMemLimit) * 100).toFixed(2) : '0',
        totalMemoryPercent: totalMemLimit > 0 ? ((totalMemUsage / totalMemLimit) * 100).toFixed(2) : '0',
        containers: results,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.error('Cluster snapshot error:', err);
      return null;
    }
  }
}

export const containerMonitorService = new ContainerMonitorService();
