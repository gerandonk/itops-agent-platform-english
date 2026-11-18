import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// 锐捷（传统命令集）
// ====================================================================
export class RuijieAdapter implements VendorAdapter {
  vendor: VendorType = 'ruijie';
  private templates: Record<InspectionType, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show cpu', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show memory', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interfaces status', description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check system version' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show ip route', description: 'Check routing table' },
    log: { type: 'log', name: 'Log Buffer', command: 'show logging', description: 'Check logs' },
    environment: { type: 'environment', name: 'Environmental Status', command: 'show environment', description: 'Check environment status' },
    power: { type: 'power', name: 'Power Status', command: 'show power', description: 'Check power status' },
    fan: { type: 'fan', name: 'Fan Status', command: 'show fan', description: 'Check fan status' },
    stp: { type: 'stp', name: 'STP Status', command: 'show spanning-tree', description: 'Check STP status' },
    vlan: { type: 'vlan', name: 'VLAN Information', command: 'show vlan', description: 'Check VLAN configuration' },
    arp: { type: 'arp', name: 'ARP table', command: 'show arp', description: 'Check ARP table' },
    mac: { type: 'mac', name: 'MAC Address Table', command: 'show mac-address-table', description: 'Check MAC table' },
    // 新增
    optic: { type: 'optic', name: 'Optical Transceiver Information', command: 'show interfaces transceiver', deviceTypes: ['switch'], description: 'Check optical transceivers' },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp neighbors', description: 'View LLDP neighbors' },
    nat: { type: 'nat', name: 'NAT Translation', command: 'show ip nat translations', deviceTypes: ['firewall', 'router', 'gateway'], description: 'View NAT table' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show ip dhcp binding', deviceTypes: ['router', 'gateway', 'switch'], description: 'View DHCP pool' },
    bgp: { type: 'bgp', name: 'BGP Status', command: 'show ip bgp summary', deviceTypes: ['router', 'firewall'], description: 'View BGP neighbors' },
    ospf: { type: 'ospf', name: 'OSPF Status', command: 'show ip ospf neighbor', deviceTypes: ['router', 'switch'], description: 'View OSPF neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp status', description: 'View NTP status' },
    security_policy: { type: 'security_policy', name: 'ACL Policies', command: 'show access-lists', deviceTypes: ['firewall', 'router'], description: 'View ACL policies' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show running-config | include nameserver', description: 'View DNS configuration' },
    vpn: { type: 'vpn', name: 'VPN Tunnels', command: 'show crypto isakmp sa', deviceTypes: ['firewall', 'router', 'gateway'], description: 'View VPN tunnels' },
    wlan: { type: 'wlan', name: 'Wireless Information', command: 'show wlan ap summary', deviceTypes: ['wlc', 'ap'], description: 'View wireless information' },
    session: { type: 'session', name: 'Session Statistics', command: 'show conn count', deviceTypes: ['firewall'], description: 'View session count' },
    license: { type: 'license', name: 'License Information', command: 'show license', description: 'View License information' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Summary', command: 'show running-config | include hostname', description: 'View configuration summary' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    const all = types ? types.map(t => this.templates[t]).filter(Boolean) : Object.values(this.templates);
    return filterByDeviceType(all, deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
