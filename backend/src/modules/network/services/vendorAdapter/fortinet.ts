import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// Fortinet FortiGate 防火墙适配器
// ====================================================================
export class FortinetAdapter implements VendorAdapter {
  vendor: VendorType = 'fortinet';
  private templates: Record<InspectionType, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'get system performance status', fallbackCommands: ['get system perf'], description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'get system performance status', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show system interface physical', fallbackCommands: ['get system interface'], description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'get system status', description: 'Check firmware version and uptime' },
    log: { type: 'log', name: 'Recent Logs', command: 'execute log filter category event\n' + 'execute log display', description: 'View recent system logs' },
    // FortiGate 核心巡检
    security_policy: { type: 'security_policy', name: 'Firewall Policies', command: 'show firewall policy', description: 'View all firewall policies', deviceTypes: ['firewall'] },
    nat: { type: 'nat', name: 'NAT Policies', command: 'show firewall ippool', fallbackCommands: ['show firewall central-snat-map'], description: 'View NAT policies', deviceTypes: ['firewall', 'gateway'] },
    session: { type: 'session', name: 'Session Statistics', command: 'get system sessions', fallbackCommands: ['diagnose sys session count'], description: 'View concurrent session statistics', deviceTypes: ['firewall'] },
    vpn: { type: 'vpn', name: 'VPN Tunnels', command: 'diagnose vpn tunnel list', fallbackCommands: ['get vpn ipsec tunnel details'], description: 'View IPSec VPN tunnels', deviceTypes: ['firewall', 'gateway'] },
    routes: { type: 'routes', name: 'Routing Table', command: 'get router info routing-table all', description: 'View routing table', deviceTypes: ['firewall', 'router'] },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'get lldp neighbors', description: 'View LLDP neighbors' },
    bgp: { type: 'bgp', name: 'BGP Status', command: 'get router info bgp summary', deviceTypes: ['firewall', 'router'], description: 'View BGP neighbors' },
    ospf: { type: 'ospf', name: 'OSPF Status', command: 'get router info ospf neighbor', deviceTypes: ['firewall', 'router'], description: 'View OSPF neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show system ntp', fallbackCommands: ['get system ntp status'], description: 'View NTP status' },
    license: { type: 'license', name: 'License / Subscription', command: 'get system license', fallbackCommands: ['show system fortiguard'], description: 'Check License expiration date and FortiGuard subscription' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show system dhcp server', deviceTypes: ['firewall', 'gateway'], description: 'View DHCP configuration' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show system dns', description: 'View DNS server configuration' },
    wlan: { type: 'wlan', name: 'Wireless Information', command: 'get wireless ap list', fallbackCommands: ['get wireless client list'], description: 'View wireless access points and clients', deviceTypes: ['wlc', 'ap'] },
    config_checksum: { type: 'config_checksum', name: 'Configuration Snapshot', command: 'execute backup config checksum', description: 'View configuration checksum' },
    environment: { type: 'environment', name: 'Hardware Status', command: 'get system hardware status', description: 'View hardware temperature, fans, and power' },
    power: { type: 'power', name: 'Power Status', command: 'get system hardware status', description: 'View power module status' },
    fan: { type: 'fan', name: 'Fan Status', command: 'get system hardware status', description: 'View fan status' },
    stp: { type: 'stp', name: 'STP Status', command: 'diagnose system bridge mac', description: 'View spanning tree status' },
    vlan: { type: 'vlan', name: 'VLAN Interfaces', command: 'show system interface | grep -E "vlan|Vlan"', description: 'View VLAN interfaces' },
    arp: { type: 'arp', name: 'ARP table', command: 'get system arp', description: 'View ARP table' },
    mac: { type: 'mac', name: 'MAC Address Table', command: 'diagnose device-switch mac-address', description: 'View MAC address table' },
    optic: { type: 'optic', name: 'Optical Transceiver Information', command: 'diagnose system transceiver', deviceTypes: ['switch'], description: 'View optical transceiver parameters' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
