import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// Ubiquiti EdgeSwitch / UniFi 适配器
// ====================================================================
export class UbiquitiAdapter implements VendorAdapter {
  vendor: VendorType = 'ubiquiti';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'show system processes cpu', description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'show system memory', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'show interfaces', description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'show version', description: 'Check EdgeOS version' },
    routes: { type: 'routes', name: 'Routing Table', command: 'show ip route', description: 'View routing table' },
    log: { type: 'log', name: 'Recent Logs', command: 'show log | tail -30', description: 'View recent logs' },
    nat: { type: 'nat', name: 'NAT Rules', command: 'show nat', description: 'View NAT rules', deviceTypes: ['firewall', 'router', 'gateway'] },
    neighbor: { type: 'neighbor', name: 'LLDP Neighbors', command: 'show lldp neighbors', description: 'View LLDP neighbors' },
    stp: { type: 'stp', name: 'STP Status', command: 'show spanning-tree', description: 'View STP status' },
    vlan: { type: 'vlan', name: 'VLAN Configuration', command: 'show vlan', description: 'View VLAN configuration' },
    arp: { type: 'arp', name: 'ARP table', command: 'show arp', description: 'View ARP table' },
    mac: { type: 'mac', name: 'MAC Table', command: 'show mac-address-table', description: 'View MAC table' },
    pool: { type: 'pool', name: 'DHCP Pool', command: 'show dhcp leases', deviceTypes: ['router', 'gateway'], description: 'View DHCP leases' },
    dns: { type: 'dns', name: 'DNS Configuration', command: 'show dns', description: 'View DNS configuration' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'show ntp', description: 'View NTP status' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Summary', command: 'show configuration | head -5', description: 'View configuration summary' },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
