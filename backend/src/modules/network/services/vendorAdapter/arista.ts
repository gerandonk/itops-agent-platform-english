import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// Arista EOS 适配器
// ====================================================================
export class AristaAdapter implements VendorAdapter {
  vendor: VendorType = 'arista';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show processes top | grep Cpu', fallbackCommands: ['show system resources'], description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show system memory', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interfaces status', description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check EOS version' },
    log: { type: 'log', name: 'Recent Logs', command: 'show logging last 30', description: 'View recent logs' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show ip route summary', description: 'View routing table summary' },
    bgp: { type: 'bgp', name: 'BGP Status', command: 'show bgp summary', deviceTypes: ['router', 'switch'], description: 'View BGP neighbors' },
    ospf: { type: 'ospf', name: 'OSPF Status', command: 'show ip ospf neighbor', deviceTypes: ['router', 'switch'], description: 'View OSPF neighbors' },
    stp: { type: 'stp', name: 'STP Status', command: 'show spanning-tree', description: 'View STP status' },
    vlan: { type: 'vlan', name: 'VLAN Information', command: 'show vlan', description: 'View VLAN configuration' },
    arp: { type: 'arp', name: 'ARP table', command: 'show ip arp', description: 'View ARP table' },
    mac: { type: 'mac', name: 'MAC Address Table', command: 'show mac address-table', description: 'View MAC table' },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp neighbors detail', description: 'View LLDP neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp status', description: 'View NTP synchronization' },
    optic: { type: 'optic', name: 'Optical Transceiver Information', command: 'show interfaces transceiver', deviceTypes: ['switch'], description: 'View optical transceiver parameters' },
    environment: { type: 'environment', name: 'Environmental Status', command: 'show system environment', description: 'View temperature/power/fans' },
    power: { type: 'power', name: 'Power Status', command: 'show system environment power', description: 'View power status' },
    fan: { type: 'fan', name: 'Fan Status', command: 'show system environment fan', description: 'View fan status' },
    license: { type: 'license', name: 'License Information', command: 'show license', description: 'View License' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show hosts', description: 'View DNS configuration' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Summary', command: 'show running-config | grep hostname', description: 'View configuration summary' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show ip dhcp server leases summary', deviceTypes: ['router', 'switch'], description: 'View DHCP leases' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
