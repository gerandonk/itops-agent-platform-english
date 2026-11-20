/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '../../../../../utils/logger';
import type {
  VirtualMachine,
  CreateVMRequest,
  CloneVMRequest,
} from '../../../../../types/vmManagement';
import type { ProxmoxApiClient } from './apiClient';
import { mapVM, mapVMFromConfig, extractDisksFromConfig, extractNicsFromConfig, mapGuestOS, resolveGuestOSName } from './mappers';
import { getLXC } from './lxcLifecycle';
import { powerOnVM } from './vmPower';

export async function listVMs(client: ProxmoxApiClient): Promise<VirtualMachine[]> {
  await client.ensureConnected();

  logger.info(`📋 获取 Proxmox 虚拟机列表 (节点: ${client.node})`);

  try {
    const vms = await client.apiRequest('GET', `/nodes/${client.node}/qemu`);
    const mapped = vms.map((vm: any) => mapVM(vm, client.platformId));

    // 补充磁盘 / 网络接口 / OS / IP 等详情（从单 VM config + guest agent 获取）
    const enriched = await Promise.all(
      mapped.map(async (vm: VirtualMachine) => {
        try {
          const config = await client.apiRequest('GET', `/nodes/${client.node}/qemu/${vm.id}/config`);
          const disks = extractDisksFromConfig(config, vm.id);
          const nics = extractNicsFromConfig(config, vm.id);
          const enrichedVm: VirtualMachine = {
            ...vm,
            disks: disks.length > 0 ? disks : vm.disks,
            networkInterfaces: nics.length > 0 ? nics : vm.networkInterfaces,
            guestOs: config.ostype ? mapGuestOS(config.ostype) : vm.guestOs,
          };

          // 通过 QEMU guest agent 获取更详细的操作系统信息（如有安装）
          // 例如: "Ubuntu 24.04.1 LTS"；agent 不可用时回退到 ostype 映射
          try {
            const osinfo = await client.apiRequest('GET', `/nodes/${client.node}/qemu/${vm.id}/agent/get-osinfo`);
            const osInfo: any = (osinfo as any)?.result ?? (osinfo as any)?.osinfo ?? (osinfo as any)?.data?.result ?? (osinfo as any)?.data ?? osinfo;
            const osName = resolveGuestOSName(osInfo);
            if (osName) {
              enrichedVm.guestOs = osName;
            }
          } catch {
            // guest agent OS 信息不可用时，保留 ostype 映射结果
          }

          // 通过 QEMU guest agent 获取网络接口 IP（若 agent 已安装且运行）
          try {
            const agentData = await client.apiRequest('GET', `/nodes/${client.node}/qemu/${vm.id}/agent/network-get-interfaces`);
            const interfaces = (agentData as any)?.result;
            if (Array.isArray(interfaces)) {
              for (const iface of interfaces) {
                const ipAddresses = (iface?.['ip-addresses'] || []).filter(
                  (a: any) => a?.['ip-address-type'] === 'ipv4' && a?.['ip-address'],
                );
                if (ipAddresses.length > 0 && iface?.name && iface.name !== 'lo') {
                  const target = enrichedVm.networkInterfaces?.find((n) => n.name === iface.name) || enrichedVm.networkInterfaces?.[0];
                  if (target) {
                    target.ipAddress = ipAddresses.map((a: any) => a['ip-address']).filter(Boolean);
                  }
                }
              }
            }
          } catch {
            // guest agent 不可用/未安装时忽略，保留 config 层的信息
          }

          // 汇总第一个可用 IP 到顶层 ipAddress
          const firstIp = enrichedVm.networkInterfaces
            ?.flatMap((n) => n.ipAddress || [])
            .find((ip) => ip);
          if (firstIp) {
            enrichedVm.ipAddress = firstIp;
          }

          return enrichedVm;
        } catch {
          return vm;
        }
      }),
    );

    return enriched;
  } catch (error) {
    logger.error('❌ Failed to fetch Proxmox VM list:', error);
    throw error;
  }
}

