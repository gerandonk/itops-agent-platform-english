/* eslint-disable @typescript-eslint/no-explicit-any */
import type { VirtualMachine } from '../../../../../types/vmManagement';

export interface VMDeviceInfo {
  id: string;
  name: string;
  sizeGB: number;
  type: 'thin' | 'thick';
}

export interface VMNicInfo {
  id: string;
  name: string;
  macAddress?: string;
  ipAddress: string[];
  connected: boolean;
}

/** 从 VM config JSON 中提取磁盘设备信息 */
export function extractDisksFromConfig(config: Record<string, any>, vmId: string): VMDeviceInfo[] {
  const disks: VMDeviceInfo[] = [];
  for (const key of Object.keys(config || {})) {
    if (key.startsWith('scsi') || key.startsWith('virtio') || key.startsWith('sata')) {
      const match = String(config[key] || '').match(/size=(\d+)G/i);
      disks.push({
        id: `${vmId}-${key}`,
        name: key,
        sizeGB: match ? parseInt(match[1], 10) : 0,
        type: 'thin',
      });
    }
  }
  return disks;
}

/** 从 VM config JSON 中提取网络接口信息 */
export function extractNicsFromConfig(config: Record<string, any>, vmId: string): VMNicInfo[] {
  const nics: VMNicInfo[] = [];
  for (const key of Object.keys(config || {})) {
    if (key.startsWith('net')) {
      const macMatch = String(config[key] || '').match(/([0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5,17})/i);
      nics.push({
        id: `${vmId}-${key}`,
        name: key,
        macAddress: macMatch ? macMatch[1] : undefined,
        ipAddress: [],
        connected: true,
      });
    }
  }
  return nics;
}

export function mapVM(vm: any, platformId: string): VirtualMachine {
  const status = mapVMStatus(vm.status);
  const powerState = mapPowerState(vm.status);

  return {
    id: String(vm.vmid),
    name: vm.name || `vm-${vm.vmid}`,
    hypervisorType: 'proxmox',
    hypervisorId: platformId,
    status,
    powerState,
    guestOs: mapGuestOS(vm.ostype),
    memoryMB: vm.maxmem ? Math.round(vm.maxmem / (1024 * 1024)) : 0,
    numCPUs: vm.cpus || 0,
    disks: [],
    networkInterfaces: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mapVMFromConfig(data: any, platformId: string): VirtualMachine {
  const status = mapVMStatus(data.status || data.lock ? 'locked' : 'running');
  const powerState = mapPowerState(data.status);

  const disks: any[] = [];
  const nics: any[] = [];

  for (const key of Object.keys(data)) {
    if (key.startsWith('scsi') || key.startsWith('virtio') || key.startsWith('sata')) {
      const match = data[key]?.match(/size=(\d+)G/i);
      disks.push({
        id: `${data.id}-${key}`,
        name: key,
        sizeGB: match ? parseInt(match[1]) : 0,
        type: 'thin' as const,
      });
    }
    if (key.startsWith('net')) {
      const macMatch = data[key]?.match(/([0-9A-Fa-f:]{17})/i);
      nics.push({
        id: `${data.id}-${key}`,
        name: key,
        macAddress: macMatch ? macMatch[1] : undefined,
        ipAddress: [],
        connected: true,
      });
    }
  }

  return {
    id: String(data.id),
    name: data.name || `vm-${data.id}`,
    hypervisorType: 'proxmox',
    hypervisorId: platformId,
    status,
    powerState,
    guestOs: mapGuestOS(data.ostype),
    memoryMB: data.memory || 0,
    numCPUs: data.cores || 0,
    disks,
    networkInterfaces: nics,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mapVMStatus(status: string): 'running' | 'stopped' | 'paused' | 'suspended' | 'unknown' {
  switch (status) {
    case 'running':
      return 'running';
    case 'stopped':
      return 'stopped';
    case 'paused':
      return 'paused';
    case 'suspended':
      return 'suspended';
    default:
      return 'unknown';
  }
}

export function mapPowerState(status: string): 'poweredOn' | 'poweredOff' | 'suspended' | 'unknown' {
  switch (status) {
    case 'running':
      return 'poweredOn';
    case 'stopped':
      return 'poweredOff';
    case 'paused':
    case 'suspended':
      return 'suspended';
    default:
      return 'unknown';
  }
}

export function mapStorageType(type: string): 'vmfs' | 'nfs' | 'iscsi' | 'local' | 'other' {
  switch (type) {
    case 'lvm':
    case 'lvmthin':
    case 'dir':
      return 'local';
    case 'nfs':
      return 'nfs';
    case 'iscsi':
      return 'iscsi';
    default:
      return 'other';
  }
}

// 将 Proxmox ostype 编码映射为可读的操作系统名称
// 例如: l26 -> "Linux", debian12 -> "Debian 12", win10 -> "Windows 10", ubuntu64 -> "Ubuntu 64"
export function mapGuestOS(ostype?: string): string {
  const raw = (ostype || '').trim().toLowerCase();
  if (!raw) return 'Unknown';

  const familyMap: Record<string, string> = {
    l26: 'Linux', l24: 'Linux', linux: 'Linux', linux2: 'Linux',
    debian: 'Debian', ubuntu: 'Ubuntu', centos: 'CentOS', fedora: 'Fedora',
    opensuse: 'openSUSE', opensuseleap: 'openSUSE', sles: 'SUSE Linux Enterprise', suse: 'SUSE Linux Enterprise',
    archlinux: 'Arch Linux', alpine: 'Alpine Linux', gentoo: 'Gentoo', nixos: 'NixOS',
    solaris: 'Solaris', freebsd: 'FreeBSD', mandriva: 'Mandriva', unmanaged: 'Unknown', other: 'Unknown',
  };
  const versionMatch = raw.match(/^([a-z]+)(\d+)$/);
  const base = versionMatch ? versionMatch[1] : raw;
  const version = versionMatch ? versionMatch[2] : '';
  const family = familyMap[raw] || familyMap[base];
  if (family) {
    // 形如 "l26" / "l24" / "linux" 等无版本后缀的家族编码
    if (versionMatch && familyMap[raw]) {
      return family;
    }
    return version ? `${family} ${version}` : family;
  }

  const winMap: Record<string, string> = {
    w2k: 'Windows 2000', w2k3: 'Windows Server 2003', w2k8: 'Windows Server 2008', wxp: 'Windows XP', wvista: 'Windows Vista',
    win: 'Windows', win7: 'Windows 7', win8: 'Windows 8/Server 2012', win10: 'Windows 10/Server 2016/2019', win11: 'Windows 11/Server 2022',
  };
  const winFamily = winMap[base] || winMap[raw];
  if (winFamily) {
    const winVersionMatch = raw.match(/^w(?:in)?(\d+)$/);
    const winVersion = winVersionMatch ? winVersionMatch[1] : '';
    const winName = winVersion ? `${winFamily} ${winVersion}` : winFamily;
    return winVersion ? winName : winFamily;
  }

  return raw;
}

/** 从 guest agent get-osinfo 响应中提取可读的 OS 名称 */
export function resolveGuestOSName(osInfo: any): string | undefined {
  const pretty = osInfo?.['pretty-name'] || osInfo?.prettyName || osInfo?.pretty_name;
  if (pretty) return pretty;
  const name = osInfo?.name || osInfo?.osName;
  const version = osInfo?.version;
  if (name) {
    return version ? `${name} ${version}` : name;
  }
  const id = osInfo?.id;
  if (id) return id;
  return undefined;
}
