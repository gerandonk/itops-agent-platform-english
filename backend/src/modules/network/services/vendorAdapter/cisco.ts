import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// 思科 IOS/IOS-XE/NX-OS 适配器
// ====================================================================
export class CiscoAdapter implements VendorAdapter {
  vendor: VendorType = 'cisco';

  private templates: Record<InspectionType, CommandTemplate> = {
    cpu: {
      type: 'cpu', name: 'CPU Utilization',
      command: 'show processes cpu | include CPU utilization',
      description: 'Check device CPU utilization, normally should be below 80%',
      expectedPattern: 'CPU utilization', thresholds: { warning: 70, critical: 85 },
    },
    memory: {
      type: 'memory', name: 'Memory Utilization',
      command: 'show memory statistics',
      description: 'Check device memory utilization, normally should be below 85%',
      expectedPattern: 'Pool', thresholds: { warning: 75, critical: 90 },
    },
    interface: {
      type: 'interface', name: 'Interface status',
      command: 'show ip interface brief',
      description: 'Check physical and protocol status of all interfaces',
      expectedPattern: 'Interface|Status',
    },
    version: {
      type: 'version', name: 'System Version',
      command: 'show version',
      description: 'Check device model, software version, and uptime',
    },
    routes: {
      type: 'routes', name: 'Routing Table',
      command: 'show ip route',
      description: 'Check routing table status and route count',
    },
    log: {
      type: 'log', name: 'Log Buffer',
      command: 'show logging',
      description: 'Check recent system logs and alarm information',
    },
    environment: {
      type: 'environment', name: 'Environmental Status',
      command: 'show environment all',
      description: 'Check device temperature and voltage status',
    },
    power: {
      type: 'power', name: 'Power Status',
      command: 'show power',
      description: 'Check power module status',
    },
    fan: {
      type: 'fan', name: 'Fan Status',
      command: 'show environment fan',
      description: 'Check fan module operating status',
    },
    stp: {
      type: 'stp', name: 'STP Status',
      command: 'show spanning-tree brief',
      description: 'Check Spanning Tree Protocol status and port roles',
    },
    vlan: {
      type: 'vlan', name: 'VLAN Information',
      command: 'show vlan brief',
      description: 'Check VLAN configuration and port members',
    },
    arp: {
      type: 'arp', name: 'ARP table',
      command: 'show ip arp',
      description: 'Check ARP table entry count and status',
    },
    mac: {
      type: 'mac', name: 'MAC Address Table',
      command: 'show mac address-table',
      description: 'Check MAC address table entries',
    },
    // ---- 新增 ----
    optic: {
      type: 'optic', name: 'Optical Transceiver Information',
      command: 'show interfaces transceiver detail',
      fallbackCommands: ['show interfaces transceiver'],
      description: 'Check optical transceiver TX/RX optical power and temperature',
      deviceTypes: ['switch'],
    },
    neighbor: {
      type: 'neighbor', name: 'LLDP Neighbors',
      command: 'show lldp neighbors detail',
      fallbackCommands: ['show cdp neighbors detail'],
      description: 'View LLDP/CDP neighbor discovery information',
    },
    security_policy: {
      type: 'security_policy', name: 'Security Policies',
      command: 'show access-list',
      fallbackCommands: ['show ip access-list', 'show running-config | section ip access-list'],
      description: 'View ACL/security policy configuration',
      deviceTypes: ['firewall', 'router'],
    },
    nat: {
      type: 'nat', name: 'NAT Translation',
      command: 'show ip nat translations',
      fallbackCommands: ['show running-config | include nat'],
      description: 'View NAT translation table',
      deviceTypes: ['firewall', 'router', 'gateway'],
    },
    vpn: {
      type: 'vpn', name: 'VPN Tunnels',
      command: 'show crypto isakmp sa',
      fallbackCommands: ['show crypto ipsec sa', 'show vpn-sessiondb'],
      description: 'View IPSec VPN tunnel status',
      deviceTypes: ['firewall', 'router', 'gateway'],
    },
    wlan: {
      type: 'wlan', name: 'Wireless Information',
      command: 'show ap summary',
      fallbackCommands: ['show wireless client summary'],
      description: 'View wireless access points and clients',
      deviceTypes: ['wlc', 'ap'],
    },
    pool: {
      type: 'pool', name: 'DHCP Pool',
      command: 'show ip dhcp binding',
      fallbackCommands: ['show ip dhcp pool'],
      description: 'View DHCP address pool utilization',
      deviceTypes: ['router', 'gateway', 'switch'],
    },
    dns: {
      type: 'dns', name: 'DNS Configuration',
      command: 'show running-config | include name-server',
      fallbackCommands: ['show hosts'],
      description: 'View DNS server configuration',
    },
    bgp: {
      type: 'bgp', name: 'BGP Status',
      command: 'show bgp summary',
      fallbackCommands: ['show ip bgp summary'],
      description: 'View BGP neighbor status',
      deviceTypes: ['router', 'firewall'],
    },
    ospf: {
      type: 'ospf', name: 'OSPF Status',
      command: 'show ip ospf neighbor',
      description: 'View OSPF neighbor status',
      deviceTypes: ['router', 'switch'],
    },
    ntp: {
      type: 'ntp', name: 'NTP Status',
      command: 'show ntp associations',
      fallbackCommands: ['show ntp status'],
      description: 'View NTP synchronization status',
    },
    license: {
      type: 'license', name: 'License Validity',
      command: 'show license summary',
      fallbackCommands: ['show license usage'],
      description: 'View License validity and feature authorization',
    },
    config_checksum: {
      type: 'config_checksum', name: 'Configuration Snapshot',
      command: 'show running-config | include hostname',
      description: 'View running configuration summary snapshot',
    },
    // Cisco 特有
    session: {
      type: 'session', name: 'Firewall Sessions',
      command: 'show conn count',
      description: 'View firewall concurrent connection count',
      deviceTypes: ['firewall'],
    },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    const all = types
      ? types.map(t => this.templates[t]).filter(Boolean)
      : Object.values(this.templates);
    return filterByDeviceType(all, deviceType);
  }

  getCommand(type: InspectionType): CommandTemplate | undefined {
    return this.templates[type];
  }

  supportsEnablePassword(): boolean { return true; }
}
