import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// HPE/Aruba ProVision/Comware 适配器
// ====================================================================
export class HpeAdapter implements VendorAdapter {
  vendor: VendorType = 'hpe';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show system cpu', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show system memory', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interfaces brief', description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check system version' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show ip route', description: 'View routing table' },
    log: { type: 'log', name: 'Recent Logs', command: 'show logging -r', description: 'View recent logs' },
    stp: { type: 'stp', name: 'STP Status', command: 'show spanning-tree', description: 'View STP status' },
    vlan: { type: 'vlan', name: 'VLAN Information', command: 'show vlan', description: 'View VLAN configuration' },
    arp: { type: 'arp', name: 'ARP table', command: 'show arp', description: 'View ARP table' },
    mac: { type: 'mac', name: 'MAC Address Table', command: 'show mac-address', description: 'View MAC table' },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp info remote-device', description: 'View LLDP neighbors' },
    bgp: { type: 'bgp', name: 'BGP Status', command: 'show bgp summary', deviceTypes: ['router', 'switch'], description: 'View BGP neighbors' },
    ospf: { type: 'ospf', name: 'OSPF Status', command: 'show ip ospf neighbor', deviceTypes: ['router', 'switch'], description: 'View OSPF neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp', description: 'View NTP status' },
    environment: { type: 'environment', name: 'Environmental Status', command: 'show system environment', description: 'View temperature/power/fans' },
    power: { type: 'power', name: 'Power Status', command: 'show system power-supply', description: 'View power status' },
    fan: { type: 'fan', name: 'Fan Status', command: 'show system fan', description: 'View fan status' },
    optic: { type: 'optic', name: 'Optical Transceiver Information', command: 'show interfaces transceiver', deviceTypes: ['switch'], description: 'View optical transceiver parameters' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show ip dns', description: 'View DNS configuration' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Snapshot', command: 'show running-config | include hostname', description: 'View configuration summary' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show ip dhcp server', deviceTypes: ['router', 'switch'], description: 'View DHCP pool' },
    license: { type: 'license', name: 'License Information', command: 'show license', description: 'View License' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
