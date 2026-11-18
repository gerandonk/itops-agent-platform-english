import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// Palo Alto 防火墙适配器
// ====================================================================
export class PaloAltoAdapter implements VendorAdapter {
  vendor: VendorType = 'paloalto';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show system resources | match cpu', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show system resources | match mem', fallbackCommands: ['show system resources'], description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interface all', description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'show system info | match sw-version', fallbackCommands: ['show system info'], description: 'View PAN-OS version' },
    log: { type: 'log', name: 'Recent Logs', command: 'show log system direction equal forward | tail 30', description: 'View recent system logs' },
    security_policy: { type: 'security_policy', name: 'Security Policies', command: 'show running security-policy', description: 'View all security policies', deviceTypes: ['firewall'] },
    nat: { type: 'nat', name: 'NAT Policies', command: 'show running nat-policy', description: 'View NAT policies', deviceTypes: ['firewall', 'gateway'] },
    session: { type: 'session', name: 'Session Statistics', command: 'show session info', fallbackCommands: ['show session summary'], description: 'View session statistics', deviceTypes: ['firewall'] },
    vpn: { type: 'vpn', name: 'VPN Tunnels', command: 'show vpn ipsec tunnel', description: 'View IPSec VPN tunnels', deviceTypes: ['firewall', 'gateway'] },
    routes: { type: 'routes', name: 'Routing Table', command: 'show routing route', description: 'View routing table', deviceTypes: ['firewall', 'router'] },
    bgp: { type: 'bgp', name: 'BGP Status', command: 'show routing protocol bgp summary', deviceTypes: ['firewall', 'router'], description: 'View BGP neighbors' },
    ospf: { type: 'ospf', name: 'OSPF Status', command: 'show routing protocol ospf neighbor', deviceTypes: ['firewall', 'router'], description: 'View OSPF neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp status', description: 'View NTP synchronization' },
    license: { type: 'license', name: 'License Status', command: 'show license info', description: 'View License expiration date' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show dhcp server lease', deviceTypes: ['firewall', 'gateway', 'router'], description: 'View DHCP leases' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show dns proxy config', description: 'View DNS proxy configuration' },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp neighbors', description: 'View LLDP neighbors' },
    environment: { type: 'environment', name: 'Hardware Status', command: 'show system environment', description: 'View temperature/fans' },
    power: { type: 'power', name: 'Power Status', command: 'show system environment power', description: 'View power module status' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Snapshot', command: 'show config diff | match serial', description: 'View configuration summary' },
    arp: { type: 'arp', name: 'ARP table', command: 'show arp all', description: 'View ARP table' },
    vlan: { type: 'vlan', name: 'VLAN Interfaces', command: 'show interface all | match vlan', deviceTypes: ['switch'], description: 'View VLAN interfaces' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
