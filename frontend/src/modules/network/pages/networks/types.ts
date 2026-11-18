/**
 * Networks 类型定义（2026-07-21 拆分）
 *
 * 把原 Networks.tsx L14-67 的 3 个 interface 抽出
 * 包含：SubnetInfo + IpInfo + IpListData（不依赖任何外部上下文）
 *
 * 拆分原则遵循 ADR-031 §二.3 模式 3 + lessons-learned §3.5
 */

export interface SubnetInfo {
  id: string;
  name: string;
  cidr: string;
  gateway: string | null;
  vlan_id: number | null;
  network_type: string;
  location: string | null;
  description: string | null;
  total_ips: number;
  used_ips: number;
  status?: 'active' | 'planning';
}

export interface IpInfo {
  id: string;
  ip_address: string;
  status: 'available' | 'used' | 'reserved' | 'gateway';
  device_name?: string;
  device_id?: string;
  last_seen?: string;
  mac_address?: string;
}

export interface IpListData {
  ips: IpInfo[];
  stats: Array<{ status: string; count: number }>;
}

export interface SubnetFormData {
  name: string;
  cidr: string;
  gateway: string;
  vlan_id: string;
  network_type: string;
  location: string;
  description: string;
}

export const DEFAULT_SUBNET_FORM: SubnetFormData = {
  name: '',
  cidr: '',
  gateway: '',
  vlan_id: '',
  network_type: 'lan',
  location: '',
  description: '',
};

/** subnet 类型 map */
export const TYPE_MAP: Record<string, { label: string; color: string }> = {
  lan: { label: 'LAN', color: 'bg-blue-500/20 text-blue-400' },
  dmz: { label: 'DMZ', color: 'bg-orange-500/20 text-orange-400' },
  wan: { label: 'WAN', color: 'bg-green-500/20 text-green-400' },
  storage: { label: 'Storage network', color: 'bg-purple-500/20 text-purple-400' },
  management: { label: 'Management network', color: 'bg-yellow-500/20 text-yellow-400' },
  other: { label: 'Other', color: 'bg-gray-500/20 text-gray-400' },
};

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Online', color: 'bg-green-500/20 text-green-400' },
  planning: { label: 'Planned', color: 'bg-gray-500/20 text-gray-400' },
};

export const IP_STATUS_MAP: Record<string, { label: string; className: string }> = {
  available: { label: 'Available', className: 'text-blue-400' },
  used: { label: 'Used', className: 'text-green-400' },
  reserved: { label: 'Reserved', className: 'text-yellow-400' },
  gateway: { label: 'Gateway', className: 'text-purple-400' },
};

export type IpBatchAction = 'use' | 'reserve' | 'release';