export async function getVM(client: ProxmoxApiClient, vmId: string): Promise<VirtualMachine | null> {
  await client.ensureConnected();

  logger.info(`📋 获取 Proxmox 虚拟机详情: ${vmId}`);

  try {
    const config = await client.apiRequest('GET', `/nodes/${client.node}/qemu/${vmId}/config`);
    const status = await client.apiRequest('GET', `/nodes/${client.node}/qemu/${vmId}/status/current`);
    return mapVMFromConfig({ id: vmId, ...config, ...status }, client.platformId);
  } catch (error) {
    // 若为 LXC 容器，尝试走 LXC 接口
    try {
      const lxcVm = await getLXC(client, vmId);
      if (lxcVm) {
        return lxcVm;
      }
    } catch {
      // LXC 查询失败时，继续抛出原始错误
    }
    logger.error(`❌ 获取 Proxmox 虚拟机 ${vmId} 详情失败:`, error);
    return null;
  }
}

export async function createVM(client: ProxmoxApiClient, request: CreateVMRequest): Promise<VirtualMachine> {
  await client.ensureConnected();

  logger.info(`🚀 创建 Proxmox 虚拟机: ${request.name}`);

  const body: Record<string, any> = {
    vmid: 0,
    name: request.name,
    memory: request.config.memoryMB,
    cores: request.config.numCPUs,
    sockets: 1,
    ostype: 'l26',
    scsihw: 'virtio-scsi-pci',
    net0: 'virtio,bridge=vmbr0',
  };

  if (request.config.disks && request.config.disks.length > 0) {
    const disk = request.config.disks[0];
    body.scsi0 = `local-lvm:${disk.sizeGB}`;
  }

  if (request.config.description) {
    body.description = request.config.description;
  }

  try {
    const result = await client.apiRequest('POST', `/nodes/${client.node}/qemu`, body);
    if (result.upid) {
      await client.waitForTask(result.upid);
    }

    if (request.powerOn) {
      await powerOnVM(client, String(body.vmid === 0 ? 0 : body.vmid));
    }

    const vm: VirtualMachine = {
      id: String(body.vmid === 0 ? result : body.vmid),
      name: request.name,
      hypervisorType: 'proxmox',
      hypervisorId: client.platformId,
      status: request.powerOn ? 'running' : 'stopped',
      powerState: request.powerOn ? 'poweredOn' : 'poweredOff',
      memoryMB: request.config.memoryMB,
      numCPUs: request.config.numCPUs,
      disks: request.config.disks,
      networkInterfaces: request.config.networkInterfaces,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return vm;
  } catch (error) {
    logger.error('❌ Failed to create Proxmox VM:', error);
    throw error;
  }
}

export async function cloneVM(client: ProxmoxApiClient, request: CloneVMRequest): Promise<VirtualMachine> {
  await client.ensureConnected();

  logger.info(`📋 克隆 Proxmox 虚拟机: ${request.vmId} -> ${request.name}`);

  const sourceVM = await getVM(client, request.vmId);
  if (!sourceVM) {
    throw new Error('Source virtual machine does not exist');
  }

  const body: Record<string, any> = {
    newid: 0,
    name: request.name,
  };

  if (request.snapshotId) {
    body.snapname = request.snapshotId;
  }

  try {
    const result = await client.apiRequest(
      'POST',
      `/nodes/${client.node}/qemu/${request.vmId}/clone`,
      body
    );

    if (result.upid) {
      await client.waitForTask(result.upid);
    }

    if (request.powerOn) {
      await powerOnVM(client, String(request.vmId));
    }

    return {
      ...sourceVM,
      id: String(request.vmId),
      name: request.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      powerState: request.powerOn ? 'poweredOn' : 'poweredOff',
      status: request.powerOn ? 'running' : 'stopped',
    };
  } catch (error) {
    logger.error('❌ Failed to clone Proxmox VM:', error);
    throw error;
  }
}

export async function deleteVM(client: ProxmoxApiClient, vmId: string): Promise<void> {
  await client.ensureConnected();

  logger.info(`🗑️ 删除 Proxmox 虚拟机: ${vmId}`);

  try {
    const result = await client.apiRequest(
      'DELETE',
      `/nodes/${client.node}/qemu/${vmId}`
    );
    if (result?.upid) {
      await client.waitForTask(result.upid);
    }
  } catch (error) {
    logger.error(`❌ 删除 Proxmox 虚拟机 ${vmId} 失败:`, error);
    throw error;
  }
}
