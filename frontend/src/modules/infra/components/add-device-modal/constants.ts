/**
 * AddDeviceModal 常量（2026-07-21 拆分）
 *
 * 把原 AddDeviceModal.tsx L55-65 + L240-243 的常量抽出
 * 包含：vendors（来自 @/config/vendors）+ roles + tab 配置
 *
 * 注：DEVICE_VENDORS 已在 @/config/vendors 统一维护，本模块仅 re-export 方便 widget import
 *
 * 拆分原则遵循 ADR-031 §二.3 模式 5 + lessons-learned §3.5
 */

import { Lock, Radio } from 'lucide-react';
import { DEVICE_VENDORS } from '@/config/vendors';
import type { DeviceTab } from './types';

export const vendors = DEVICE_VENDORS;

export const roles: Array<{ value: string; label: string }> = [
  { value: 'router', label: 'Router' },
  { value: 'switch', label: 'Switch' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'ap', label: 'Wireless AP' },
  { value: 'other', label: 'Other' },
];

export const tabs: DeviceTab[] = [
  { key: 'ssh', label: 'SSH connection' },
  { key: 'snmp', label: 'SNMP monitoring' },
];

export const TAB_ICONS: Record<string, typeof Lock> = {
  ssh: Lock,
  snmp: Radio,
};
