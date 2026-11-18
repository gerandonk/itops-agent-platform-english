import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// 华为 VRP 适配器（交换机 / 路由器 / 防火墙）
// ====================================================================
export class HuaweiAdapter implements VendorAdapter {
  vendor: VendorType = 'huawei';

  private templates: Record<InspectionType, CommandTemplate> = {
    cpu: {
      type: 'cpu', name: 'CPU Utilization',
      command: 'display cpu-usage',
      fallbackCommands: ['display cpu'],
      description: 'Check device CPU utilization, normally should be below 80%',
      expectedPattern: 'CPU utilization', thresholds: { warning: 70, critical: 85 },
    },
    memory: {
      type: 'memory', name: 'Memory Utilization',
      command: 'display memory-usage',
      fallbackCommands: ['display memory', 'display memory-threshold'],
      description: 'Check device memory utilization, normally should be below 85%',
      expectedPattern: 'Memory', thresholds: { warning: 75, critical: 90 },
    },
    interface: {
      type: 'interface', name: 'Interface status',
      command: 'display interface brief',
      fallbackCommands: ['display ip interface brief'],
      description: 'Check physical and protocol status of all interfaces',
      expectedPattern: 'PHY|Protocol',
    },
    version: {
      type: 'version', name: 'System Version',
      command: 'display version',
      description: 'Check device model, software version, and uptime',
    },
    routes: {
      type: 'routes', name: 'Routing Table',
      command: 'display ip routing-table',
      fallbackCommands: ['display ip routing-table statistics'],
      description: 'Check routing table status and route count',
    },
    log: {
      type: 'log', name: 'Log Buffer',
      command: 'display logbuffer',
      fallbackCommands: ['display trapbuffer', 'display syslog'],
      description: 'Check recent system logs and alarm information',
    },
    environment: {
      type: 'environment', name: 'Environmental Status',
      command: 'display temperature',
      fallbackCommands: ['display device temperature', 'display environment'],
      description: 'Check device temperature and voltage status',
      models: ['NE', 'CE', 'S5700', 'S6700'],
    },
    power: {
      type: 'power', name: 'Power Status',
      command: 'display power',
      fallbackCommands: ['display device power', 'display system-power'],
      description: 'Check power module status',
      models: ['NE', 'CE', 'S5700', 'S6700'],
    },
    fan: {
      type: 'fan', name: 'Fan Status',
      command: 'display fan',
      fallbackCommands: ['display device fan'],
      description: 'Check fan module operating status',
      models: ['NE', 'CE', 'S5700', 'S6700'],
    },
    stp: {
      type: 'stp', name: 'STP Status',
      command: 'display stp',
      fallbackCommands: ['display stp brief', 'display spanning-tree'],
      description: 'Check Spanning Tree Protocol status and port roles',
    },
    vlan: {
      type: 'vlan', name: 'VLAN Information',
      command: 'display vlan',
      fallbackCommands: ['display vlan summary'],
      description: 'Check VLAN configuration and port members',
    },
    arp: {
      type: 'arp', name: 'ARP table',
      command: 'display arp',
      description: 'Check ARP table entry count and status',
    },
    mac: {
      type: 'mac', name: 'MAC Address Table',
      command: 'display mac-address',
      fallbackCommands: ['display mac-address summary'],
      description: 'Check MAC address table entries',
    },
    // ---- 新增巡检维度 ----
    optic: {
      type: 'optic', name: 'Optical Transceiver Information',
      command: 'display optical-info',
      fallbackCommands: ['display transceiver verbose', 'display interface transceiver'],
      description: 'Check optical transceiver TX/RX optical power and temperature',
      deviceTypes: ['switch'],
    },
    neighbor: {
      type: 'neighbor', name: 'LLDP Neighbors',
      command: 'display lldp neighbor brief',
      fallbackCommands: ['display cdp neighbor'],
      description: 'View LLDP neighbor discovery information',
    },
    security_policy: {
      type: 'security_policy', name: 'Security Policies',
      command: 'display security-policy rule all',
      fallbackCommands: ['display acl all', 'display firewall rule'],
      description: 'View firewall security policy configuration',
      deviceTypes: ['firewall', 'gateway'],
    },
    nat: {
      type: 'nat', name: 'NAT Translation',
      command: 'display nat session summary',
      fallbackCommands: ['display nat outbound', 'display nat server'],
      description: 'View NAT session statistics and mappings',
      deviceTypes: ['firewall', 'router', 'gateway'],
    },
    session: {
      type: 'session', name: 'Session Statistics',
      command: 'display firewall session table',
      fallbackCommands: ['display session statistics'],
      description: 'View firewall session status',
      deviceTypes: ['firewall'],
    },
    vpn: {
      type: 'vpn', name: 'VPN Tunnels',
      command: 'display ike sa',
      fallbackCommands: ['display ipsec sa', 'display ipsec tunnel'],
      description: 'View IPSec VPN tunnel status',
      deviceTypes: ['firewall', 'router', 'gateway'],
    },
    wlan: {
      type: 'wlan', name: 'Wireless Information',
      command: 'display wlan ap all',
      fallbackCommands: ['display wlan client', 'display wlan radio'],
      description: 'View wireless access point and client status',
      deviceTypes: ['wlc', 'ap'],
    },
    pool: {
      type: 'pool', name: 'DHCP Pool',
      command: 'display ip pool',
      fallbackCommands: ['display dhcp server statistics'],
      description: 'View DHCP address pool utilization',
      deviceTypes: ['router', 'gateway', 'switch'],
    },
    dns: {
      type: 'dns', name: 'DNS Configuration',
      command: 'display dns server',
      description: 'View DNS server configuration',
    },
    bgp: {
      type: 'bgp', name: 'BGP Status',
      command: 'display bgp peer',
      fallbackCommands: ['display bgp peer verbose'],
      description: 'View BGP neighbor status',
      deviceTypes: ['router', 'firewall'],
    },
    ospf: {
      type: 'ospf', name: 'OSPF Status',
      command: 'display ospf peer',
      fallbackCommands: ['display ospf interface', 'display ospf routing'],
      description: 'View OSPF neighbor status',
      deviceTypes: ['router', 'switch'],
    },
    ntp: {
      type: 'ntp', name: 'NTP Status',
      command: 'display ntp status',
      fallbackCommands: ['display ntp-service status'],
      description: 'View NTP synchronization status',
    },
    license: {
      type: 'license', name: 'License Validity',
      command: 'display license',
      description: 'View License validity and feature authorization',
    },
    config_checksum: {
      type: 'config_checksum', name: 'Configuration Snapshot',
      command: 'display current-configuration | include sysname',
      fallbackCommands: ['display saved-configuration last-time'],
      description: 'View last saved time and summary of running configuration',
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
