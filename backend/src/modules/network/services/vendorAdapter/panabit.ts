import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
//  Panabit 流控网关适配器
// ====================================================================
//  Panabit 是国产专业的网络流量管理设备（流控网关、流量整形、上网行为管理）
// 命令风格类似 FreeBSD（基于 CLI），但有自己独有的流量分析/策略相关命令。
// 核心命令前缀：show / view / flowstat / ifstat / nat / policy
// ====================================================================
export class PanabitAdapter implements VendorAdapter {
  vendor: VendorType = 'panabit';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show sys cpu', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show sys mem', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show ifstat', description: 'View interface traffic and status' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check system version' },
    log: { type: 'log', name: 'System Logs', command: 'show log', description: 'View system logs' },
    session: { type: 'session', name: 'Concurrent Sessions', command: 'show flowstat session', description: 'View current concurrent sessions count' },
    nat: { type: 'nat', name: 'NAT Status', command: 'show nat rule', description: 'View NAT rules' },
    security_policy: { type: 'security_policy', name: 'Policy Hits', command: 'show policy hit', description: 'View traffic policy hit count' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show ip route', description: 'View routing table' },
    arp: { type: 'arp', name: 'ARP table', command: 'show arp', description: 'View ARP table' },
    neighbor: { type: 'neighbor', name: 'Neighbor Discovery', command: 'show lldp neighbor', description: 'View LLDP neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp status', description: 'View NTP status' },
    dns: { type: 'dns', name: 'DNS Status', command: 'show dns server', description: 'View DNS configuration' },
    license: { type: 'license', name: 'Authorization Information', command: 'show license', description: 'View authorization information' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Summary', command: 'show running-config | include hostname', description: 'View configuration summary' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return false; }
}
