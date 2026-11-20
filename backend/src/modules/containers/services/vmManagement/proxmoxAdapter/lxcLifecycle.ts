/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '../../../../../utils/logger';
import type { VirtualMachine } from '../../../../../types/vmManagement';
import type { ProxmoxApiClient } from './apiClient';
import { mapGuestOS, mapPowerState, mapVMStatus, VMDeviceInfo, VMNicInfo } from './mappers';

/**
 * =============================================================================
 * Proxmox LXC 容器管理（只读能力：列容器 / 读详情）
 * =============================================================================
 */

/** 将 LXC 条目映射为 VirtualMachine（kind = 'lxc'） */
async function mapLXCEntry(client: ProxmoxApiClient, ct: any, config?: any, status?: any): Promise<VirtualMachine | null> {
  const vmId = String(ct.vmid);
  const cfg = config || {};
  const st = status || {};
  const statusStr = st.status || ct.status || 'stopped';
  const running = statusStr === 'running';

  const rootfs = String(cfg.rootfs || '');
  const sizeMatch = rootfs.match(/:(\d+)\s*$/);
  let sizeGB = sizeMatch ? parseInt(sizeMatch[1], 10) : 0;
  // LXC 的 rootfs 字符串通常不含大小，回退使用 status.maxdisk（字节）
  if (sizeGB <= 0 && st.maxdisk) {
    sizeGB = Math.round(st.maxdisk / (1024 * 1024 * 1024));
  }

  const netKey = Object.keys(cfg || {}).find((k) => k.startsWith('net'));
  const nics: VMNicInfo[] = [];
  if (netKey) {
    const netStr = String(cfg[netKey] || '');
    const macMatch = netStr.match(/hwaddr=([0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5,17})/i) || netStr.match(/([0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5,17})/i);
    const ipMatch = netStr.match(/ip=([^,]+)/i);
    const ipAddress = ipMatch && /^(\d{1,3}\.){3}\d{1,3}/.test(ipMatch[1]) ? ipMatch[1].split('/')[0] : undefined;
    nics.push({
      id: `${vmId}-${netKey}`,
      name: netKey,
      macAddress: macMatch ? macMatch[1] : undefined,
      ipAddress: ipAddress ? [ipAddress] : [],
      connected: true,
    });
  }

  const ipAddress = nics.length > 0 && nics[0].ipAddress && nics[0].ipAddress.length > 0 ? nics[0].ipAddress[0] : undefined;

  // LXC 的 mem 可能以 MB（config）或字节（status）形式报告，按数量级自动换算
  const rawMem = Number(cfg.mem || ct.mem || st.mem || 0);
  const memoryMB = rawMem > 100000 ? Math.round(rawMem / (1024 * 1024)) : rawMem;

  const disks: VMDeviceInfo[] = sizeGB > 0
    ? [{ id: `${vmId}-rootfs`, name: 'rootfs', sizeGB, type: 'thin' }]
    : [];

  return {
    id: vmId,
    name: cfg.name || ct.name || `lxc-${vmId}`,
    hypervisorType: 'proxmox',
    hypervisorId: client.platformId,
    kind: 'lxc',
    status: mapVMStatus(statusStr),
    powerState: mapPowerState(statusStr),
    guestOs: cfg.ostype ? mapGuestOS(cfg.ostype) : 'Linux',
    memoryMB,
    numCPUs: cfg.cpus || ct.cpus || st.cpus || 0,
    disks,
    networkInterfaces: nics,
    ipAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** 列出节点上的所有 LXC 容器（只读） */
export async function listLXCs(client: ProxmoxApiClient): Promise<VirtualMachine[]> {
  await client.ensureConnected();

  logger.info(`📋 获取 Proxmox LXC 容器列表 (节点: ${client.node})`);

  const result: VirtualMachine[] = [];

  try {
    const containers = await client.apiRequest('GET', `/nodes/${client.node}/lxc`);
    const list: any[] = Array.isArray(containers) ? containers : [];

    for (const ct of list) {
      const vmId = String(ct.vmid);
      try {
        const config = await client.apiRequest('GET', `/nodes/${client.node}/lxc/${vmId}/config`);
        const status = await client.apiRequest('GET', `/nodes/${client.node}/lxc/${vmId}/status/current`).catch(() => null);
        const vm = await mapLXCEntry(client, ct, config, status);
        if (vm) {
          result.push(vm);
        }
      } catch (err: any) {
        logger.warn(`⚠️ 跳过 Proxmox LXC 容器 ${vmId}: ${err?.message || err}`);
      }
    }
  } catch (error) {
    logger.error('❌ Failed to fetch Proxmox LXC list:', error);
  }

  return result;
}

/** 获取单个 LXC 容器详情（只读） */
export async function getLXC(client: ProxmoxApiClient, vmId: string): Promise<VirtualMachine | null> {
  const lxcList = await listLXCs(client);
  return lxcList.find((v) => v.id === vmId) || null;
}
