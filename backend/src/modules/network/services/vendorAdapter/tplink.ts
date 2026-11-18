import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// TP-Link JetStream 适配器
// ====================================================================
export class TplinkAdapter implements VendorAdapter {
  vendor: VendorType = 'tplink';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show process cpu', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show memory', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interface status', description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check firmware version' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show ip route', description: 'View routing table' },
    log: { type: 'log', name: 'System Logs', command: 'show log buffer', description: 'View system logs' },
    stp: { type: 'stp', name: 'STP Status', command: 'show spanning-tree', description: 'View STP status' },
    vlan: { type: 'vlan', name: 'VLAN Information', command: 'show vlan', description: 'View VLAN configuration' },
    arp: { type: 'arp', name: 'ARP table', command: 'show arp', description: 'View ARP table' },
    mac: { type: 'mac', name: 'MAC Address Table', command: 'show mac-address-table', description: 'View MAC table' },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp neighbor', description: 'View LLDP neighbors' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp status', description: 'View NTP status' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Summary', command: 'show running-config | include hostname', description: 'View configuration summary' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show ip dhcp pool', deviceTypes: ['router', 'switch'], description: 'View DHCP pool' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
