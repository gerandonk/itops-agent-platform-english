import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// 华三 Comware 适配器
// ====================================================================
export class H3cAdapter implements VendorAdapter {
  vendor: VendorType = 'h3c';

  // 与华为 VRP 命令高度相似，继承大部分
  private templates: Record<InspectionType, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'display cpu-usage', description: 'Check device CPU utilization', expectedPattern: 'CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'display memory-usage', fallbackCommands: ['display memory'], description: 'Check device memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'display interface brief', description: 'Check physical status of all interfaces', expectedPattern: 'Link|Protocol' },
    version: { type: 'version', name: 'System Version', command: 'display version', description: 'Check device model, software version, and uptime' },
    routes: { type: 'routes', name: 'Routing Table', command: 'display ip routing-table', description: 'Check routing table' },
    log: { type: 'log', name: 'Log Buffer', command: 'display logbuffer', fallbackCommands: ['display trapbuffer'], description: 'Check recent system logs' },
    environment: { type: 'environment', name: 'Environmental Status', command: 'display environment', fallbackCommands: ['display temperature'], description: 'Check temperature and voltage' },
    power: { type: 'power', name: 'Power Status', command: 'display power', fallbackCommands: ['display device power'], description: 'Check power status' },
    fan: { type: 'fan', name: 'Fan Status', command: 'display fan', fallbackCommands: ['display device fan'], description: 'Check fan status' },
    stp: { type: 'stp', name: 'STP Status', command: 'display stp', fallbackCommands: ['display stp brief'], description: 'Check STP status' },
    vlan: { type: 'vlan', name: 'VLAN Information', command: 'display vlan', fallbackCommands: ['display vlan all'], description: 'Check VLAN configuration' },
    arp: { type: 'arp', name: 'ARP table', command: 'display arp', description: 'Check ARP table entries' },
    mac: { type: 'mac', name: 'MAC Address Table', command: 'display mac-address', fallbackCommands: ['display mac-address statistics'], description: 'Check MAC address table' },
    // 新增维度
    optic: { type: 'optic', name: 'Optical Transceiver Information', command: 'display transceiver verbose', fallbackCommands: ['display optical-info'], description: 'Check optical transceiver TX/RX optical power', deviceTypes: ['switch'] },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'display lldp neighbor brief', description: 'View LLDP neighbor discovery information' },
    security_policy: { type: 'security_policy', name: 'Security Policies', command: 'display security-policy rule all', fallbackCommands: ['display acl all'], description: 'View security policy configuration', deviceTypes: ['firewall', 'gateway'] },
    nat: { type: 'nat', name: 'NAT Translation', command: 'display nat session summary', fallbackCommands: ['display nat outbound'], description: 'View NAT sessions', deviceTypes: ['firewall', 'router', 'gateway'] },
    session: { type: 'session', name: 'Session Statistics', command: 'display session statistics', description: 'View session status', deviceTypes: ['firewall'] },
    vpn: { type: 'vpn', name: 'VPN Tunnels', command: 'display ike sa', fallbackCommands: ['display ipsec sa'], description: 'View VPN tunnel status', deviceTypes: ['firewall', 'router', 'gateway'] },
    wlan: { type: 'wlan', name: 'Wireless Information', command: 'display wlan ap all', fallbackCommands: ['display wlan client'], description: 'View wireless information', deviceTypes: ['wlc', 'ap'] },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'display dhcp server statistics', fallbackCommands: ['display ip pool'], description: 'View DHCP pool', deviceTypes: ['router', 'gateway', 'switch'] },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'display dns server', description: 'View DNS configuration' },
    bgp: { type: 'bgp', name: 'BGP Status', command: 'display bgp peer', description: 'View BGP neighbors', deviceTypes: ['router', 'firewall'] },
    ospf: { type: 'ospf', name: 'OSPF Status', command: 'display ospf peer', description: 'View OSPF neighbors', deviceTypes: ['router', 'switch'] },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'display ntp status', fallbackCommands: ['display ntp-service status'], description: 'View NTP synchronization status' },
    license: { type: 'license', name: 'License Validity', command: 'display license', description: 'View License information' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Snapshot', command: 'display current-configuration | include sysname', description: 'View configuration summary' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    const all = types ? types.map(t => this.templates[t]).filter(Boolean) : Object.values(this.templates);
    return filterByDeviceType(all, deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
