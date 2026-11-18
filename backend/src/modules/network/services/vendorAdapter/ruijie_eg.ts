import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// 锐捷 EG 出口网关适配器（独立命令集）
// ====================================================================
export class RuijieEgAdapter implements VendorAdapter {
  vendor: VendorType = 'ruijie_eg';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show cpu', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show memory', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interface brief', description: 'Check interface status' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check system version' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show ip route', description: 'View routing table' },
    log: { type: 'log', name: 'System Logs', command: 'show log', description: 'View system logs' },
    nat: { type: 'nat', name: 'NAT Translation', command: 'show ip nat translations', deviceTypes: ['firewall', 'gateway', 'router'], description: 'View NAT translation table' },
    security_policy: { type: 'security_policy', name: 'Security Policies', command: 'show security-policy', deviceTypes: ['firewall', 'gateway'], description: 'View security policies' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show ip dhcp server statistics', deviceTypes: ['router', 'gateway'], description: 'View DHCP status' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show dns server', description: 'View DNS servers' },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp neighbors', description: 'View LLDP neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp status', description: 'View NTP status' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Summary', command: 'show running-config | include hostname', description: 'View configuration summary' },
    session: { type: 'session', name: 'Connection Statistics', command: 'show session statistics', deviceTypes: ['firewall', 'gateway'], description: 'View concurrent connection statistics' },
    vpn: { type: 'vpn', name: 'VPN Tunnels', command: 'show ike sa', fallbackCommands: ['show ipsec sa'], deviceTypes: ['firewall', 'gateway'], description: 'View VPN tunnels' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
