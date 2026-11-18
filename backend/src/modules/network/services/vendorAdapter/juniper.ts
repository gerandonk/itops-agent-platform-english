import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// Juniper JunOS 适配器
// ====================================================================
export class JuniperAdapter implements VendorAdapter {
  vendor: VendorType = 'juniper';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show system processes extensive | match idle', fallbackCommands: ['show chassis routing-engine'], description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show system memory', fallbackCommands: ['show chassis routing-engine'], description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interfaces terse', description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check JunOS version and uptime' },
    log: { type: 'log', name: 'Recent Logs', command: 'show log messages | last 30', description: 'View recent system logs' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show route summary', fallbackCommands: ['show route protocol static'], description: 'View routing table summary' },
    security_policy: { type: 'security_policy', name: 'Security Policies', command: 'show security policies', description: 'View security policies', deviceTypes: ['firewall'] },
    nat: { type: 'nat', name: 'NAT Policies', command: 'show security nat source rule', fallbackCommands: ['show security nat dest rule'], description: 'View NAT rules', deviceTypes: ['firewall', 'gateway'] },
    session: { type: 'session', name: 'Session Statistics', command: 'show security flow session summary', description: 'View session statistics', deviceTypes: ['firewall'] },
    vpn: { type: 'vpn', name: 'VPN Tunnels', command: 'show security ipsec security-associations', fallbackCommands: ['show security ike security-associations'], description: 'View IPSec VPN tunnels', deviceTypes: ['firewall', 'gateway'] },
    bgp: { type: 'bgp', name: 'BGP Status', command: 'show bgp summary', deviceTypes: ['router', 'firewall'], description: 'View BGP neighbors' },
    ospf: { type: 'ospf', name: 'OSPF Status', command: 'show ospf neighbor', deviceTypes: ['router', 'switch'], description: 'View OSPF neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp associations', description: 'View NTP synchronization status' },
    license: { type: 'license', name: 'License Information', command: 'show system license', description: 'View License information' },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp neighbors', description: 'View LLDP neighbors' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show dhcp server binding', deviceTypes: ['router', 'switch'], description: 'View DHCP binding information' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show system name-server', description: 'View DNS server configuration' },
    environment: { type: 'environment', name: 'Environmental Status', command: 'show chassis hardware', fallbackCommands: ['show chassis environment'], description: 'View chassis hardware information' },
    power: { type: 'power', name: 'Power Status', command: 'show chassis power', description: 'View power status' },
    fan: { type: 'fan', name: 'Fan Status', command: 'show chassis fan', description: 'View fan status' },
    stp: { type: 'stp', name: 'STP Status', command: 'show spanning-tree interface', description: 'View STP status' },
    vlan: { type: 'vlan', name: 'VLAN Information', command: 'show vlans', description: 'View VLAN configuration' },
    arp: { type: 'arp', name: 'ARP table', command: 'show arp', description: 'View ARP table' },
    mac: { type: 'mac', name: 'MAC Address Table', command: 'show ethernet-switching table', deviceTypes: ['switch'], description: 'View MAC address table' },
    optic: { type: 'optic', name: 'Optical Transceiver Information', command: 'show interfaces diagnostics optics', deviceTypes: ['switch'], description: 'View optical transceiver parameters' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Signature', command: 'show configuration checksum', description: 'View running configuration MD5 signature' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return false; } // JunOS 通常用 SSH key
}
