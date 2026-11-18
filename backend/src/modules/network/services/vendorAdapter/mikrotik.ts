import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// MikroTik RouterOS 适配器
// ====================================================================
export class MikrotikAdapter implements VendorAdapter {
  vendor: VendorType = 'mikrotik';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: '/system resource print', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: '/system resource print', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: '/interface print detail', description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: '/system resource print', description: 'Check RouterOS version' },
    routes: { type: 'routes', name: 'Routing Table', command: '/ip route print detail', description: 'View routing table' },
    log: { type: 'log', name: 'Recent Logs', command: '/log print where topics=critical,warning,error', description: 'View recent important logs' },
    nat: { type: 'nat', name: 'NAT Rules', command: '/ip firewall nat print', description: 'View NAT rules', deviceTypes: ['firewall', 'router', 'gateway'] },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: '/ip neighbor print', description: 'View neighbor discovery information' },
    bgp: { type: 'bgp', name: 'BGP Status', command: '/routing bgp peer print', deviceTypes: ['router'], description: 'View BGP neighbors' },
    ospf: { type: 'ospf', name: 'OSPF Status', command: '/routing ospf neighbor print', deviceTypes: ['router'], description: 'View OSPF neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: '/system ntp client print', description: 'View NTP client status' },
    pool: { type: 'pool', name: 'DHCP Pool', command: '/ip dhcp-server lease print', deviceTypes: ['router', 'gateway'], description: 'View DHCP leases' },
    dns: { type: 'dns', name: 'DNS Configuration', command: '/ip dns print', description: 'View DNS configuration' },
    vlan: { type: 'vlan', name: 'VLAN Interfaces', command: '/interface vlan print', description: 'View VLAN interfaces' },
    arp: { type: 'arp', name: 'ARP table', command: '/ip arp print', description: 'View ARP table' },
    wlan: { type: 'wlan', name: 'Wireless Status', command: '/interface wireless registration-table print', deviceTypes: ['ap', 'wlc'], description: 'View wireless clients' },
    license: { type: 'license', name: 'License Level', command: '/system license print', description: 'View License level and expiration time' },
    security_policy: { type: 'security_policy', name: 'Firewall Rules', command: '/ip firewall filter print', description: 'View firewall filtering rules', deviceTypes: ['firewall', 'router', 'gateway'] },
    config_checksum: { type: 'config_checksum', name: 'Configuration Snapshot', command: '/export terse | include /system identity', description: 'View configuration summary' },
    environment: { type: 'environment', name: 'Hardware Status', command: '/system health print', description: 'View temperature/voltage/fans' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return false; }
}
