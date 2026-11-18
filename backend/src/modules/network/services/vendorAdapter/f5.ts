import type { VendorAdapter, VendorType, CommandTemplate, InspectionType, DeviceType } from './types';
import { filterByDeviceType } from './shared';

// ====================================================================
// F5 BIG-IP 负载均衡适配器
// ====================================================================
export class F5Adapter implements VendorAdapter {
  vendor: VendorType = 'f5';
  private templates: Record<string, CommandTemplate> = {
    cpu: { type: 'cpu', name: 'CPU Utilization', command: 'tmsh show sys performance module cpu | grep "CPU"', fallbackCommands: ['tmsh show sys cpu'], description: 'Check CPU utilization', thresholds: { warning: 70, critical: 85 } },
    memory: { type: 'memory', name: 'Memory Utilization', command: 'tmsh show sys memory', description: 'Check memory utilization', thresholds: { warning: 75, critical: 90 } },
    interface: { type: 'interface', name: 'Interface status', command: 'tmsh show net interface', fallbackCommands: ['ifconfig -a'], description: 'Check all interface statuses' },
    version: { type: 'version', name: 'System Version', command: 'tmsh show sys version', description: 'Check BIG-IP version' },
    log: { type: 'log', name: 'Recent Logs', command: 'tmsh show ltm log last 30', fallbackCommands: ['cat /var/log/ltm | tail -30'], description: 'View recent LTM logs' },
    // F5 核心
    pool: { type: 'pool', name: 'Pool Status', command: 'tmsh show ltm pool', description: 'View all pools and member statuses', deviceTypes: ['loadbalancer'] },
    session: { type: 'session', name: 'Connection Statistics', command: 'tmsh show sys performance module connections', description: 'View current connection count statistics', deviceTypes: ['loadbalancer'] },
    dns: { type: 'dns', name: 'DNS Resolution', command: 'tmsh show ltm dns', description: 'View DNS resolution configuration' },
    ntp: { type: 'ntp', name: 'NTP Status', command: 'tmsh show sys ntp', description: 'View NTP synchronization status' },
    license: { type: 'license', name: 'License Information', command: 'tmsh show sys license', description: 'View License validity' },
    routes: { type: 'routes', name: 'Routing Table', command: 'tmsh show net route', description: 'View routing table' },
    arp: { type: 'arp', name: 'ARP table', command: 'tmsh show net arp', description: 'View ARP table' },
    config_checksum: { type: 'config_checksum', name: 'Configuration Snapshot', command: 'tmsh show sys version | uname -a', description: 'View basic device information' },
    vpn: { type: 'vpn', name: 'VPN / APM Status', command: 'tmsh show apm session', description: 'View APM VPN sessions', deviceTypes: ['loadbalancer'] },
  };

  getCommands(types?: InspectionType[], deviceType?: DeviceType): CommandTemplate[] {
    if (!types) return filterByDeviceType(Object.values(this.templates), deviceType);
    return filterByDeviceType(types.map(t => this.templates[t]).filter(Boolean), deviceType);
  }
  getCommand(type: InspectionType): CommandTemplate | undefined { return this.templates[type]; }
  supportsEnablePassword(): boolean { return true; }
}
