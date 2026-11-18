import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// 中兴 ZTE ZXR10 适配器
// ====================================================================
export class ZteAdapter implements VendorAdapter {
  vendor: VendorType = 'zte';
  private templates: Record<InspectionType, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show cpu', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show memory', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interface brief', description: 'Check interface status' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check system version' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show ip route', description: 'Check routing table' },
    log: { type: 'log', name: 'Log Buffer', command: 'show log', description: 'Check logs' },
    environment: { type: 'environment', name: 'Environmental Status', command: 'show environment', description: 'Check environment status' },
    power: { type: 'power', name: 'Power Status', command: 'show power', description: 'Check power status' },
    fan: { type: 'fan', name: 'Fan Status', command: 'show fan', description: 'Check fan status' },
    stp: { type: 'stp', name: 'STP Status', command: 'show spanning-tree', description: 'Check STP status' },
    vlan: { type: 'vlan', name: 'VLAN Information', command: 'show vlan', description: 'Check VLAN' },
    arp: { type: 'arp', name: 'ARP table', command: 'show arp', description: 'Check ARP table' },
    mac: { type: 'mac', name: 'MAC Address Table', command: 'show mac-address-table', description: 'Check MAC table' },
    optic: { type: 'optic', name: 'Optical Transceiver Information', command: 'show transceiver', deviceTypes: ['switch'], description: 'Check optical transceivers' },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp neighbors', description: 'View LLDP neighbors' },
    nat: { type: 'nat', name: 'NAT Translation', command: 'show ip nat translations', deviceTypes: ['firewall', 'router'], description: 'View NAT table' },
    bgp: { type: 'bgp', name: 'BGP Status', command: 'show bgp summary', deviceTypes: ['router'], description: 'View BGP' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp status', description: 'View NTP' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show ip dhcp binding', deviceTypes: ['router'], description: 'View DHCP' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show dns server', description: 'View DNS' },
    session: { type: 'session', name: 'Session Statistics', command: 'show session statistics', description: 'View session statistics', deviceTypes: ['firewall'] },
    wlan: { type: 'wlan', name: 'Wireless Information', command: 'show wlan ap summary', deviceTypes: ['wlc', 'ap'], description: 'View wireless AP information' },
    ospf: { type: 'ospf', name: 'OSPF Status', command: 'show ip ospf neighbor', deviceTypes: ['router', 'switch'], description: 'View OSPF neighbors' },
    security_policy: { type: 'security_policy', name: 'ACL Policies', command: 'show access-list', deviceTypes: ['firewall'], description: 'View ACL' },
    vpn: { type: 'vpn', name: 'VPN Tunnels', command: 'show ipsec sa', deviceTypes: ['firewall', 'router'], description: 'View VPN' },
    license: { type: 'license', name: 'License Information', command: 'show license', description: 'View License' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Summary', command: 'show running-config | include sysname', description: 'View configuration summary' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    const all = types ? types.map(t => this.templates[t]).filter(Boolean) : Object.values(this.templates);
    return filterByDeviceType(all, deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
